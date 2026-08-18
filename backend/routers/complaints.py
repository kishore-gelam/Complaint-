from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models import Complaint, ComplaintEvent, ComplaintAttachment, Employee
from schemas import ComplaintCreate, ComplaintOut, ComplaintEventOut, AttachmentOut
from typing import List, Optional
from pydantic import BaseModel
import random, os, shutil
from auth import get_current_user

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
def complaint_stats(db: Session = Depends(get_db)):
    total = db.query(Complaint).count()
    resolved_complaints = db.query(Complaint).filter(Complaint.status == "Resolved").all()

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
        "open": db.query(Complaint).filter(Complaint.status != "Resolved").count(),
        "underReview": db.query(Complaint).filter(Complaint.status == "Under Review").count(),
        "meetingsScheduled": db.query(Complaint).filter(Complaint.status == "Meeting Scheduled").count(),
        "resolved": resolved_count,
        "avgResolutionDays": avg_resolution_days,
        "slaCompliance": sla_compliance,
    }
@router.get("/notifications/recent", response_model=List[NotificationOut])
def get_recent_notifications(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    query = db.query(Complaint)
    if current_user.role == "Employee":
        query = query.filter(Complaint.submitted_by == current_user.id)
    else:
        role_to_category = {v: k for k, v in CATEGORY_TO_HEAD_ROLE.items()}
        if current_user.role in role_to_category:
            query = query.filter(Complaint.category == role_to_category[current_user.role])
        # Admin, HR, Super Admin see notifications across all complaints.

    visible_complaint_ids = [c.id for c in query.all()]
    if not visible_complaint_ids:
        return []

    complaint_by_id = {c.id: c for c in query.all()}

    events = (
        db.query(ComplaintEvent)
        .filter(ComplaintEvent.complaint_id.in_(visible_complaint_ids))
        .order_by(ComplaintEvent.created_at.desc())
        .limit(20)
        .all()
    )

    result = []
    for e in events:
        c = complaint_by_id.get(e.complaint_id)
        if not c:
            continue
        result.append({
            "id": e.id,
            "complaint_id": c.id,
            "reference_id": c.reference_id,
            "complaint_title": c.title,
            "event_title": e.title,
            "note": e.note,
            "created_at": e.created_at,
        })
    return result