import os
import re
import json
import base64
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from pathlib import Path
import httpx
from dotenv import load_dotenv

logger = logging.getLogger("gemini_extractor")

def _load_all_env():
    candidates = [
        Path.cwd() / ".env",
        Path(__file__).resolve().parent.parent.parent / ".env",
        Path(__file__).resolve().parent.parent.parent.parent / ".env",
        Path("/app/.env"),
        Path("/app/data/.env"),
    ]
    try:
        candidates.append(Path.home() / ".env")
    except Exception:
        pass

    for c in candidates:
        try:
            if c.exists() and c.is_file():
                load_dotenv(c, override=False)
        except Exception:
            pass

_load_all_env()

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
_CACHED_WORKING_MODEL: Optional[str] = None


def get_gemini_api_key() -> str:
    """Returns sanitized GEMINI_API_KEY stripping any extraneous quotes or whitespace."""
    _load_all_env()
    key = os.getenv("GEMINI_API_KEY", "").strip().strip("'\"")
    return key


def is_gemini_configured() -> bool:
    """Checks if a non-empty GEMINI_API_KEY is present."""
    return bool(get_gemini_api_key())


def get_candidate_models() -> List[str]:
    """
    Returns prioritized list of Gemini models.
    Filters out discontinued models like gemini-2.0-flash.
    """
    _load_all_env()
    configured = os.getenv("GEMINI_MODEL", "").strip().strip("'\"")

    candidates: List[str] = []
    # If cached working model exists, prioritize it
    global _CACHED_WORKING_MODEL
    if _CACHED_WORKING_MODEL and _CACHED_WORKING_MODEL != "gemini-2.0-flash":
        candidates.append(_CACHED_WORKING_MODEL)

    # If configured in .env and not deprecated, try it
    if configured and configured != "gemini-2.0-flash" and configured not in candidates:
        candidates.append(configured)

    # Standard high-availability multimodal models
    defaults = [
        "gemini-2.5-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-8b",
        "gemini-1.5-pro",
    ]
    for d in defaults:
        if d not in candidates:
            candidates.append(d)

    return candidates


def get_active_model_name() -> str:
    """Returns current active or most likely model name."""
    global _CACHED_WORKING_MODEL
    if _CACHED_WORKING_MODEL:
        return _CACHED_WORKING_MODEL
    candidates = get_candidate_models()
    return candidates[0] if candidates else "gemini-1.5-flash"


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
8. Pincode: 6-digit Indian postal PIN code (e.g. "441103", "445402", "445308").
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

    if res["idType"] == "Aadhaar Card" and len(re.sub(r"\D", "", res["idNumber"])) == 12:
        d = re.sub(r"\D", "", res["idNumber"])
        res["idNumber"] = f"{d[:4]} {d[4:8]} {d[8:]}"

    if res["dob"] and not res["age"]:
        current_year = datetime.now().year
        m_yr = re.search(r"\b(19\d{2}|20\d{2})\b", res["dob"])
        if m_yr:
            res["age"] = str(current_year - int(m_yr.group(1)))

    return res


