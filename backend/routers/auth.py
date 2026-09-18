import random
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
try:
    from sqlalchemy.orm import Session
except Exception:
    from typing import Any as Session
from sqlalchemy import func
from database import get_db
from models import Employee
from schemas import (
    EmployeeLogin,
    EmployeeSignup,
    TokenResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageOut,
)
from auth import verify_password, create_access_token, hash_password
from email_utils import send_email

router = APIRouter(prefix="/api/auth", tags=["auth"])

OTP_EXPIRY_MINUTES = 10


@router.post("/login", response_model=TokenResponse)
def login(payload: EmployeeLogin, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(func.lower(Employee.email) == payload.email.strip().lower()).first()

    if not employee or not employee.password_hash or not verify_password(payload.password, employee.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(employee.id), "email": employee.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": employee,
    }


@router.post("/signup", response_model=TokenResponse)
def signup(payload: EmployeeSignup, db: Session = Depends(get_db)):
    employee = (
        db.query(Employee)
        .filter(
            func.lower(Employee.email) == payload.email.strip().lower(),
            func.lower(Employee.name) == payload.name.strip().lower(),
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="No matching employee record found. Please contact your System Admin.",
        )

    if employee.role != "System Admin":
        raise HTTPException(
            status_code=403,
            detail="Signup is only available for System Admin accounts.",
        )

    if employee.password_hash:
        raise HTTPException(
            status_code=400,
            detail="This account is already activated. Please sign in instead.",
        )

    employee.password_hash = hash_password(payload.password)
    db.commit()
    db.refresh(employee)

    token = create_access_token({"sub": str(employee.id), "email": employee.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": employee,
    }


@router.post("/forgot-password", response_model=MessageOut)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(func.lower(Employee.email) == payload.email.strip().lower()).first()

    # Always return the same generic message, whether or not the email exists —
    # this avoids leaking which emails are registered.
    generic_response = {"message": "If that email is registered, an OTP has been sent."}

    if not employee:
        return generic_response

    otp = f"{random.randint(0, 999999):06d}"
    employee.reset_otp = otp
    employee.reset_otp_expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
    db.commit()

    send_email(
        to_email=employee.email,
        subject="Your Complaint Box password reset OTP",
        body_html=f"""
            <p>Hi {employee.name},</p>
            <p>Your OTP to reset your password is:</p>
            <h2>{otp}</h2>
            <p>This OTP expires in {OTP_EXPIRY_MINUTES} minutes. If you didn't request this, you can ignore this email.</p>
        """,
    )

    return generic_response


@router.post("/reset-password", response_model=MessageOut)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(func.lower(Employee.email) == payload.email.strip().lower()).first()

    if (
        not employee
        or not employee.reset_otp
        or employee.reset_otp != payload.otp.strip()
        or not employee.reset_otp_expires_at
        or employee.reset_otp_expires_at < datetime.utcnow()
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")

    employee.password_hash = hash_password(payload.new_password)
    employee.reset_otp = None
    employee.reset_otp_expires_at = None
    db.commit()

    return {"message": "Password reset successfully. Please sign in."}