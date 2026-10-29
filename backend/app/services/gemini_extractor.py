import os
import re
import json
import base64
import logging
from typing import Optional, Dict, Any
from datetime import datetime
import httpx

logger = logging.getLogger("gemini_extractor")

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


def is_gemini_configured() -> bool:
    """Checks if GEMINI_API_KEY environment variable is present and non-empty."""
    key = os.getenv("GEMINI_API_KEY", "").strip()
    return bool(key)


def format_gemini_prompt() -> str:
    """Returns the expert prompt guiding Gemini to accurately extract Indian ID cards."""
    return """You are an expert Indian Identity Document analysis system for a luxury hotel check-in desk.
Analyze the provided document image(s) (Front and optional Back) of an Indian Government ID card (Aadhaar Card, PAN Card, Driving License, Voter ID, or Passport).

Strict Extraction Rules:
1. ID Type: Determine accurately ("Aadhaar Card", "PAN Card", "Voter ID", "Passport", "Driving License").
2. ID Number: Extract the exact government document number:
   - Aadhaar: Exactly 12 digits formatted as "XXXX XXXX XXXX" (exclude VID or 1947 help numbers).
   - PAN: Exactly 10 characters (5 uppercase letters, 4 digits, 1 letter, e.g. ABCDE1234F).
   - Voter ID / EPIC: 3 letters + 7 digits (e.g. ABC1234567).
   - Passport: 1 letter + 7-8 digits (e.g. A1234567).
   - Driving License: State code + DL number (e.g. MH3120150012345).
3. Full Name: Extract the English human guest name in Title Case (e.g. "Vijay Bhopalkar", "Sandhya Diliprao Barhane").
   - Strip leading OCR artifacts or symbols like '|', 'I', '/', ':'.
   - Do NOT include father/husband name labels like S/O, D/O, W/O.
4. Date of Birth & Age:
   - Extract DOB in "DD/MM/YYYY" format.
   - If only Year of Birth (YOB) is present, use "01/01/YYYY".
   - Compute the guest age as an integer string (e.g. "24", "51").
5. Gender: "Male", "Female", or "Other".
6. Address:
   - Extract the full, clean permanent address strictly in English.
   - On Aadhaar cards with bilingual text (Marathi/Hindi on top and English below), extract ONLY the English address!
   - Do NOT transcribe Devanagari words into English gibberish.
   - Stop cleanly at the postal pincode line; do NOT include print timestamps like 'Details as on: ...' or UIDAI helpdesk links.
7. City: Extract the district or city (e.g. "Nagpur", "Wardha", "Yavatmal", "Chandrapur").
8. Pincode: 6-digit Indian postal PIN code (e.g. "441103", "445402").
9. Phone: 10-digit mobile number if printed on the card, else "".

Return ONLY a valid JSON object matching this exact schema:
{
  "idType": "Aadhaar Card",
  "idNumber": "1234 5678 9012",
  "name": "Guest Full Name",
  "dob": "DD/MM/YYYY",
  "age": "25",
  "gender": "Male",
  "address": "Full Clean Street, Locality, City, State - PIN",
  "city": "City Name",
  "pincode": "123456",
  "phone": ""
}"""


def parse_gemini_response(response_text: str) -> Dict[str, Any]:
    """
    Parses Gemini raw response text into a validated dictionary.
    Handles raw JSON as well as Markdown code fence blocks (```json ... ```).
    """
    cleaned = response_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
    except Exception as e:
        logger.error(f"Failed to parse Gemini JSON output: {e}. Raw text: {cleaned[:200]}")
        return {}

    # Standardize dictionary fields
    res = {
        "idType": str(data.get("idType", "Aadhaar Card")).strip(),
        "idNumber": str(data.get("idNumber", "")).strip(),
        "name": str(data.get("name", "")).strip(),
        "dob": str(data.get("dob", "")).strip(),
        "age": str(data.get("age", "")).strip(),
        "gender": str(data.get("gender", "")).strip(),
        "address": str(data.get("address", "")).strip(),
        "city": str(data.get("city", "")).strip(),
        "pincode": str(data.get("pincode", "")).strip(),
        "phone": str(data.get("phone", "")).strip(),
    }

    # Format Aadhaar card 12 digits if contiguous
    if res["idType"] == "Aadhaar Card" and len(re.sub(r"\D", "", res["idNumber"])) == 12:
        d = re.sub(r"\D", "", res["idNumber"])
        res["idNumber"] = f"{d[:4]} {d[4:8]} {d[8:]}"

    # Calculate age if DOB present but age missing
    if res["dob"] and not res["age"]:
        current_year = datetime.now().year
        m_yr = re.search(r"\b(19\d{2}|20\d{2})\b", res["dob"])
        if m_yr:
            res["age"] = str(current_year - int(m_yr.group(1)))

    return res


