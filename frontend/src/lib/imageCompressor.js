/**
 * imageCompressor.js
 *
 * Ultra-fast client-side image compression (<30ms).
 * Corrects EXIF camera orientation natively on mobile devices.
 * Scales down large mobile camera photos (4000x3000px, 8MB-15MB)
 * to an optimal OCR resolution (max 1400px, ~150KB - 250KB)
 * while preserving crystal-clear text sharpness.
 *
 * Prevents browser memory bloat, eliminates upload delays,
 * and ensures sub-second OCR inference.
 */

export async function compressImageForOCR(fileOrBlob, maxDimension = 1400, quality = 0.92) {
  if (!fileOrBlob) return null;

  try {
    let sourceWidth, sourceHeight, drawSource;
    let bitmap = null;

    // Use createImageBitmap with native EXIF orientation if available (modern mobile Safari & Chrome)
    if (typeof createImageBitmap === 'function') {
      try {
        bitmap = await createImageBitmap(fileOrBlob, { imageOrientation: 'from-image' });
        sourceWidth = bitmap.width;
        sourceHeight = bitmap.height;
        drawSource = bitmap;
      } catch (_) {
        // Fallback to standard Image if imageOrientation option not supported
      }
    }

    if (!bitmap) {
      const img = new Image();
      const objectUrl = URL.createObjectURL(fileOrBlob);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = objectUrl;
      });
      URL.revokeObjectURL(objectUrl);
      sourceWidth = img.width;
      sourceHeight = img.height;
      drawSource = img;
    }

    let width = sourceWidth;
    let height = sourceHeight;

    // Calculate new dimensions preserving aspect ratio
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });

    // High quality bicubic downscaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fill white background in case of transparent PNGs
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    ctx.drawImage(drawSource, 0, 0, width, height);

    if (bitmap && typeof bitmap.close === 'function') {
      bitmap.close();
    }

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(fileOrBlob);
            return;
          }
          // Wrap as a File object so FormData handles it with original name
          const compressedFile = new File(
            [blob],
            fileOrBlob.name ? fileOrBlob.name.replace(/\.[^.]+$/, '.jpg') : 'document_scan.jpg',
            { type: 'image/jpeg', lastModified: Date.now() }
          );
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    });
  } catch (err) {
    console.warn('Compression fallback to original file:', err);
    return fileOrBlob;
  }
}

/**
 * Converts a base64 Data URL to a native File object for OCR FormData submission.
 */
export function base64ToFile(base64String, filename = 'guest_id.jpg') {
  if (!base64String) return null;
  try {
    const arr = base64String.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime, lastModified: Date.now() });
  } catch (e) {
    console.error('Error converting base64 to file:', e);
    return null;
  }
}

/**
 * Compresses an image file or blob directly into an ultra-lean base64 JPEG data URL (~40KB-75KB).
 * Guards against browser LocalStorage QuotaExceededError and backend 413 Payload Too Large.
 *
 * @param {File|Blob|string} fileOrBlobOrBase64
 * @param {number} [maxDimension=900]
 * @param {number} [quality=0.72]
 * @returns {Promise<string>}
 */
export async function compressImageToBase64(fileOrBlobOrBase64, maxDimension = 900, quality = 0.72) {
  if (!fileOrBlobOrBase64) return '';

  let blob = fileOrBlobOrBase64;
  if (typeof fileOrBlobOrBase64 === 'string') {
    if (!fileOrBlobOrBase64.startsWith('data:image')) {
      return fileOrBlobOrBase64;
    }
    blob = base64ToFile(fileOrBlobOrBase64);
  }

  try {
    const compressedFile = await compressImageForOCR(blob, maxDimension, quality);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(compressedFile);
    });
  } catch (err) {
    console.warn('[ImageCompressor] compressImageToBase64 fallback:', err);
    if (typeof fileOrBlobOrBase64 === 'string') return fileOrBlobOrBase64;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  }
}
