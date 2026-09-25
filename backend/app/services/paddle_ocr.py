import numpy as np
import cv2
from PIL import Image
import io
import logging

logger = logging.getLogger("ocr_engine")

HAS_PADDLE = False
HAS_EASYOCR = False

# Try importing PaddleOCR
try:
    from paddleocr import PaddleOCR
    HAS_PADDLE = True
    logger.info("PaddleOCR library imported successfully.")
except ImportError:
    logger.warning("PaddleOCR not available for this Python version, checking EasyOCR fallback...")

# Try importing EasyOCR as fallback
try:
    import easyocr
    HAS_EASYOCR = True
    logger.info("EasyOCR library imported successfully.")
except ImportError:
    logger.warning("EasyOCR not available.")


class MultiOCREngine:
    def __init__(self):
        self.engine_name = "None"
        self.ocr = None

        if HAS_PADDLE:
            try:
                self.ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
                self.engine_name = "PaddleOCR"
                logger.info("Initialized PaddleOCR Engine!")
            except Exception as e:
                logger.error(f"Failed to initialize PaddleOCR: {e}")

        if not self.ocr and HAS_EASYOCR:
            try:
                self.ocr = easyocr.Reader(['en', 'hi'])
                self.engine_name = "EasyOCR"
                logger.info("Initialized EasyOCR Engine fallback!")
            except Exception as e:
                logger.error(f"Failed to initialize EasyOCR: {e}")

    def extract_text_from_bytes(self, image_bytes: bytes) -> str:
        """
        Converts image bytes to numpy array and runs OCR prediction
        """
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_np = np.array(image)
            img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

            # Preprocess contrast using OpenCV CLAHE
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced_gray = clahe.apply(gray)
            enhanced_bgr = cv2.cvtColor(enhanced_gray, cv2.COLOR_GRAY2BGR)

            extracted_lines = []

            if self.engine_name == "PaddleOCR" and self.ocr:
                result = self.ocr.ocr(enhanced_bgr, cls=True)
                if result and len(result) > 0 and result[0] is not None:
                    for line in result[0]:
                        text = line[1][0].strip()
                        confidence = line[1][1]
                        if confidence > 0.35 and len(text) > 0:
                            extracted_lines.append(text)

            elif self.engine_name == "EasyOCR" and self.ocr:
                results = self.ocr.readtext(enhanced_bgr, detail=0)
                extracted_lines = [r.strip() for r in results if r.strip()]

            return "\n".join(extracted_lines)
        except Exception as e:
            logger.error(f"Error during OCR processing: {e}")
            return ""

ocr_engine_instance = None

def get_paddle_engine() -> MultiOCREngine:
    global ocr_engine_instance
    if ocr_engine_instance is None:
        ocr_engine_instance = MultiOCREngine()
    return ocr_engine_instance
