from fastapi import APIRouter, File, UploadFile, HTTPException
from app.services.paddle_ocr import get_paddle_engine
from app.services.indian_id_parser import parse_indian_id_text
from app.services.gemini_extractor import (
    extract_id_with_gemini,
    is_gemini_configured,
    get_gemini_api_key,
    get_active_model_name,
    test_gemini_connection,
)
import asyncio
import logging
import time
import os

logger = logging.getLogger("ocr_routes")
router = APIRouter(prefix="/api/ocr", tags=["PaddleOCR"])

@router.get("/status")
def get_ocr_engine_status():
    """
    Returns the real-time operational status of the OCR subsystem.
    Enables frontend and health checks to confirm whether Gemini Multimodal Vision AI is active.
    """
    gemini_active = is_gemini_configured()
    masked_key = ""
    if gemini_active:
        key = get_gemini_api_key()
        masked_key = key[:6] + "..." + key[-4:] if len(key) > 10 else "***"

    return {
        "geminiConfigured": gemini_active,
        "geminiModel": get_active_model_name(),
        "maskedApiKey": masked_key,
        "primaryEngine": "Gemini Multimodal Vision AI" if gemini_active else "Local Cascaded Neural OCR",
        "fallbackEngine": "Local Cascaded Neural OCR" if gemini_active else "None"
    }

@router.get("/test-gemini")
def test_gemini_endpoint():
    """
    Diagnostics endpoint to test live Gemini API credentials and model responsiveness.
    """
    return test_gemini_connection()

@router.post("/scan")
async def scan_document_id(
    front_image: UploadFile = File(...),
    back_image: UploadFile = File(None)
):
    """
    Accepts 2 document photos (Front & Back) of Indian IDs (Aadhaar, PAN, Voter ID, Passport, DL).
    1. Primary: High-Accuracy Multimodal Gemini Vision AI (if GEMINI_API_KEY is configured).
    2. Fallback: Local High-Speed Cascaded Neural OCR + Indian ID Parser (if Gemini unavailable/offline).
    """
    t_start = time.time()
    try:
        # 1. Read bytes asynchronously
        front_bytes = await front_image.read() if front_image else None
        back_bytes = await back_image.read() if back_image else None

        # 2. Try Multimodal Gemini Vision AI (Primary Engine)
        if is_gemini_configured() and front_bytes:
            logger.info("Attempting primary extraction via Gemini Multimodal Vision AI...")
            try:
                gemini_data = await asyncio.to_thread(extract_id_with_gemini, front_bytes, back_bytes)
                if gemini_data and (
                    gemini_data.get("name")
                    or gemini_data.get("idNumber")
                    or gemini_data.get("dob")
                    or gemini_data.get("address")
                ):
                    total_duration = time.time() - t_start
                    logger.info(f"=== GEMINI EXTRACTED IN {total_duration:.3f}s ===\n{gemini_data}\n========================")
                    return {
                        "success": True,
                        "engine": "Gemini Multimodal Vision AI",
                        "executionTimeSec": round(total_duration, 3),
                        "data": gemini_data
                    }
                logger.warning("Gemini Vision AI returned incomplete result. Falling back to local OCR...")
            except Exception as gemini_err:
                logger.warning(f"Gemini Vision call failed ({gemini_err}). Gracefully falling back to local OCR...")

        # 3. Fallback: Local Cascaded OCR Processing
        logger.info("Running Local Cascaded Neural OCR pipeline...")
        paddle_service = get_paddle_engine()

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

        # 4. Parse Indian ID Fields with Local Parser
        extracted_data = parse_indian_id_text(combined_text)
        total_duration = time.time() - t_start
        logger.info(f"=== PARSED DATA ({total_duration:.3f}s total) ===\n{extracted_data}\n========================")

        return {
            "success": True,
            "engine": "High-Speed Cascaded Neural OCR (Local)",
            "executionTimeSec": round(total_duration, 3),
            "data": extracted_data
        }

    except Exception as e:
        logger.error(f"Failed to scan document with OCR: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