def extract_id_with_gemini(
    front_bytes: bytes,
    back_bytes: Optional[bytes] = None,
    timeout_sec: float = 18.0
) -> Optional[Dict[str, Any]]:
    """
    Calls Google Gemini Flash Vision API with Front and optional Back ID card photos.
    Returns structured ID dictionary on success, or None on failure/timeout.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        logger.info("GEMINI_API_KEY not configured. Skipping Gemini Vision AI.")
        return None

    if not front_bytes:
        return None

    try:
        # Build multipart parts for Gemini
        parts = [
            {"text": format_gemini_prompt()}
        ]

        # Add Front Image
        front_b64 = base64.b64encode(front_bytes).decode("utf-8")
        parts.append({
            "inline_data": {
                "mime_type": "image/jpeg",
                "data": front_b64
            }
        })

        # Add Back Image if present
        if back_bytes:
            back_b64 = base64.b64encode(back_bytes).decode("utf-8")
            parts.append({
                "inline_data": {
                    "mime_type": "image/jpeg",
                    "data": back_b64
                }
            })

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": parts
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "response_mime_type": "application/json"
            }
        }

        url = f"{GEMINI_API_BASE}/{GEMINI_MODEL}:generateContent?key={api_key}"

        logger.info(f"Calling Gemini Flash Vision API ({GEMINI_MODEL}) with {1 if not back_bytes else 2} image(s)...")
        with httpx.Client(timeout=timeout_sec) as client:
            resp = client.post(url, json=payload, headers={"Content-Type": "application/json"})

        if resp.status_code != 200:
            logger.warning(f"Gemini API returned HTTP {resp.status_code}: {resp.text[:300]}")
            # Try fallback to gemini-1.5-flash if gemini-2.0-flash is not available in that project
            if GEMINI_MODEL != "gemini-1.5-flash":
                fallback_url = f"{GEMINI_API_BASE}/gemini-1.5-flash:generateContent?key={api_key}"
                logger.info("Retrying with gemini-1.5-flash model...")
                with httpx.Client(timeout=timeout_sec) as client:
                    resp = client.post(fallback_url, json=payload, headers={"Content-Type": "application/json"})
                if resp.status_code != 200:
                    logger.warning(f"Gemini 1.5 fallback returned HTTP {resp.status_code}: {resp.text[:300]}")
                    return None
            else:
                return None

        result_json = resp.json()
        candidates = result_json.get("candidates", [])
        if not candidates:
            logger.warning("Gemini API returned no candidates.")
            return None

        content_parts = candidates[0].get("content", {}).get("parts", [])
        if not content_parts:
            logger.warning("Gemini candidate has no parts.")
            return None

        raw_text = content_parts[0].get("text", "")
        parsed = parse_gemini_response(raw_text)

        if parsed and (parsed.get("name") or parsed.get("idNumber") or parsed.get("dob")):
            logger.info(f"Successfully extracted ID using Gemini Vision AI: {parsed.get('name')} | {parsed.get('idNumber')}")
            return parsed

        return None

    except httpx.TimeoutException:
        logger.warning(f"Gemini API timed out after {timeout_sec}s. Gracefully falling back to local OCR.")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in Gemini Vision extraction: {e}", exc_info=True)
        return None
