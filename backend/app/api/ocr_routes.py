from fastapi import APIRouter, File, UploadFile, HTTPException
from app.services.paddle_ocr import get_paddle_engine
from app.services.indian_id_parser import parse_indian_id_text
import logging

logger = logging.getLogger("ocr_routes")
router = APIRouter(prefix="/api/ocr", tags=["PaddleOCR"])

@router.post("/scan")
async def scan_document_id(
    front_image: UploadFile = File(...),
    back_image: UploadFile = File(None)
):
    """
    Accepts 2 document photos (Front & Back) of Indian IDs (Aadhaar, PAN, Voter ID, Passport),
    processes them via PaddleOCR, and extracts structured fields (Name, Document No, DOB, Address, PIN).
    """
    try:
        paddle_service = get_paddle_engine()
        combined_text = ""

        # 1. Process Front Photo
        if front_image:
            logger.info(f"Processing Front Photo: {front_image.filename}")
            front_bytes = await front_image.read()
            front_text = paddle_service.extract_text_from_bytes(front_bytes)
            combined_text += "\n--- FRONT DOCUMENT ---\n" + front_text

        # 2. Process Back Photo (if provided)
        if back_image:
            logger.info(f"Processing Back Photo: {back_image.filename}")
            back_bytes = await back_image.read()
            back_text = paddle_service.extract_text_from_bytes(back_bytes)
            combined_text += "\n--- BACK DOCUMENT ---\n" + back_text

        logger.info(f"=== COMBINED OCR TEXT ===\n{combined_text}\n========================")

        # 3. Parse Indian ID Fields
        extracted_data = parse_indian_id_text(combined_text)
        logger.info(f"=== EXTRACTED DATA ===\n{extracted_data}\n========================")

        return {
            "success": True,
            "engine": "PaddleOCR Python Backend",
            "data": extracted_data
        }

    except Exception as e:
        logger.error(f"Failed to scan document with PaddleOCR: {e}")
        raise HTTPException(status_code=500, detail=str(e))
