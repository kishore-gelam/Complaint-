from database import SessionLocal
from models import Employee
from auth import hash_password

db = SessionLocal()

new_employee = Employee(
    name="System Admin",
    email="sysadmin@gksociety.com",
    password_hash=hash_password("SysAdmin@123"),
    role="System Admin"
)

db.add(new_employee)
db.commit()
print("System Admin account created successfully")
db.close()