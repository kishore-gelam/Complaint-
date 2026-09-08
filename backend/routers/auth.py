from fastapi import APIRouter, Depends, HTTPException
try:
    from sqlalchemy.orm import Session
except Exception:  # pragma: no cover - fallback for editors/linters when SQLAlchemy isn't installed
    from typing import Any as Session
from database import get_db
from models import Employee
from schemas import EmployeeLogin, EmployeeSignup, TokenResponse
from auth import verify_password, create_access_token, hash_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(payload: EmployeeLogin, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.email == payload.email).first()

    if not employee or not verify_password(payload.password, employee.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(employee.id), "email": employee.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": employee,
    }
@router.post("/signup", response_model=TokenResponse)
def signup(payload: EmployeeSignup, db: Session = Depends(get_db)):
    existing = db.query(Employee).filter(Employee.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_employee = Employee(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        department=payload.department,
    )
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)

    token = create_access_token({"sub": str(new_employee.id), "email": new_employee.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_employee,
    }