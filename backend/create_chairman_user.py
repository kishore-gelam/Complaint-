from database import SessionLocal
from models import Employee
from auth import hash_password

db = SessionLocal()

new_employee = Employee(
    name="Chairman",
    email="chairman@gksociety.com",
    password_hash=hash_password("Chair@123"),
    role="Super Admin"
)

db.add(new_employee)
db.commit()
print("Chairman (Super Admin) account created successfully")
db.close()