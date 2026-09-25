"""
paddle_ocr.py

Multi-Engine OCR with Advanced Image Enhancement.
Tries PaddleOCR → EasyOCR → Tesseract as fallbacks.
For each image, runs MULTIPLE preprocessing variants and picks the one
with the most text (highest confidence + character count).

Enhancement pipeline: image_enhancer.py
    - OpenCV   : upscale, deskew, deblur (Laplacian/FFT), adaptive threshold, morphology
    - NumPy    : pixel math, histogram stretch, gamma correction
    - Pillow   : sharpening (UnsharpMask), contrast boost
    - scikit-image : TV denoise, Richardson-Lucy deconvolution, Sauvola local threshold
"""

import numpy as np
import cv2
from PIL import Image
import io
import os
import shutil
import logging
from app.services.image_enhancer import enhance_for_ocr

logger = logging.getLogger("ocr_engine")

HAS_PADDLE    = False
HAS_EASYOCR   = False
HAS_TESSERACT = False

# ─── Engine availability checks ───────────────────────────────────────────────

try:
    from paddleocr import PaddleOCR
    HAS_PADDLE = True
    logger.info("PaddleOCR imported OK")
except ImportError:
    logger.warning("PaddleOCR not available — trying EasyOCR")

try:
    import easyocr
    HAS_EASYOCR = True
    logger.info("EasyOCR imported OK")
except ImportError:
    logger.warning("EasyOCR not available")

try:
    import pytesseract
    HAS_TESSERACT = True
    # Auto-detect Tesseract binary path on Windows if not on PATH
    if not shutil.which("tesseract"):
        common_tess_paths = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
        ]
        for p in common_tess_paths:
            if os.path.exists(p):
                pytesseract.pytesseract.tesseract_cmd = p
                logger.info(f"Tesseract binary detected at: {p}")
                break
    logger.info("Tesseract imported OK")
except ImportError:
    HAS_TESSERACT = False
    logger.warning("Tesseract not available")


# ─── Helper: score a text result ──────────────────────────────────────────────

def score_text(text: str) -> int:
    """
    Score an OCR result. Higher = better.
    Counts alphanumeric characters + bonuses for Indian ID patterns and keywords.
    """
    if not text:
        return 0
    import re
    score = len(re.findall(r'[A-Za-z0-9]', text))
    # Bonus for recognizing known Indian ID patterns
    if re.search(r'[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}', text): score += 60   # Aadhaar
    if re.search(r'[A-Z]{5}[0-9]{4}[A-Z]', text):              score += 60   # PAN
    if re.search(r'[A-Z]{3}[0-9]{7}', text):                    score += 50   # Voter ID
    if re.search(r'[A-PR-WYZ][1-9][0-9]{6}[0-9]', text, re.I):  score += 50   # Passport
    if re.search(r'[A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{4}', text): score += 40  # Driving License
    if re.search(r'\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4}', text):    score += 35   # DOB
    if re.search(r'MALE|FEMALE|पुरुष|महिला', text, re.I):        score += 20
    if re.search(r'INDIA|GOVERNMENT|INCOME TAX|ELECTION|UIDAI', text, re.I): score += 25
    return score


# ─── Multi-Engine OCR class ───────────────────────────────────────────────────

