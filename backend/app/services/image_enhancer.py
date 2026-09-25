"""
image_enhancer.py

Advanced multi-stage image preprocessing pipeline for Indian ID documents.
Handles blurry, low-contrast, noisy, skewed, and dark images.

Tech Stack:
- OpenCV  : Deblur, deskew, adaptive threshold, morphology
- NumPy   : Pixel math, channel manipulation
- Pillow  : Sharpening, brightness/contrast
- scikit-image: Denoise, SSIM-based quality check
"""

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import io
import logging
import math

logger = logging.getLogger("image_enhancer")

try:
    from skimage.restoration import denoise_tv_chambolle, estimate_sigma, richardson_lucy
    from skimage.filters import threshold_sauvola
    from skimage.util import img_as_float, img_as_ubyte
    from skimage.measure import shannon_entropy
    HAS_SKIMAGE = True
except ImportError:
    HAS_SKIMAGE = False
    logger.warning("scikit-image not available — skipping advanced denoise/deblur")


# ─── Quality Assessment ───────────────────────────────────────────────────────

def estimate_blur_score(gray: np.ndarray) -> float:
    """Laplacian variance — lower = blurrier. <100 is considered blurry."""
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def estimate_brightness(gray: np.ndarray) -> float:
    """Average pixel brightness (0-255)."""
    return float(np.mean(gray))


def estimate_contrast(gray: np.ndarray) -> float:
    """Standard deviation of gray pixels — lower = less contrast."""
    return float(np.std(gray))


def assess_image_quality(gray: np.ndarray) -> dict:
    blur = estimate_blur_score(gray)
    brightness = estimate_brightness(gray)
    contrast = estimate_contrast(gray)
    is_blurry = blur < 100.0
    is_dark = brightness < 80
    is_washed = brightness > 210
    is_low_contrast = contrast < 30
    return {
        "blur_score": blur,
        "brightness": brightness,
        "contrast": contrast,
        "is_blurry": is_blurry,
        "is_dark": is_dark,
        "is_washed": is_washed,
        "is_low_contrast": is_low_contrast,
    }


# ─── Stage 1: Upscale ────────────────────────────────────────────────────────

def upscale_if_needed(img_bgr: np.ndarray, min_dim: int = 1200) -> np.ndarray:
    """
    Upscale small images using LANCZOS4 interpolation.
    Small images (<1200px on long side) often cause OCR failures.
    """
    h, w = img_bgr.shape[:2]
    long_side = max(h, w)
    if long_side < min_dim:
        scale = min_dim / long_side
        new_w = int(w * scale)
        new_h = int(h * scale)
        img_bgr = cv2.resize(img_bgr, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)
        logger.info(f"Upscaled: {w}x{h} → {new_w}x{new_h}")
    return img_bgr


# ─── Stage 2: Deskew ─────────────────────────────────────────────────────────

def deskew(gray: np.ndarray) -> np.ndarray:
    """
    Detect and correct skew angle using Hough line transform.
    Skewed documents cause OCR to read text diagonally (garbage output).
    """
    try:
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=80,
                                minLineLength=60, maxLineGap=10)
        if lines is None:
            return gray

        angles = []
        for line in lines:
            pts = line.reshape(-1)
            if len(pts) >= 4:
                x1, y1, x2, y2 = pts[:4]
                if x2 != x1:
                    angle = math.degrees(math.atan2(y2 - y1, x2 - x1))
                    if -45 < angle < 45:  # ignore near-vertical lines
                        angles.append(angle)

        if not angles:
            return gray

        median_angle = float(np.median(angles))
        if abs(median_angle) < 0.5:
            return gray  # negligible skew

        h, w = gray.shape
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
        rotated = cv2.warpAffine(gray, M, (w, h),
                                 flags=cv2.INTER_LINEAR,
                                 borderMode=cv2.BORDER_REPLICATE)
        logger.info(f"Deskew applied: {median_angle:.2f}°")
        return rotated
    except Exception as e:
        logger.warning(f"Deskew failed: {e}")
        return gray


# ─── Stage 3: Deblur ─────────────────────────────────────────────────────────

