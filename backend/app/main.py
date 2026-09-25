from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.ocr_routes import router as ocr_router
from app.api.guest_routes import router as guest_router
from app.db.database import init_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hotel_ocr_backend")

app = FastAPI(
    title="Hotel PMS - Document Extraction & Guest Database API",
    version="1.0.0",
    description="Python FastAPI backend powered by OpenCV/scikit-image/Tesseract/EasyOCR with sequential SQLite guest database and signature storage."
)

# Initialize sequential SQLite database on startup
@app.on_event("startup")
def on_startup():
    init_db()

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ocr_router)
app.include_router(guest_router)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "PaddleOCR Hotel Guest ID Scanner",
        "engine": "PaddlePaddle / EasyOCR Multi-Engine",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000)
