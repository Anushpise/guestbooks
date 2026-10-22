from fastapi import APIRouter, File, UploadFile, HTTPException
from app.services.paddle_ocr import get_paddle_engine
from app.services.indian_id_parser import parse_indian_id_text
import asyncio
import logging
import time

logger = logging.getLogger("ocr_routes")
router = APIRouter(prefix="/api/ocr", tags=["PaddleOCR"])

@router.post("/scan")
async def scan_document_id(
    front_image: UploadFile = File(...),
    back_image: UploadFile = File(None)
):
    """
    Accepts 2 document photos (Front & Back) of Indian IDs (Aadhaar, PAN, Voter ID, Passport, DL),
    processes them concurrently in parallel via High-Speed Cascaded OCR with automatic orientation/deskew,
    and extracts structured fields (Name, Document No, DOB, Address, PIN).
    """
    t_start = time.time()
    try:
        paddle_service = get_paddle_engine()

        # 1. Read bytes asynchronously
        front_bytes = await front_image.read() if front_image else None
        back_bytes = await back_image.read() if back_image else None

        # 2. Concurrent Parallel OCR Processing across threadpool
        tasks = []
        if front_bytes:
            logger.info(f"Queuing Front Photo: {getattr(front_image, 'filename', 'front.jpg')} ({len(front_bytes)} bytes)")
            tasks.append(asyncio.to_thread(paddle_service.extract_text_from_bytes, front_bytes))
        else:
            tasks.append(asyncio.to_thread(lambda: ""))

        if back_bytes:
            logger.info(f"Queuing Back Photo: {getattr(back_image, 'filename', 'back.jpg')} ({len(back_bytes)} bytes)")
            tasks.append(asyncio.to_thread(paddle_service.extract_text_from_bytes, back_bytes))
        else:
            tasks.append(asyncio.to_thread(lambda: ""))

        front_text, back_text = await asyncio.gather(*tasks)

        combined_text = ""
        if front_text:
            combined_text += "\n--- FRONT DOCUMENT ---\n" + front_text
        if back_text:
            combined_text += "\n--- BACK DOCUMENT ---\n" + back_text

        logger.info(f"=== OCR TEXT EXTRACTED IN {time.time() - t_start:.3f}s ===\n{combined_text}\n========================")

        # 3. Parse Indian ID Fields
        extracted_data = parse_indian_id_text(combined_text)
        total_duration = time.time() - t_start
        logger.info(f"=== PARSED DATA ({total_duration:.3f}s total) ===\n{extracted_data}\n========================")

        return {
            "success": True,
            "engine": "High-Speed Cascaded Neural OCR",
            "executionTimeSec": round(total_duration, 3),
            "data": extracted_data
        }

    except Exception as e:
        logger.error(f"Failed to scan document with OCR: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