def deblur_richardson_lucy(gray: np.ndarray, num_iter: int = 10) -> np.ndarray:
    """
    Richardson-Lucy deconvolution via scikit-image.
    Recovers fine text edges from motion-blurred and out-of-focus camera shots.
    """
    if not HAS_SKIMAGE:
        return gray
    try:
        img_f = img_as_float(gray)
        # 5x5 Gaussian point spread function (PSF)
        psf = cv2.getGaussianKernel(5, 1.2)
        psf = psf @ psf.T
        deconv = richardson_lucy(img_f, psf, num_iter=num_iter)
        deconv = np.clip(deconv, 0, 1)
        res = img_as_ubyte(deconv)
        logger.info("Richardson-Lucy deconvolution applied successfully")
        return res
    except Exception as e:
        logger.warning(f"Richardson-Lucy deblur failed: {e}")
        return gray


def deblur_image(gray: np.ndarray, blur_score: float) -> np.ndarray:
    """
    Multi-level deblurring depending on how blurry the image is.
    - Mildly blurry  → unsharp mask
    - Very blurry    → Richardson-Lucy deconvolution + Wiener/FFT
    """
    if blur_score >= 100:
        return gray  # Sharp enough

    if blur_score >= 40:
        # Mild: Unsharp mask
        blurred = cv2.GaussianBlur(gray, (0, 0), sigmaX=2.5)
        sharpened = cv2.addWeighted(gray, 1.8, blurred, -0.8, 0)
        logger.info("Mild deblur: unsharp mask applied")
        return np.clip(sharpened, 0, 255).astype(np.uint8)

    # Severe blur: Try Richardson-Lucy first
    if HAS_SKIMAGE:
        rl = deblur_richardson_lucy(gray, num_iter=12)
        if rl is not None and not np.array_equal(rl, gray):
            return rl

    # Wiener filter approximation via FFT
    try:
        f = np.fft.fft2(gray.astype(np.float64))
        fshift = np.fft.fftshift(f)
        rows, cols = gray.shape
        crow, ccol = rows // 2, cols // 2

        # Butterworth high-pass to boost edges
        D = np.zeros((rows, cols))
        for u in range(rows):
            for v in range(cols):
                D[u, v] = np.sqrt((u - crow) ** 2 + (v - ccol) ** 2)

        D = D + 1e-6
        H = 1.0 / (1.0 + (20.0 / D) ** (2 * 4))

        filtered = fshift * H
        f_ishift = np.fft.ifftshift(filtered)
        img_back = np.fft.ifft2(f_ishift)
        img_back = np.abs(img_back)
        result = cv2.normalize(img_back, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        logger.info("Severe deblur: FFT high-pass applied")
        return result
    except Exception as e:
        logger.warning(f"FFT deblur failed: {e}, using unsharp mask fallback")
        blurred = cv2.GaussianBlur(gray, (0, 0), sigmaX=3)
        return np.clip(cv2.addWeighted(gray, 2.0, blurred, -1.0, 0), 0, 255).astype(np.uint8)


# ─── Stage 3b: Glare and Shadow Normalization ────────────────────────────────

def remove_shadows_and_glare(gray: np.ndarray) -> np.ndarray:
    """
    Normalizes uneven phone camera flash glare and shadows using
    morphological background illumination estimation.
    """
    try:
        # Estimate background illumination
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 25))
        bg = cv2.morphologyEx(gray, cv2.MORPH_DILATE, kernel)
        bg = cv2.medianBlur(bg, 21)
        # Invert difference to boost text vs background
        diff = 255 - cv2.absdiff(gray, bg)
        norm = cv2.normalize(diff, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8U)
        return norm
    except Exception as e:
        logger.warning(f"Shadow removal failed: {e}")
        return gray


# ─── Stage 4: Denoise ────────────────────────────────────────────────────────

def denoise_image(gray: np.ndarray) -> np.ndarray:
    """
    Remove noise before thresholding.
    Tries scikit-image TV denoising first (preserves edges best).
    Falls back to OpenCV fastNlMeans.
    """
    if HAS_SKIMAGE:
        try:
            sigma_est = estimate_sigma(gray, channel_axis=None)
            if sigma_est > 6:  # Denoise when noise is detectable
                img_float = img_as_float(gray)
                denoised_float = denoise_tv_chambolle(img_float, weight=0.04, channel_axis=None)
                denoised = img_as_ubyte(np.clip(denoised_float, 0, 1))
                logger.info(f"scikit-image TV denoise applied (sigma≈{sigma_est:.1f})")
                return denoised
        except Exception as e:
            logger.warning(f"skimage denoise failed: {e}")

    # OpenCV fallback
    denoised = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)
    return denoised


