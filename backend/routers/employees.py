from fastapi import APIRouter, Depends, HTTPException
from schemas import EmployeeCreate, EmployeeOut, EmployeeUpdate, EmployeeListOut
from typing import List

from database import get_db
from models import Employee
from schemas import EmployeeCreate, EmployeeOut
from auth import hash_password, require_system_admin

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("/", response_model=EmployeeListOut)
def list_employees(
    page: int = 1,
    page_size: int = 5,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_system_admin),
):
    query = db.query(Employee).order_by(Employee.id.asc())
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total}

@router.post("/", response_model=EmployeeOut)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_system_admin),
):
    existing = db.query(Employee).filter(Employee.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    employee = Employee(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee

@router.put("/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: int,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_system_admin),
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if payload.email and payload.email != employee.email:
        existing = db.query(Employee).filter(Employee.email == payload.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        employee.email = payload.email

    if payload.name:
        employee.name = payload.name
    if payload.role:
        employee.role = payload.role
    if payload.password:
        employee.password_hash = hash_password(payload.password)

    db.commit()
    db.refresh(employee)
    return employee