from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# ---------- Complaints ----------

class ComplaintCreate(BaseModel):
    title: str
    category: str
    urgency: str = "Medium"
    description: Optional[str] = None
    submitted_by: Optional[int] = None

class ComplaintOut(BaseModel):
    id: int
    reference_id: str
    title: str
    category: str
    urgency: str
    description: Optional[str]
    status: str
    current_stage: str
    submitted_by: Optional[int]
    submitter_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ComplaintEventOut(BaseModel):
    id: int
    title: str
    note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AttachmentOut(BaseModel):
    id: int
    file_url: str
    stage: str

    class Config:
        from_attributes = True


# ---------- Employees / Auth ----------

class EmployeeLogin(BaseModel):
    email: str
    password: str

class EmployeeOut(BaseModel):
    id: int
    employee_code: Optional[str] = None
    name: str
    email: str
    role: str
    department: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: EmployeeOut


class EmployeeCreate(BaseModel):
    employee_code: str
    name: str
    email: str
    password: str
    role: str = "Employee"
    department: Optional[str] = None


class EmployeeUpdate(BaseModel):
    employee_code: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    password: Optional[str] = None


class EmployeeListOut(BaseModel):
    items: List[EmployeeOut]
    total: int


# ---------- Meetings ----------

class MeetingCreate(BaseModel):
    title: str
    location: Optional[str] = None
    start_time: datetime
    end_time: datetime
    related_complaint_id: Optional[int] = None
    created_by: Optional[int] = None
    join_url: Optional[str] = None
    briefing_url: Optional[str] = None

class MeetingOut(BaseModel):
    id: int
    title: str
    location: Optional[str]
    start_time: datetime
    end_time: datetime
    status: str
    related_complaint_id: Optional[int]
    created_by: Optional[int]
    join_url: Optional[str] = None
    briefing_url: Optional[str] = None

    class Config:
        from_attributes = True


class ParticipantOut(BaseModel):
    id: int
    name: str


class MeetingAgendaOut(BaseModel):
    id: int
    title: str
    location: Optional[str]
    start_time: datetime
    end_time: datetime
    status: str
    join_url: Optional[str] = None
    briefing_url: Optional[str] = None
    participants: List[ParticipantOut] = []