# ─── Stage 5: Contrast Enhancement ──────────────────────────────────────────

def enhance_contrast(gray: np.ndarray, quality: dict) -> np.ndarray:
    """
    Adaptive contrast enhancement:
    - CLAHE for locally uneven lighting
    - Gamma correction for dark/bright images
    - Histogram stretch for washed-out images
    """
    # Gamma correction
    if quality["is_dark"]:
        # Brighten dark images (gamma < 1 = brighten)
        gamma = 0.5
        lut = np.array([((i / 255.0) ** gamma) * 255 for i in range(256)], dtype=np.uint8)
        gray = cv2.LUT(gray, lut)
        logger.info("Gamma correction applied (dark image)")
    elif quality["is_washed"]:
        # Darken washed-out images
        gamma = 1.5
        lut = np.array([((i / 255.0) ** gamma) * 255 for i in range(256)], dtype=np.uint8)
        gray = cv2.LUT(gray, lut)
        logger.info("Gamma correction applied (washed image)")

    # Histogram stretching for low-contrast images
    if quality["is_low_contrast"]:
        p_low, p_high = np.percentile(gray, (2, 98))
        if p_high > p_low:
            gray = np.clip((gray.astype(np.float32) - p_low) * 255.0 / (p_high - p_low), 0, 255).astype(np.uint8)
        logger.info("Histogram stretch applied (low contrast)")

    # CLAHE - main contrast enhancement (adaptive, works on tiles)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)

    return gray


# ─── Stage 6: Binarization ───────────────────────────────────────────────────

def binarize(gray: np.ndarray) -> np.ndarray:
    """
    Threshold to black & white — critical for OCR accuracy.
    Includes Sauvola thresholding (scikit-image) which excels on blurry/degraded document text.
    """
    results = {}

    # Method A: Otsu global
    _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    results["otsu"] = otsu

    # Method B: Adaptive Gaussian
    adaptive_gauss = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, blockSize=31, C=15
    )
    results["adaptive_gauss"] = adaptive_gauss

    # Method C: Adaptive Mean
    adaptive_mean = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C,
        cv2.THRESH_BINARY, blockSize=21, C=10
    )
    results["adaptive_mean"] = adaptive_mean

    # Method D: Sauvola local threshold (scikit-image)
    if HAS_SKIMAGE:
        try:
            th_sauvola = threshold_sauvola(gray, window_size=25, k=0.2)
            results["sauvola"] = ((gray > th_sauvola) * 255).astype(np.uint8)
        except Exception as e:
            logger.warning(f"Sauvola threshold error: {e}")

    # Score: prefer method with ~15-40% black pixels (typical document text density)
    best_name = "adaptive_gauss"
    best_score = float('inf')
    for name, img in results.items():
        black_ratio = 1.0 - (np.sum(img > 127) / img.size)
        score = abs(black_ratio - 0.22)
        if score < best_score:
            best_score = score
            best_name = name

    logger.info(f"Binarization: '{best_name}' selected")
    return results[best_name]


# ─── Stage 7: Morphological Cleanup ─────────────────────────────────────────

def morphological_cleanup(binary: np.ndarray) -> np.ndarray:
    """
    Remove salt-and-pepper noise and connect broken characters.
    """
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
    opened = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=1)
    kernel_close = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 1))
    closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel_close, iterations=1)
    return closed


# ─── Stage 8: Pillow Final Sharpen ──────────────────────────────────────────

def pillow_sharpen(gray_np: np.ndarray) -> np.ndarray:
    """
    Final sharpening pass using PIL's UnsharpMask for clean edges.
    """
    pil_img = Image.fromarray(gray_np)
    sharpened = pil_img.filter(ImageFilter.UnsharpMask(radius=2, percent=160, threshold=3))
    enhancer = ImageEnhance.Contrast(sharpened)
    sharpened = enhancer.enhance(1.3)
    return np.array(sharpened)