def test_gemini_connection() -> Dict[str, Any]:
    """
    Tests live connectivity and authentication with Google Gemini API.
    Auto-discovers supported models and falls back cleanly if a model is deprecated.
    """
    api_key = get_gemini_api_key()
    if not api_key:
        return {
            "success": False,
            "error": "GEMINI_API_KEY is not set in environment or .env file."
        }

    # Step 1: Discover available models for this specific API Key from Google
    available_from_google: List[str] = []
    try:
        with httpx.Client(timeout=8.0) as client:
            list_url = f"{GEMINI_API_BASE}?key={api_key}"
            list_resp = client.get(list_url)
            if list_resp.status_code == 200:
                data = list_resp.json()
                for m in data.get("models", []):
                    methods = m.get("supportedGenerationMethods", [])
                    if "generateContent" in methods:
                        m_name = m.get("name", "").replace("models/", "")
                        if m_name and m_name != "gemini-2.0-flash":
                            available_from_google.append(m_name)
    except Exception as e:
        logger.warning(f"Could not list Gemini models from Google API: {e}")

    # Step 2: Build candidate test list
    candidates = get_candidate_models()
    for m in available_from_google:
        if m not in candidates:
            candidates.append(m)

    payload = {
        "contents": [
            {"role": "user", "parts": [{"text": "Reply with only: OK"}]}
        ]
    }

    last_error = None
    last_status = None
    t0 = datetime.now()

    with httpx.Client(timeout=10.0) as client:
        for model in candidates:
            url = f"{GEMINI_API_BASE}/{model}:generateContent?key={api_key}"
            try:
                resp = client.post(url, json=payload, headers={"Content-Type": "application/json"})
                if resp.status_code == 200:
                    latency_sec = (datetime.now() - t0).total_seconds()
                    global _CACHED_WORKING_MODEL
                    _CACHED_WORKING_MODEL = model
                    return {
                        "success": True,
                        "model": model,
                        "latencySec": round(latency_sec, 3),
                        "availableModelsFound": available_from_google[:8],
                        "message": f"Gemini API Key is valid and responding successfully using {model}!"
                    }
                else:
                    last_status = resp.status_code
                    last_error = resp.text[:400]
                    logger.warning(f"Test model {model} returned HTTP {resp.status_code}: {resp.text[:200]}")
            except Exception as e:
                last_error = str(e)

    return {
        "success": False,
        "statusCode": last_status,
        "attemptedModels": candidates[:5],
        "availableModelsFound": available_from_google[:8],
        "error": last_error
    }


def extract_id_with_gemini(
    front_bytes: bytes,
    back_bytes: Optional[bytes] = None,
    timeout_sec: float = 18.0
) -> Optional[Dict[str, Any]]:
    """
    Calls Google Gemini Flash Vision API using standard camelCase REST schema.
    Returns structured ID dictionary on success, or None on failure/timeout.
    """
    api_key = get_gemini_api_key()
    if not api_key:
        logger.info("GEMINI_API_KEY not configured. Skipping Gemini Vision AI.")
        return None

    if not front_bytes:
        return None

    try:
        parts = [
            {"text": format_gemini_prompt()}
        ]

        # Detect MIME type for Front
        front_mime = "image/jpeg"
        if front_bytes.startswith(b"\x89PNG"):
            front_mime = "image/png"
        elif front_bytes.startswith(b"RIFF") and b"WEBP" in front_bytes[:16]:
            front_mime = "image/webp"

        front_b64 = base64.b64encode(front_bytes).decode("utf-8")
        parts.append({
            "inlineData": {
                "mimeType": front_mime,
                "data": front_b64
            }
        })

        # Detect MIME type for Back
        if back_bytes:
            back_mime = "image/jpeg"
            if back_bytes.startswith(b"\x89PNG"):
                back_mime = "image/png"
            elif back_bytes.startswith(b"RIFF") and b"WEBP" in back_bytes[:16]:
                back_mime = "image/webp"

            back_b64 = base64.b64encode(back_bytes).decode("utf-8")
            parts.append({
                "inlineData": {
                    "mimeType": back_mime,
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
                "responseMimeType": "application/json"
            }
        }

        # Dynamic candidate resolution with automated fallback
        candidate_models = get_candidate_models()

        resp = None
        used_model = candidate_models[0]
        with httpx.Client(timeout=timeout_sec) as client:
            for m in candidate_models:
                used_model = m
                url = f"{GEMINI_API_BASE}/{m}:generateContent?key={api_key}"
                logger.info(f"Calling Gemini Flash Vision API ({m})...")
                resp = client.post(url, json=payload, headers={"Content-Type": "application/json"})
                if resp.status_code == 200:
                    global _CACHED_WORKING_MODEL
                    _CACHED_WORKING_MODEL = m
                    break
                logger.warning(f"Model {m} returned HTTP {resp.status_code}: {resp.text[:250]}")

        if not resp or resp.status_code != 200:
            logger.error(f"Gemini API all candidate models failed. Last response: {resp.text[:300] if resp else 'No response'}")
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

        if parsed and (parsed.get("name") or parsed.get("idNumber") or parsed.get("dob") or parsed.get("address")):
            logger.info(f"Successfully extracted ID using Gemini Vision AI ({used_model}): {parsed.get('name')} | {parsed.get('idNumber')}")
            return parsed

        return None

    except httpx.TimeoutException:
        logger.warning(f"Gemini API timed out after {timeout_sec}s. Gracefully falling back to local OCR.")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in Gemini Vision extraction: {e}", exc_info=True)
        return None