class MultiOCREngine:
    def __init__(self):
        self.engines = []  # list of (name, engine_obj)

        if HAS_PADDLE:
            try:
                paddle = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
                self.engines.append(("PaddleOCR", paddle))
                logger.info("PaddleOCR engine initialized")
            except Exception as e:
                logger.error(f"PaddleOCR init failed: {e}")

        if HAS_EASYOCR:
            try:
                easy = easyocr.Reader(['en'], gpu=False, verbose=False)
                self.engines.append(("EasyOCR", easy))
                logger.info("EasyOCR engine initialized")
            except Exception as e:
                logger.error(f"EasyOCR init failed: {e}")

        if not self.engines:
            logger.warning("No Neural OCR engine available! Relying on Tesseract.")

        logger.info(f"Active engines: {[e[0] for e in self.engines]}")

    def _run_paddle(self, engine, img_bgr: np.ndarray) -> str:
        """Run PaddleOCR on a BGR numpy array."""
        try:
            result = engine.ocr(img_bgr, cls=True)
            if not result or result[0] is None:
                return ""
            lines = []
            for line in result[0]:
                text = line[1][0].strip()
                confidence = line[1][1]
                if confidence > 0.25 and text:
                    lines.append(text)
            return "\n".join(lines)
        except Exception as e:
            logger.warning(f"PaddleOCR run error: {e}")
            return ""

    def _run_easyocr(self, engine, img_bgr: np.ndarray) -> str:
        """Run EasyOCR on a BGR numpy array."""
        try:
            results = engine.readtext(img_bgr, detail=0, paragraph=False)
            return "\n".join(r.strip() for r in results if r.strip())
        except Exception as e:
            logger.warning(f"EasyOCR run error: {e}")
            return ""

    def _run_tesseract(self, img_bgr: np.ndarray) -> str:
        """Run Tesseract with English + Hindi or English fallback."""
        if not HAS_TESSERACT:
            return ""
        try:
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY) if len(img_bgr.shape) == 3 else img_bgr
            try:
                text = pytesseract.image_to_string(gray, lang='eng+hin', config='--oem 1 --psm 3')
            except Exception:
                text = pytesseract.image_to_string(gray, lang='eng', config='--oem 1 --psm 3')
            return text.strip()
        except Exception as e:
            logger.warning(f"Tesseract run error: {e}")
            return ""

    def _ocr_single_variant(self, img_bgr: np.ndarray) -> str:
        """
        Try all available OCR engines on ONE image variant.
        Returns the best result across all engines.
        """
        best_text = ""
        best_score = 0

        for name, engine in self.engines:
            if name == "PaddleOCR":
                text = self._run_paddle(engine, img_bgr)
            elif name == "EasyOCR":
                text = self._run_easyocr(engine, img_bgr)
            else:
                continue

            s = score_text(text)
            logger.info(f"  Engine={name}, score={s}, chars={len(text)}")
            if s > best_score:
                best_score = s
                best_text = text

        # Tesseract fallback if engines didn't score high enough
        if best_score < 40 and HAS_TESSERACT:
            logger.info("  Running Tesseract pass...")
            tess_text = self._run_tesseract(img_bgr)
            tess_score = score_text(tess_text)
            logger.info(f"  Engine=Tesseract, score={tess_score}, chars={len(tess_text)}")
            if tess_score > best_score:
                best_score = tess_score
                best_text = tess_text

        return best_text

    def extract_text_from_bytes(self, image_bytes: bytes) -> str:
        """
        Main entry point.

        1. Runs image enhancement pipeline → gets multiple preprocessed variants
           (OpenCV + NumPy + Pillow + scikit-image)
        2. Runs OCR on EACH variant
        3. Returns the result with the highest score
        """
        if not image_bytes:
            return ""

        # Step 1: Generate enhancement variants
        logger.info("Starting image enhancement pipeline...")
        variants = enhance_for_ocr(image_bytes)

        if not variants:
            logger.error("Image enhancement returned no variants!")
            return ""

        logger.info(f"Got {len(variants)} image variants to process")

        # Step 2: OCR each variant
        best_text = ""
        best_score = 0

        for i, variant_bgr in enumerate(variants):
            logger.info(f"OCR on variant {i+1}/{len(variants)}...")
            text = self._ocr_single_variant(variant_bgr)
            s = score_text(text)
            logger.info(f"Variant {i+1} → score={s}, length={len(text)}")

            if s > best_score:
                best_score = s
                best_text = text

            # Early exit if we have a clearly great result
            if best_score >= 150:
                logger.info(f"Early exit — good result at variant {i+1}")
                break

        logger.info(f"Best OCR result: score={best_score}, length={len(best_text)}")
        return best_text


# ─── Singleton ────────────────────────────────────────────────────────────────

_ocr_engine_instance = None

def get_paddle_engine() -> MultiOCREngine:
    global _ocr_engine_instance
    if _ocr_engine_instance is None:
        logger.info("Initializing Multi-Engine OCR (PaddleOCR + EasyOCR + Tesseract)...")
        _ocr_engine_instance = MultiOCREngine()
    return _ocr_engine_instance
