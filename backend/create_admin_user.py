from database import SessionLocal
from models import Employee
from auth import hash_password

db = SessionLocal()

new_employee = Employee(
    name="Admin Name",
    email="admin@gksociety.com",
    password_hash=hash_password("Admin@123"),
    role="Admin"
)

db.add(new_employee)
db.commit()
print("Admin account created successfully")
db.close()