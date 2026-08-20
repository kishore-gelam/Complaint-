from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from database import Base

class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    employee_code = Column(String(30), unique=True, nullable=True)
    name = Column(String(100))
    email = Column(String(150), unique=True)
    password_hash = Column(String(255))
    role = Column(String(50), default="Employee")
    department = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

class Complaint(Base):
    __tablename__ = "complaints"
    id = Column(Integer, primary_key=True, index=True)
    reference_id = Column(String(20), unique=True)
    title = Column(String(200))
    category = Column(String(50))
    urgency = Column(Enum("Low", "Medium", "High"), default="Medium")
    description = Column(Text)
    status = Column(Enum("Under Review", "Meeting Scheduled", "Resolved"), default="Under Review")
    current_stage = Column(
        Enum("Submitted", "Facility Head Inspection", "Admin Review", "Final Verification"),
        default="Submitted"
    )
    submitted_by = Column(Integer, ForeignKey("employees.id"))
    created_at = Column(TIMESTAMP, server_default=func.now())

class Meeting(Base):
    __tablename__ = "meetings"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200))
    location = Column(String(150))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    status = Column(Enum("Scheduled", "Tentative", "Completed", "Cancelled"), default="Scheduled")
    related_complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("employees.id"))
    join_url = Column(String(255), nullable=True)
    briefing_url = Column(String(255), nullable=True)


class MeetingParticipant(Base):
    __tablename__ = "meeting_participants"
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"))
    employee_id = Column(Integer, ForeignKey("employees.id"))


class ComplaintEvent(Base):
    __tablename__ = "complaint_events"
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"))
    title = Column(String(150))
    note = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())


class ComplaintAttachment(Base):
    __tablename__ = "complaint_attachments"
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"))
    file_url = Column(String(255))
    stage = Column(String(50), default="Submitted")