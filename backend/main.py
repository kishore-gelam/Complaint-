from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import Base, engine
from routers import complaints, meetings, auth, employees

load_dotenv()

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Complaint Box API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://yourdomain.com",       # production frontend domain add చేయండి
        "https://www.yourdomain.com",   # www వెర్షన్ కూడా వాడితే
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(complaints.router)
app.include_router(meetings.router)
app.include_router(auth.router)
app.include_router(employees.router)

@app.get("/")
def root():
    return {"message": "Complaint Box API is running"}