# ─── Master Pipeline ─────────────────────────────────────────────────────────

def enhance_for_ocr(image_bytes: bytes) -> list[np.ndarray]:
    """
    Master enhancement pipeline using OpenCV, NumPy, Pillow, and scikit-image.
    Generates multiple targeted image variants to maximize OCR accuracy across
    any Indian ID document (Aadhaar, PAN, Voter ID, Passport, DL).

    Returns:
        List of BGR numpy arrays, each a different enhancement variant.
    """
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img_bgr is None:
            pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

        variants = []

        # ── 1. Upscale if small ───────────────────────────────────────────
        img_bgr = upscale_if_needed(img_bgr, min_dim=1500)

        # ── 2. Convert to grayscale ───────────────────────────────────────
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

        # ── 3. Quality assessment ─────────────────────────────────────────
        quality = assess_image_quality(gray)
        logger.info(
            f"Image quality: blur={quality['blur_score']:.1f}, "
            f"brightness={quality['brightness']:.1f}, "
            f"contrast={quality['contrast']:.1f}, "
            f"blurry={quality['is_blurry']}, dark={quality['is_dark']}"
        )

        # ── 4. Deskew ─────────────────────────────────────────────────────
        gray_deskewed = deskew(gray)

        # ── Variant 1: Richardson-Lucy Deblur + Sauvola Binarize (Best for Blur) ──
        if quality["is_blurry"] and HAS_SKIMAGE:
            g1 = deblur_richardson_lucy(gray_deskewed, num_iter=12)
            g1 = enhance_contrast(g1, quality)
            try:
                th_sauvola = threshold_sauvola(g1, window_size=25, k=0.2)
                g1_bin = ((g1 > th_sauvola) * 255).astype(np.uint8)
                g1_bin = morphological_cleanup(g1_bin)
                g1_final = pillow_sharpen(g1_bin)
                variants.append(cv2.cvtColor(g1_final, cv2.COLOR_GRAY2BGR))
            except Exception as e:
                logger.warning(f"Variant 1 generation error: {e}")

        # ── Variant 2: Full Deblur + Shadow Removal + CLAHE + Adaptive Threshold ──
        g2 = deblur_image(gray_deskewed, quality["blur_score"])
        g2 = remove_shadows_and_glare(g2)
        g2 = denoise_image(g2)
        g2 = enhance_contrast(g2, quality)
        g2_bin = binarize(g2)
        g2_bin = morphological_cleanup(g2_bin)
        g2_final = pillow_sharpen(g2_bin)
        variants.append(cv2.cvtColor(g2_final, cv2.COLOR_GRAY2BGR))

        # ── Variant 3: Sharpened High-Contrast Grayscale (Best for EasyOCR/Neural) ──
        g3 = enhance_contrast(gray_deskewed.copy(), quality)
        blurred = cv2.GaussianBlur(g3, (0, 0), sigmaX=2.0)
        g3_sharp = cv2.addWeighted(g3, 1.8, blurred, -0.8, 0)
        g3_sharp = np.clip(g3_sharp, 0, 255).astype(np.uint8)
        g3_pil = pillow_sharpen(g3_sharp)
        variants.append(cv2.cvtColor(g3_pil, cv2.COLOR_GRAY2BGR))

        # ── Variant 4: CLAHE + Adaptive Gaussian (Standard robust) ────────
        clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(8, 8))
        g4 = clahe.apply(gray_deskewed)
        g4_bin = cv2.adaptiveThreshold(g4, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                       cv2.THRESH_BINARY, blockSize=25, C=12)
        variants.append(cv2.cvtColor(g4_bin, cv2.COLOR_GRAY2BGR))

        # ── Variant 5: Original upscaled (safe baseline) ──────────────────
        variants.append(img_bgr)

        logger.info(f"Image enhancement complete — {len(variants)} variants ready")
        return variants

    except Exception as e:
        logger.error(f"Image enhancement pipeline failed: {e}", exc_info=True)
        # Last resort: return raw decoded image as single variant
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            raw = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if raw is not None:
                return [raw]
        except Exception:
            pass
        return []
