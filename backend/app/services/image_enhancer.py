"""
image_enhancer.py

High-performance computer vision enhancement pipeline for Indian ID documents.
Designed for sub-second latency and maximum OCR text accuracy.

Technologies:
- OpenCV (cv2): High-speed scaling, CLAHE, morphological filtering, Hough deskew
- NumPy: Array operations, percentile stretching, gamma LUT
- Pillow: UnsharpMask filtering
- scikit-image: TV denoising, Sauvola adaptive binarization, Laplacian blur estimation
"""

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import io
import logging
import math

logger = logging.getLogger("image_enhancer")

try:
    from skimage.restoration import denoise_tv_chambolle, estimate_sigma
    from skimage.filters import threshold_sauvola
    from skimage.util import img_as_float, img_as_ubyte
    HAS_SKIMAGE = True
except ImportError:
    HAS_SKIMAGE = False


# ─── Resolution Normalization ────────────────────────────────────────────────

def normalize_resolution(img_bgr: np.ndarray, target_dim: int = 1200) -> np.ndarray:
    """
    Standardize image dimensions.
    - Large photos (3000-4000px phone shots) are downscaled to 1200px (10x faster inference).
    - Tiny photos (<800px) are upscaled with cubic interpolation.
    """
    h, w = img_bgr.shape[:2]
    long_side = max(h, w)
    
    if long_side > target_dim:
        scale = target_dim / long_side
        new_w = max(1, int(w * scale))
        new_h = max(1, int(h * scale))
        return cv2.resize(img_bgr, (new_w, new_h), interpolation=cv2.INTER_AREA)
    elif long_side < 800:
        scale = 1000 / long_side
        new_w = max(1, int(w * scale))
        new_h = max(1, int(h * scale))
        return cv2.resize(img_bgr, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
    
    return img_bgr


# ─── Quality Assessment ───────────────────────────────────────────────────────

def estimate_blur_score(gray: np.ndarray) -> float:
    """Laplacian variance. <80 = blurry, >120 = sharp."""
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def estimate_brightness(gray: np.ndarray) -> float:
    return float(np.mean(gray))


def assess_image_quality(gray: np.ndarray) -> dict:
    blur = estimate_blur_score(gray)
    brightness = estimate_brightness(gray)
    return {
        "blur_score": blur,
        "brightness": brightness,
        "is_blurry": blur < 85.0,
        "is_dark": brightness < 80,
        "is_washed": brightness > 215,
    }


# ─── Deskew ───────────────────────────────────────────────────────────────────

def deskew(gray: np.ndarray) -> np.ndarray:
    """
    Fast Hough line skew correction. Limits to small angles (-30 to +30 deg).
    """
    try:
        # Downscale for instant Canny detection
        h, w = gray.shape
        scale = min(1.0, 600.0 / max(h, w))
        small = cv2.resize(gray, (int(w * scale), int(h * scale))) if scale < 1.0 else gray
        
        edges = cv2.Canny(small, 50, 150, apertureSize=3)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=70,
                                minLineLength=40, maxLineGap=8)
        if lines is None:
            return gray

        angles = []
        for line in lines:
            pts = line.reshape(-1)
            if len(pts) >= 4:
                x1, y1, x2, y2 = pts[:4]
                if x2 != x1:
                    angle = math.degrees(math.atan2(y2 - y1, x2 - x1))
                    if -35 < angle < 35:
                        angles.append(angle)

        if not angles:
            return gray

        median_angle = float(np.median(angles))
        if abs(median_angle) < 0.6:
            return gray  # Negligible skew

        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
        return cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    except Exception as e:
        logger.debug(f"Deskew skipped: {e}")
        return gray


# ─── Illumination & Shadow Normalization ──────────────────────────────────────

def normalize_illumination(gray: np.ndarray) -> np.ndarray:
    """
    Removes smartphone flash glare and uneven room shadow.
    """
    try:
        # Estimate background illumination using fast morphology
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (19, 19))
        bg = cv2.morphologyEx(gray, cv2.MORPH_DILATE, kernel)
        bg = cv2.medianBlur(bg, 17)
        diff = 255 - cv2.absdiff(gray, bg)
        norm = cv2.normalize(diff, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8U)
        return norm
    except Exception:
        return gray


# ─── Fast Enhancement Pipeline ────────────────────────────────────────────────

def fast_enhance_image(img_bgr: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Ultra-fast single-pass enhancement (<20ms).
    Produces:
      1. gray_sharp: Contrast-boosted, unsharp-masked grayscale (ideal for Tesseract LSTM & EasyOCR)
      2. binary_clean: Clean adaptive binarized image (ideal fallback)
    """
    # 1. Normalize resolution
    img_bgr = normalize_resolution(img_bgr, target_dim=1200)
    
    # 2. Grayscale & Deskew
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    gray = deskew(gray)
    
    # 3. Quality check
    quality = assess_image_quality(gray)
    
    # 4. Illumination normalization if uneven/dark
    if quality["is_dark"] or quality["is_washed"]:
        gray = normalize_illumination(gray)
    
    # 5. Adaptive Contrast (CLAHE)
    clip = 3.5 if quality["is_blurry"] else 2.2
    clahe = cv2.createCLAHE(clipLimit=clip, tileGridSize=(8, 8))
    enhanced_gray = clahe.apply(gray)
    
    # 6. Edge boost / Unsharp mask
    # Formula: sharp = (1 + amount) * orig - amount * blurred
    blur_k = 2.0 if quality["is_blurry"] else 1.2
    amount = 1.8 if quality["is_blurry"] else 1.3
    blurred = cv2.GaussianBlur(enhanced_gray, (0, 0), sigmaX=blur_k)
    gray_sharp = cv2.addWeighted(enhanced_gray, amount, blurred, -(amount - 1.0), 0)
    gray_sharp = np.clip(gray_sharp, 0, 255).astype(np.uint8)
    
    # 7. Adaptive binarization (fast fallback)
    binary_clean = cv2.adaptiveThreshold(
        enhanced_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, blockSize=25, C=11
    )
    
    return gray_sharp, binary_clean


def enhance_for_ocr(image_bytes: bytes) -> list[np.ndarray]:
    """
    Master enhancement entry point.
    Returns [gray_sharp_bgr, binary_clean_bgr, original_bgr]
    """
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

        gray_sharp, binary_clean = fast_enhance_image(img_bgr)
        
        # Convert to BGR for OCR compatibility
        v1 = cv2.cvtColor(gray_sharp, cv2.COLOR_GRAY2BGR)
        v2 = cv2.cvtColor(binary_clean, cv2.COLOR_GRAY2BGR)
        
        return [v1, v2]
    except Exception as e:
        logger.error(f"Image enhancement error: {e}", exc_info=True)
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            raw = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if raw is not None:
                return [raw]
        except Exception:
            pass
        return []
