from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models import Complaint, ComplaintEvent, ComplaintAttachment, Employee
from schemas import ComplaintCreate, ComplaintOut, ComplaintEventOut, AttachmentOut, NotificationOut
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import random, os, shutil
from auth import get_current_user
from email_utils import send_email

router = APIRouter(prefix="/api/complaints", tags=["complaints"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class StatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None

class StageUpdate(BaseModel):
    note: Optional[str] = None

STAGE_ORDER = ["Submitted", "Facility Head Inspection", "Admin Review", "Final Verification"]

CATEGORY_TO_HEAD_ROLE = {
    "Infrastructure": "Infrastructure Head",
    "Operations": "Operations Head",
    "Loans": "Loans Head",
    "IT Department": "IT Head",
    "Hr": "Hr Head",
}

STAGE_PERMISSIONS = {
    "Admin Review": ["Admin", "HR"],
    "Final Verification": ["Super Admin"],
}


@router.get("/", response_model=List[ComplaintOut])
def list_complaints(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    query = db.query(Complaint)

    # Employees only see their own submissions.
    if current_user.role == "Employee":
        query = query.filter(Complaint.submitted_by == current_user.id)
    else:
        # Department heads only see complaints for their own category.
        role_to_category = {v: k for k, v in CATEGORY_TO_HEAD_ROLE.items()}
        if current_user.role in role_to_category:
            query = query.filter(Complaint.category == role_to_category[current_user.role])

    complaints = query.order_by(Complaint.created_at.desc()).all()
    for c in complaints:
        employee = db.query(Employee).filter(Employee.id == c.submitted_by).first()
        c.submitter_name = employee.name if employee else "Unknown"
    return complaints


@router.post("/", response_model=ComplaintOut)
def create_complaint(
    payload: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Super Admin / Chairman is a reviewing role only — never submits
    # complaints, even via direct API calls (Postman, etc).
    if current_user.role == "Super Admin":
        raise HTTPException(status_code=403, detail="Super Admin cannot submit complaints")

    reference_id = f"CB-{random.randint(89000, 89999)}"
    new_complaint = Complaint(
        **payload.dict(exclude={"submitted_by"}),
        reference_id=reference_id,
        submitted_by=current_user.id,
        # "Personal" complaints skip Facility Head Inspection and go
        # straight to Admin Review.
        current_stage="Admin Review" if payload.category == "Personal" else "Submitted"
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    db.add(ComplaintEvent(
        complaint_id=new_complaint.id,
        title="Submitted",
        note=f"Complaint submitted by {current_user.name}.",
    ))
    db.commit()

    if current_user.email:
        send_email(
            to_email=current_user.email,
            subject=f"Complaint Submitted — {new_complaint.reference_id}",
            body_html=f"""
                <p>Hi {current_user.name},</p>
                <p>Your complaint has been submitted successfully.</p>
                <p>
                    <strong>Reference ID:</strong> {new_complaint.reference_id}<br>
                    <strong>Title:</strong> {new_complaint.title}<br>
                    <strong>Category:</strong> {new_complaint.category}
                </p>
                <p>You can track its progress from your Complaint Box dashboard.</p>
            """,
        )

    # Also notify whoever needs to act next: the department head for this
    # category, or Admins directly if it's a Personal complaint (which
    # skips the department-head stage entirely).
    if new_complaint.category == "Personal":
        next_action_roles = ["Admin"]
    else:
        head_role = CATEGORY_TO_HEAD_ROLE.get(new_complaint.category)
        next_action_roles = [head_role] if head_role else []

    if next_action_roles:
        recipients = (
            db.query(Employee)
            .filter(Employee.role.in_(next_action_roles))
            .filter(Employee.email.isnot(None))
            .all()
        )
        for recipient in recipients:
            send_email(
                to_email=recipient.email,
                subject=f"New Complaint Awaiting Your Review — {new_complaint.reference_id}",
                body_html=f"""
                    <p>Hi {recipient.name},</p>
                    <p>A new complaint has been submitted and is awaiting your review.</p>
                    <p>
                        <strong>Reference ID:</strong> {new_complaint.reference_id}<br>
                        <strong>Title:</strong> {new_complaint.title}<br>
                        <strong>Category:</strong> {new_complaint.category}<br>
                        <strong>Submitted By:</strong> {current_user.name}
                    </p>
                    <p>Please log in to Complaint Box to review and take action.</p>
                """,
            )

    return new_complaint


@router.patch("/{complaint_id}/status", response_model=ComplaintOut)
def update_status(
    complaint_id: int,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role not in ["Admin", "HR"]:
        raise HTTPException(status_code=403, detail="Not authorized to change complaint status")

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint.status = payload.status
    db.commit()
    db.refresh(complaint)

    notes = {
        "Under Review": "Complaint moved back to review.",
        "Meeting Scheduled": "A meeting has been scheduled to discuss this complaint.",
        "Resolved": "Complaint marked as resolved.",
    }
    db.add(ComplaintEvent(
        complaint_id=complaint.id,
        title=payload.status,
        note=payload.note or notes.get(payload.status, ""),
    ))
    db.commit()

    return complaint


@router.patch("/{complaint_id}/advance-stage", response_model=ComplaintOut)
def advance_stage(
    complaint_id: int,
    payload: StageUpdate = StageUpdate(),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    current_index = STAGE_ORDER.index(complaint.current_stage)
    if current_index >= len(STAGE_ORDER) - 1:
        raise HTTPException(status_code=400, detail="Already at final stage")

    next_stage = STAGE_ORDER[current_index + 1]

    if next_stage == "Facility Head Inspection":
        required_role = CATEGORY_TO_HEAD_ROLE.get(complaint.category)
        allowed_roles = [required_role] if required_role else []
    else:
        allowed_roles = STAGE_PERMISSIONS[next_stage]

    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail=f"Only {' or '.join(allowed_roles) if allowed_roles else 'the assigned department head'} can complete this stage"
        )

    complaint.current_stage = next_stage
    db.commit()
    db.refresh(complaint)

    note_text = payload.note or f"{next_stage} completed by {current_user.name}"
    db.add(ComplaintEvent(
        complaint_id=complaint.id,
        title=next_stage,
        note=note_text,
    ))
    db.commit()

    return complaint


@router.get("/{complaint_id}/events", response_model=List[ComplaintEventOut])
def get_complaint_events(complaint_id: int, db: Session = Depends(get_db)):
    return (
        db.query(ComplaintEvent)
        .filter(ComplaintEvent.complaint_id == complaint_id)
        .order_by(ComplaintEvent.created_at.asc())
        .all()
    )


@router.post("/{complaint_id}/attachments", response_model=AttachmentOut)
def upload_attachment(
    complaint_id: int,
    file: UploadFile = File(...),
    stage: str = "Submitted",
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    clean_filename = file.filename.replace(" ", "_")
    safe_name = f"{complaint_id}_{random.randint(1000,9999)}_{clean_filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_url = f"http://localhost:8000/uploads/{safe_name}"
    attachment = ComplaintAttachment(complaint_id=complaint_id, file_url=file_url, stage=stage)
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment


@router.get("/{complaint_id}/attachments", response_model=List[AttachmentOut])
def get_attachments(complaint_id: int, db: Session = Depends(get_db)):
    return db.query(ComplaintAttachment).filter(ComplaintAttachment.complaint_id == complaint_id).all()


@router.get("/stats")
def complaint_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    base_query = db.query(Complaint)
    if current_user.role == "Employee":
        base_query = base_query.filter(Complaint.submitted_by == current_user.id)
    elif current_user.role in ["Infrastructure Head", "Operations Head", "Loans Head", "IT Head", "Hr Head"]:
        role_to_category = {v: k for k, v in CATEGORY_TO_HEAD_ROLE.items()}
        category = role_to_category.get(current_user.role)
        if category:
            base_query = base_query.filter(Complaint.category == category)
    # Admin, HR, Super Admin, System Admin see company-wide stats.

    total = base_query.count()
    resolved_complaints = base_query.filter(Complaint.status == "Resolved").all()

    resolved_count = len(resolved_complaints)
    total_days = 0
    within_sla_count = 0
    SLA_THRESHOLD_DAYS = 5  # adjust this to your actual SLA target

    for c in resolved_complaints:
        resolved_event = (
            db.query(ComplaintEvent)
            .filter(ComplaintEvent.complaint_id == c.id, ComplaintEvent.title == "Resolved")
            .order_by(ComplaintEvent.created_at.desc())
            .first()
        )
        if resolved_event:
            days_taken = (resolved_event.created_at - c.created_at).total_seconds() / 86400
            total_days += days_taken
            if days_taken <= SLA_THRESHOLD_DAYS:
                within_sla_count += 1

    avg_resolution_days = round(total_days / resolved_count, 1) if resolved_count else 0
    sla_compliance = round((within_sla_count / resolved_count) * 100, 1) if resolved_count else 0

    return {
        "open": base_query.filter(Complaint.status != "Resolved").count(),
        "underReview": base_query.filter(Complaint.status == "Under Review").count(),
        "meetingsScheduled": base_query.filter(Complaint.status == "Meeting Scheduled").count(),
        "resolved": resolved_count,
        "avgResolutionDays": avg_resolution_days,
        "slaCompliance": sla_compliance,
    }


@router.get("/notifications/recent", response_model=List[NotificationOut])
def get_recent_notifications(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    role = current_user.role
    role_to_category = {v: k for k, v in CATEGORY_TO_HEAD_ROLE.items()}
    result = []

    if role == "Employee":
        # Employee sees progress updates on their own complaints —
        # not the "Submitted" event itself (they already know they submitted it).
        own_ids = [c.id for c in db.query(Complaint).filter(Complaint.submitted_by == current_user.id).all()]
        if own_ids:
            events = (
                db.query(ComplaintEvent)
                .filter(ComplaintEvent.complaint_id.in_(own_ids))
                .filter(ComplaintEvent.title != "Submitted")
                .order_by(ComplaintEvent.created_at.desc())
                .limit(20)
                .all()
            )
            complaint_by_id = {c.id: c for c in db.query(Complaint).filter(Complaint.id.in_(own_ids)).all()}
            for e in events:
                c = complaint_by_id.get(e.complaint_id)
                if c:
                    result.append({
                        "id": e.id, "complaint_id": c.id, "reference_id": c.reference_id,
                        "complaint_title": c.title, "event_title": e.title, "note": e.note,
                        "created_at": e.created_at,
                    })

    elif role in role_to_category:
        # Department heads: notified when a new complaint in their category
        # is submitted and awaiting their action.
        category = role_to_category[role]
        complaints = (
            db.query(Complaint)
            .filter(Complaint.category == category)
            .order_by(Complaint.created_at.desc())
            .limit(20)
            .all()
        )
        for c in complaints:
            submitted_event = (
                db.query(ComplaintEvent)
                .filter(ComplaintEvent.complaint_id == c.id, ComplaintEvent.title == "Submitted")
                .first()
            )
            if submitted_event:
                result.append({
                    "id": submitted_event.id, "complaint_id": c.id, "reference_id": c.reference_id,
                    "complaint_title": c.title, "event_title": "Submitted", "note": submitted_event.note,
                    "created_at": submitted_event.created_at,
                })

    elif role in ["Admin", "HR"]:
        # Admin: notified when a complaint reaches Admin Review — either a
        # department head finished their inspection, or a Personal complaint
        # was submitted directly (Personal skips the department-head stage).
        events = (
            db.query(ComplaintEvent)
            .filter(ComplaintEvent.title.in_(["Facility Head Inspection"]))
            .order_by(ComplaintEvent.created_at.desc())
            .limit(20)
            .all()
        )
        personal_submitted = (
            db.query(ComplaintEvent)
            .join(Complaint, Complaint.id == ComplaintEvent.complaint_id)
            .filter(Complaint.category == "Personal", ComplaintEvent.title == "Submitted")
            .order_by(ComplaintEvent.created_at.desc())
            .limit(20)
            .all()
        )
        combined_events = events + personal_submitted
        combined_events.sort(key=lambda e: e.created_at, reverse=True)
        complaint_by_id = {
            c.id: c for c in db.query(Complaint).filter(
                Complaint.id.in_([e.complaint_id for e in combined_events])
            ).all()
        }
        for e in combined_events[:20]:
            c = complaint_by_id.get(e.complaint_id)
            if c:
                result.append({
                    "id": e.id, "complaint_id": c.id, "reference_id": c.reference_id,
                    "complaint_title": c.title, "event_title": e.title, "note": e.note,
                    "created_at": e.created_at,
                })

    elif role == "Super Admin":
        # Chairman: SLA escalation — complaints stuck (no stage change) for
        # 5+ days and not yet resolved.
        threshold = datetime.utcnow() - timedelta(days=5)
        stale_complaints = (
            db.query(Complaint)
            .filter(Complaint.status != "Resolved")
            .filter(Complaint.created_at <= threshold)
            .order_by(Complaint.created_at.asc())
            .limit(20)
            .all()
        )
        for c in stale_complaints:
            latest_event = (
                db.query(ComplaintEvent)
                .filter(ComplaintEvent.complaint_id == c.id)
                .order_by(ComplaintEvent.created_at.desc())
                .first()
            )
            last_activity = latest_event.created_at if latest_event else c.created_at
            if last_activity <= threshold:
                result.append({
                    "id": c.id, "complaint_id": c.id, "reference_id": c.reference_id,
                    "complaint_title": c.title,
                    "event_title": "SLA Breach — No action in 5+ days",
                    "note": f"Currently at stage: {c.current_stage}",
                    "created_at": last_activity,
                })

    result.sort(key=lambda r: r["created_at"], reverse=True)
    return result[:20]