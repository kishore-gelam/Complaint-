# backend/create_user.py
import sys
from database import SessionLocal
from models import Employee
from auth import hash_password

def create_user(name, email, password, role):
    db = SessionLocal()
    try:
        existing = db.query(Employee).filter(Employee.email == email).first()
        if existing:
            print(f"A user with email {email} already exists.")
            return
        employee = Employee(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=role,
        )
        db.add(employee)
        db.commit()
        print(f"Created {role} account for {email}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python create_user.py \"Full Name\" email@example.com password Role")
        sys.exit(1)
    create_user(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])