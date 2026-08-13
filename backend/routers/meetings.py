from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Meeting, Complaint, MeetingParticipant, Employee
from schemas import MeetingCreate, MeetingOut, MeetingAgendaOut
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from auth import get_current_user

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    location: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None


@router.get("/agenda/today", response_model=List[MeetingAgendaOut])
def get_today_agenda(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    start_of_day = datetime.combine(datetime.today(), datetime.min.time())
    end_of_day = start_of_day + timedelta(days=1)

    todays_meetings = (
        db.query(Meeting)
        .filter(Meeting.start_time >= start_of_day, Meeting.start_time < end_of_day)
        .filter(Meeting.status != "Cancelled")
        .order_by(Meeting.start_time.asc())
        .all()
    )

    result = []
    for m in todays_meetings:
        participant_rows = (
            db.query(Employee.id, Employee.name)
            .join(MeetingParticipant, MeetingParticipant.employee_id == Employee.id)
            .filter(MeetingParticipant.meeting_id == m.id)
            .all()
        )
        result.append({
            "id": m.id,
            "title": m.title,
            "location": m.location,
            "start_time": m.start_time,
            "end_time": m.end_time,
            "status": m.status,
            "join_url": m.join_url,
            "briefing_url": m.briefing_url,
            "participants": [{"id": p.id, "name": p.name} for p in participant_rows],
        })
    return result


@router.get("/", response_model=List[MeetingOut])
def list_meetings(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    query = db.query(Meeting)

    if current_user.role == "Employee":
        # Employees only see meetings linked to complaints they submitted.
        own_complaint_ids = [
            c.id for c in db.query(Complaint).filter(Complaint.submitted_by == current_user.id).all()
        ]
        query = query.filter(Meeting.related_complaint_id.in_(own_complaint_ids))

    return query.order_by(Meeting.start_time).all()


@router.post("/", response_model=MeetingOut)
def create_meeting(
    payload: MeetingCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    new_meeting = Meeting(**payload.dict(exclude={"created_by"}), created_by=current_user.id)
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    return new_meeting


@router.patch("/{meeting_id}", response_model=MeetingOut)
def update_meeting(
    meeting_id: int,
    payload: MeetingUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(meeting, field, value)

    db.commit()
    db.refresh(meeting)
    return meeting


@router.delete("/{meeting_id}")
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    db.delete(meeting)
    db.commit()
    return {"message": "Meeting deleted"}