from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.ocr_routes import router as ocr_router
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hotel_ocr_backend")

app = FastAPI(
    title="Hotel PMS - PaddleOCR Document Extraction API",
    version="1.0.0",
    description="Python FastAPI backend powered by PaddleOCR & EasyOCR for Indian ID Cards (Aadhaar, PAN, Voter ID, Passport)"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ocr_router)

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
