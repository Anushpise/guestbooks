/**
 * ocrUtils.js
 *
 * Advanced multi-variant image preprocessing + Tesseract.js OCR.
 * Handles blurry, dark, low-contrast, and noisy Indian ID document images.
 *
 * Preprocessing variants tried:
 *  1. Grayscale + aggressive contrast boost + sharpening (best for most)
 *  2. Adaptive-threshold simulation (good for uneven lighting)
 *  3. Extreme sharpening (good for mild blur)
 *  4. Original upscaled (fallback — in case preprocessing hurts)
 *
 * Hindi support: eng+hin bilingual so Devanagari on Aadhaar/Voter ID
 * is recognized cleanly instead of being misread as ASCII garbage.
 */

import { createWorker } from 'tesseract.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Score an OCR text result — higher = more useful content. */
function scoreText(text) {
  if (!text) return 0;
  let score = (text.match(/[A-Za-z0-9]/g) || []).length;
  if (/[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}/.test(text)) score += 50; // Aadhaar
  if (/[A-Z]{5}[0-9]{4}[A-Z]/.test(text))              score += 50; // PAN
  if (/[A-Z]{3}[0-9]{7}/.test(text))                    score += 40; // Voter ID
  if (/\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4}/.test(text))    score += 30; // DOB
  return score;
}

/** Compute Laplacian variance of grayscale pixel data (blur detection). */
function computeBlurScore(pixels, width, height) {
  let sum = 0, count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const center = pixels[idx];
      const top    = pixels[((y - 1) * width + x) * 4];
      const bottom = pixels[((y + 1) * width + x) * 4];
      const left   = pixels[(y * width + x - 1) * 4];
      const right  = pixels[(y * width + x + 1) * 4];
      const lap = Math.abs(4 * center - top - bottom - left - right);
      sum += lap * lap;
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

// ─── Image Preprocessing Variants ────────────────────────────────────────────

/**
 * Variant 1: Grayscale + Contrast Boost + Unsharp Mask
 * Best for: normal to mildly blurry images, uneven brightness.
 */
function preprocessVariant1(img) {
  const scale = Math.max(1, 1600 / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width  = Math.round(img.width  * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d  = id.data;

  // Convert to grayscale + boost contrast
  const mean = (() => {
    let s = 0;
    for (let i = 0; i < d.length; i += 4)
      s += 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
    return s / (d.length / 4);
  })();

  // Auto-adjust contrast factor based on image brightness
  const brightnessFactor = mean < 80 ? 2.2 : mean > 200 ? 1.3 : 1.9;

  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
    const boosted = Math.min(255, Math.max(0, brightnessFactor * (g - mean) + mean));
    d[i] = d[i+1] = d[i+2] = boosted;
  }
  ctx.putImageData(id, 0, 0);

  // Unsharp mask pass
  const blurCanvas = document.createElement('canvas');
  blurCanvas.width  = canvas.width;
  blurCanvas.height = canvas.height;
  const blurCtx = blurCanvas.getContext('2d');
  blurCtx.filter = 'blur(2px)';
  blurCtx.drawImage(canvas, 0, 0);

  const orig = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const blurred = blurCtx.getImageData(0, 0, canvas.width, canvas.height);
  const sharpened = ctx.createImageData(canvas.width, canvas.height);
  for (let i = 0; i < orig.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const idx = i + c;
      sharpened.data[idx] = Math.min(255, Math.max(0,
        1.8 * orig.data[idx] - 0.8 * blurred.data[idx]
      ));
    }
    sharpened.data[i + 3] = 255;
  }
  ctx.putImageData(sharpened, 0, 0);

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Variant 2: Adaptive-threshold simulation
 * Best for: uneven lighting, shadows on document, phone camera photos.
 */
function preprocessVariant2(img) {
  const scale = Math.max(1, 1600 / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width  = Math.round(img.width  * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d  = id.data;
  const W  = canvas.width;
  const H  = canvas.height;

  // Convert to grayscale
  const gray = new Uint8Array(W * H);
  for (let i = 0; i < d.length; i += 4) {
    gray[i / 4] = Math.round(0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2]);
  }

  // Local mean using integral image (box filter, blockSize=25)
  const block = 25;
  const half  = Math.floor(block / 2);
  const C     = 12; // constant subtracted from mean

  const result = new Uint8Array(W * H);
  // Simple local mean (approximate for speed)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let sum = 0, cnt = 0;
      for (let dy = -half; dy <= half; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= H) continue;
        for (let dx = -half; dx <= half; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= W) continue;
          sum += gray[ny * W + nx];
          cnt++;
        }
      }
      const localMean = sum / cnt;
      result[y * W + x] = gray[y * W + x] > localMean - C ? 255 : 0;
    }
  }

  for (let i = 0; i < result.length; i++) {
    const idx = i * 4;
    d[idx] = d[idx+1] = d[idx+2] = result[i];
    d[idx+3] = 255;
  }
  ctx.putImageData(id, 0, 0);
  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Variant 3: Extreme sharpening (good for blurry camera shots)
 */
function preprocessVariant3(img) {
  const scale = Math.max(1.5, 2000 / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width  = Math.round(img.width  * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');

  // Draw with image smoothing disabled (preserves edges)
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d  = id.data;

  // Grayscale
  for (let i = 0; i < d.length; i += 4) {
    const g = Math.round(0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2]);
    d[i] = d[i+1] = d[i+2] = g;
  }
  ctx.putImageData(id, 0, 0);

  // Multiple blur+sharpen passes for deblurring effect
  for (let pass = 0; pass < 3; pass++) {
    const blurC = document.createElement('canvas');
    blurC.width = canvas.width; blurC.height = canvas.height;
    const bCtx  = blurC.getContext('2d');
    bCtx.filter = 'blur(1.5px)';
    bCtx.drawImage(canvas, 0, 0);

    const orig    = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const blur    = bCtx.getImageData(0, 0, canvas.width, canvas.height);
    const sharp   = ctx.createImageData(canvas.width, canvas.height);
    const amount  = 1.6 + pass * 0.2;

    for (let i = 0; i < orig.data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        sharp.data[i+c] = Math.min(255, Math.max(0,
          amount * orig.data[i+c] - (amount - 1) * blur.data[i+c]
        ));
      }
      sharp.data[i+3] = 255;
    }
    ctx.putImageData(sharp, 0, 0);
  }

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Variant 4: Original image upscaled only (safe fallback)
 */
function preprocessVariant4(img) {
  const scale = Math.max(1, 1400 / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width  = Math.round(img.width  * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png', 1.0);
}

/** Detect if image is blurry using Laplacian variance on canvas. */
function detectBlur(img) {
  const maxDim = 400; // small size is fine for blur detection
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width  = Math.round(img.width  * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
  // Quick grayscale pass
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
    d[i] = d[i+1] = d[i+2] = g;
  }
  return computeBlurScore(d, canvas.width, canvas.height);
}

// ─── Main preprocessing entry ─────────────────────────────────────────────────

/**
 * Generate multiple preprocessed variants of an image for OCR.
 * Returns an array of data URLs, ordered by expected usefulness.
 *
 * @param {File|Blob|string} imageFile
 * @returns {Promise<string[]>} array of data URLs
 */
export async function preprocessImageForOCR(imageFile) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = typeof imageFile === 'string' ? imageFile : URL.createObjectURL(imageFile);

    img.onload = () => {
      const blurScore = detectBlur(img);
      const isBlurry  = blurScore < 80;

      const variants = [];

      // Always include Variant 1 and 2
      variants.push(preprocessVariant1(img));
      variants.push(preprocessVariant2(img));

      // Add Variant 3 (aggressive deblur) if blurry
      if (isBlurry) {
        variants.push(preprocessVariant3(img));
      }

      // Always add original as safe fallback
      variants.push(preprocessVariant4(img));

      resolve(variants);
    };

    img.onerror = () => {
      // If image can't be loaded, return a single fallback
      resolve([typeof imageFile === 'string' ? imageFile : URL.createObjectURL(imageFile)]);
    };
  });
}

// ─── OCR Runner ───────────────────────────────────────────────────────────────

/**
 * Run Tesseract OCR on one preprocessed image URL.
 * @param {string} dataUrl - preprocessed image data URL
 * @param {string} psm - Tesseract PSM mode
 * @returns {Promise<{text: string, score: number}>}
 */
async function runTesseractOnUrl(dataUrl, psm = '3') {
  const worker = await createWorker(['eng', 'hin']);
  await worker.setParameters({
    tessedit_pageseg_mode: psm,
    tessedit_ocr_engine_mode: '1',
  });
  const { data } = await worker.recognize(dataUrl);
  await worker.terminate();
  const text = data.text || '';
  return { text, score: scoreText(text) };
}

/**
 * Scan a document image with OCR — tries multiple preprocessing variants
 * and Tesseract PSM modes, returns the highest-scoring text result.
 *
 * @param {File|Blob|string} imageFile
 * @returns {Promise<string>} best extracted text
 */
export async function scanDocumentWithOCR(imageFile) {
  // Get multiple preprocessing variants
  const variants = await preprocessImageForOCR(imageFile);

  let bestText  = '';
  let bestScore = 0;

  // PSM modes to try: 3=auto, 6=single block, 4=single column
  const psmModes = ['3', '6'];

  for (let vi = 0; vi < variants.length; vi++) {
    for (const psm of psmModes) {
      try {
        const { text, score } = await runTesseractOnUrl(variants[vi], psm);
        if (score > bestScore) {
          bestScore = score;
          bestText  = text;
        }
        // Early exit if we got a great result
        if (bestScore >= 150) break;
      } catch (err) {
        console.warn(`OCR variant ${vi+1} PSM=${psm} failed:`, err);
      }
    }
    if (bestScore >= 150) break;
  }

  return bestText;
}


// ─── Text cleaner ─────────────────────────────────────────────────────────────

/**
 * Strip OCR artifacts that are common on Indian ID scans:
 * - Pipe | chars from card borders
 * - Currency/symbol misreads (£ ¥ ©)
 * - Non-ASCII non-Devanagari chars
 */
function cleanText(raw) {
  return raw
    .replace(/\|/g, ' ')
    .replace(/[£¥€©®™°]/g, '')
    .replace(/[^\x00-\x7F\u0900-\u097F\n]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Returns true if a line has >45% alphanumeric content (not garbage) */
function isReadable(line) {
  if (!line || line.length < 2) return false;
  const an = (line.match(/[A-Za-z0-9]/g) || []).length;
  return an / line.length > 0.45;
}

/** Convert string to Title Case */
function titleCase(str) {
  return str
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// ─── Main parser ──────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'GOVERNMENT','INDIA','INCOME','TAX','DEPARTMENT','ELECTION',
  'COMMISSION','AADHAAR','UNIQUE','IDENTIFICATION','AUTHORITY',
  'BHARAT','REPUBLIC','FATHER','MOTHER','HUSBAND','SPOUSE',
  'ADDRESS','DATE','BIRTH','CARD','ISSUED','VALID','HELP',
  'VOTER','PASSPORT','DRIVING','LICENSE','LICENCE','ACCOUNT',
  'PERMANENT','NUMBER','SIGNATURE','CARDHOLDER','ENROLMENT',
  'FRONT','BACK','SCAN','UPLOAD','PHOTO','IMAGE','OPERATOR',
  'ROAD','STREET','NAGAR','COLONY','VILLAGE','MOHALLA',
  'DISTRICT','TEHSIL','MANDAL','STATE','HOUSE','FLAT',
  'NEAR','BEHIND','OPPOSITE','NEXT','ABOVE','BELOW','VIA',
  'POST','OFFICE','POLICE','STATION','WARD','SECTOR','BLOCK',
  'MALE','FEMALE','GENDER','OTHER','YEAR','MONTH','AGE',
  'THE','AND','FOR','WITH','FROM','THAT','THIS','YOUR',
]);

/**
 * Test if a string looks like a valid Indian person's name.
 * Must be: 2–5 words, each word ≥2 letters, letters-only, no stop words.
 */
function isValidName(str) {
  if (!str || str.length < 4 || str.length > 50) return false;
  // Must be purely alphabetic with spaces/dots
  if (!/^[A-Za-z][A-Za-z\s\.]{2,}[A-Za-z]$/.test(str)) return false;
  const words = str.split(/\s+/).filter((w) => w.length > 0);
  if (words.length < 2 || words.length > 5) return false;
  // Each word must be ≥2 chars
  if (words.some((w) => w.length < 2)) return false;
  // None of the words should be a stop word
  const upper = str.toUpperCase();
  for (const w of words) {
    if (STOP_WORDS.has(w.toUpperCase())) return false;
  }
  // Shouldn't have stop word phrases embedded
  if (STOP_WORDS.has(upper.trim())) return false;
  return true;
}

/**
 * Parse name, DOB, ID number, address from combined OCR text.
 * Handles Aadhaar, PAN, Voter ID, Passport, Driving License.
 */
export function parseIndianIDText(rawText) {
  if (!rawText) return {};

  const text = cleanText(rawText);

  // All lines and readable-only lines
  const allLines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const readableLines = allLines.filter(isReadable);

  // ── 1. Document type & ID Number ─────────────────────────────────────────

  let idType = 'Aadhaar Card';
  let idNumber = '';

  const panRx    = /\b([A-Z]{5}[0-9]{4}[A-Z])\b/;
  const voterRx  = /\b([A-Z]{3}[0-9]{7})\b/;
  const aadhRx   = /\b([2-9][0-9]{3}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4})\b/;
  const passRx   = /\b([A-PR-WYZ][1-9][0-9]{6}[0-9])\b/i;

  const panM  = text.match(panRx);
  const votM  = text.match(voterRx);
  const aadM  = text.match(aadhRx);
  const pasM  = text.match(passRx);

  if (panM)  { idType = 'PAN Card';   idNumber = panM[1]; }
  else if (votM) { idType = 'Voter ID';  idNumber = votM[1]; }
  else if (aadM) {
    idType = 'Aadhaar Card';
    idNumber = aadM[1].replace(/[\s\-]/g,'').replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
  } else if (pasM) { idType = 'Passport'; idNumber = pasM[1].toUpperCase(); }
  else {
    const digits = text.replace(/\D/g, '');
    const m = digits.match(/([2-9]\d{11})/);
    if (m) {
      idType = 'Aadhaar Card';
      idNumber = m[1].replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
    }
  }

  // Override type from keywords
  if (/ELECTION COMMISSION|VOTER ID|EPIC NO/i.test(text))          idType = 'Voter ID';
  else if (/INCOME TAX|PERMANENT ACCOUNT NUMBER/i.test(text))       idType = 'PAN Card';
  else if (/PASSPORT|REPUBLIC OF INDIA.*PASSPORT/is.test(text))     idType = 'Passport';
  else if (/AADHAAR|UIDAI|UNIQUE IDENTIFICATION/i.test(text))        idType = 'Aadhaar Card';
  else if (/DRIVING LICEN[SC]E|MOTOR VEHICLES/i.test(text))          idType = 'Driving License';

  // ── 2. DOB & Age ──────────────────────────────────────────────────────────

  let dob = '';
  let age = '';

  const dobFullRx = /\b(\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4})\b/;
  const yobRx     = /(?:Year of Birth|YOB|Date of Birth|DOB)[:\s\/\-]*(\d{4})/i;
  const curYear   = new Date().getFullYear();

  const dobM = text.match(dobFullRx);
  const yobM = text.match(yobRx);

  if (dobM) {
    dob = dobM[1].replace(/[.\-]/g, '/');
    const [, , yr] = dob.split('/');
    const y = +yr;
    if (y > 1900 && y <= curYear) age = String(curYear - y);
  } else if (yobM) {
    const y = +yobM[1];
    if (y > 1900 && y <= curYear) { dob = `01/01/${y}`; age = String(curYear - y); }
  }

  // ── 3. Gender ─────────────────────────────────────────────────────────────

  let gender = 'Male';
  if (/\b(?:FEMALE|Female|महिला|स्त्री)\b/.test(text))       gender = 'Female';
  else if (/\b(?:MALE|Male|पुरुष)\b/.test(text))             gender = 'Male';

  // ── 4. Name Extraction ────────────────────────────────────────────────────
  //
  // Strategy (in priority order):
  //  A. Explicit "Name:" label → next part of line or next line
  //  B. Positional: the English line just BEFORE the DOB line
  //     (On Aadhaar: layout is  [Name] → [DOB] → [Gender] → [ID])
  //  C. Scan all readable lines for a name-shaped string

  let name = '';

  // A. Explicit label
  const nameLabelRx = /(?:^|\n)\s*(?:Name|नाम|Naam)\s*[:\-]\s*([A-Za-z][A-Za-z\s\.]{3,45}?)(?:\n|$)/im;
  const nameLabelM  = text.match(nameLabelRx);
  if (nameLabelM) {
    const candidate = nameLabelM[1].trim();
    if (isValidName(candidate)) name = titleCase(candidate);
  }

  // B. Line before DOB (most reliable for Aadhaar)
  if (!name && dob) {
    // Find the line index that contains the DOB string
    const dobLineIdx = readableLines.findIndex((l) => l.includes(dob.split('/')[2]) && dobFullRx.test(l));
    if (dobLineIdx > 0) {
      // Check up to 3 lines before DOB
      for (let i = dobLineIdx - 1; i >= Math.max(0, dobLineIdx - 4); i--) {
        const line = readableLines[i];
        // Strip leading garbage / label prefix
        const cleaned = line
          .replace(/^(?:Name|नाम)\s*[:\-]\s*/i, '')
          .replace(/^[^A-Za-z]+/, '')
          .replace(/[^A-Za-z\s\.']/g, '')
          .trim();
        if (isValidName(cleaned)) {
          name = titleCase(cleaned);
          break;
        }
      }
    }
  }

  // C. Full scan fallback
  if (!name) {
    for (const line of readableLines) {
      const cleaned = line
        .replace(/^(?:Name|नाम)\s*[:\-]\s*/i, '')
        .replace(/^[^A-Za-z]+/, '')
        .replace(/[^A-Za-z\s\.']/g, '')
        .trim();
      if (isValidName(cleaned)) {
        name = titleCase(cleaned);
        break;
      }
    }
  }

  // ── 5. Address Extraction ────────────────────────────────────────────────

  // ── 5. Address Extraction ────────────────────────────────────────────────

  let address = '';
  const pinRx = /\b([1-9][0-9]{5})\b/;
  const pinM  = text.match(pinRx);

  const addrStartRx = /\b(?:Address|Adress|Addr|पत्ता|पता|आत्मज|पत्नी|मुलगा|मुलगी|पुत्र|पुत्री|S\/O|W\/O|D\/O|C\/O|S\/o|W\/o|D\/o|C\/o|Care of|Son of|Daughter of|Wife of|House|H\.?No\.?|H-No|Flat|Plot|Door|Bldg|Apartment|Room|Survey|Gat|Village|Vill\.|Post|P\.O\.|मु\.पो|मु\. पो|मुकाम|पोस्ट|तहसील|तालुका|जिल्हा|Dist|District|Ward|Block|Sector|Floor|Near|Beside|Opposite|Behind|Adjacent|Gali|Mohalla|Chowk|Street|Road|Lane|Nagar|Colony|Park|Marg|Layout|Vihar|Enclave)\b/i;
  const addrStopRx  = /\b(?:Date of Issue|Valid Upto|Signature|UIDAI Help|Toll Free|Email|www\.|http|Mobile|Phone|Tel|1947|help@|uidai\.gov)\b/i;
  const headerRx    = /\b(?:AADHAAR|GOVERNMENT OF INDIA|ELECTION COMMISSION|INCOME TAX DEPT|UNIQUE IDENTIFICATION|REPUBLIC OF INDIA|भारत सरकार)\b/i;

  const addrLines = [];
  let inAddr = false;

  for (const line of allLines) {
    if (!line || line.length < 3) continue;
    if (/---\s*(?:BACK|FRONT|DOCUMENT|SCAN)/i.test(line)) continue;
    if (headerRx.test(line)) continue;

    if (!inAddr && addrStartRx.test(line)) inAddr = true;
    if (!inAddr) continue;
    if (addrStopRx.test(line)) break;

    // Strip everything before Address: / Adress: label
    const lblM = line.match(/\b(?:Address|Adress|Addr|पत्ता|पता)\s*[:\-]\s*/i);
    let cl = lblM ? line.slice(lblM.index + lblM[0].length) : line;

    cl = cl
      .replace(/\|/g, ' ')
      .replace(/\b[2-9][0-9]{3}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cl || cl.length < 3 || !isReadable(cl)) continue;
    if (/^\d{1,4}$/.test(cl)) continue;

    addrLines.push(cl);
    if (pinM && cl.includes(pinM[1])) break;
    if (addrLines.length >= 6) break;
  }

  if (addrLines.length >= 2) {
    let rawAddr = addrLines.join(', ');
    rawAddr = rawAddr.replace(/---\s*(?:BACK|FRONT|DOCUMENT|SCAN)[^-\n]*---/gi, '');
    const lblM = rawAddr.match(/\b(?:Address|Adress|Addr|पत्ता|पता)\s*[:\-]\s*/i);
    if (lblM) rawAddr = rawAddr.slice(lblM.index + lblM[0].length);

    rawAddr = rawAddr
      .replace(/\b[2-9][0-9]{3}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}\b/g, '')
      .replace(/^(?:[a-zA-Z]{1,3}\s+)*[a-zA-Z]{1,2}\s*,\s*/g, '')
      .replace(/,\s*,/g, ',')
      .replace(/\s+/g, ' ')
      .trim();

    address = titleCase(rawAddr).replace(/\s*,\s*/g, ', ').replace(/(,\s*){2,}/g, ', ').replace(/[\s,\.\-]+$/, '');
  } else if (pinM) {
    // Grab up to 5 lines before pincode
    const pi = allLines.findIndex((l) => l.includes(pinM[1]));
    if (pi >= 0) {
      const candidates = [];
      for (let i = Math.max(0, pi - 4); i <= pi; i++) {
        const l = allLines[i];
        if (!l || l.length < 3 || /---\s*(?:BACK|FRONT|DOCUMENT|SCAN)/i.test(l) || headerRx.test(l) || addrStopRx.test(l)) continue;

        const lblM = l.match(/\b(?:Address|Adress|Addr|पत्ता|पता)\s*[:\-]\s*/i);
        let cl = lblM ? l.slice(lblM.index + lblM[0].length) : l;
        cl = cl.replace(/\|/g, ' ').replace(/\b[2-9][0-9]{3}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}\b/g, '').trim();

        if (cl.length >= 3 && !/^\d{4}\s*\d{4}\s*\d{4}$/.test(cl)) {
          candidates.push(cl);
        }
      }
      if (candidates.length > 0) {
        let rawAddr = candidates.join(', ')
          .replace(/^(?:[a-zA-Z]{1,3}\s+)*[a-zA-Z]{1,2}\s*,\s*/g, '')
          .replace(/,\s*,/g, ',')
          .replace(/\s+/g, ' ')
          .trim();
        address = titleCase(rawAddr).replace(/\s*,\s*/g, ', ').replace(/(,\s*){2,}/g, ', ').replace(/[\s,\.\-]+$/, '');
      }
    }
  }

  // ── 6. City & State ───────────────────────────────────────────────────────

  let city = '';
  // Try extracting from pincode line
  if (pinM) {
    const pinLine = allLines.find((l) => l.includes(pinM[1]));
    if (pinLine) {
      const cleanLine = pinLine.replace(new RegExp('[\\s\\-]*' + pinM[1] + '.*$'), '').replace(/[,\-\s]+$/, '').trim();
      const parts = cleanLine.split(',').map((p) => p.trim()).filter((p) => p.length > 2);
      if (parts.length >= 2) {
        city = `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
      } else if (parts.length === 1) {
        city = parts[0];
      }
    }
  }

  if (!city || city.length < 3) {
    const CITIES = /\b(Delhi|New Delhi|Mumbai|Bengaluru|Bangalore|Hyderabad|Chennai|Kolkata|Pune|Ahmedabad|Jaipur|Lucknow|Chandigarh|Indore|Bhopal|Surat|Nagpur|Patna|Gurugram|Gurgaon|Noida|Ghaziabad|Faridabad|Agra|Varanasi|Meerut|Kanpur|Nashik|Vizag|Visakhapatnam|Coimbatore|Madurai|Kochi|Bhubaneswar|Guwahati|Ranchi|Raipur|Vadodara|Rajkot|Amritsar|Ludhiana|Jodhpur|Udaipur|Prayagraj|Allahabad|Dehradun|Jammu|Srinagar|Mysuru|Mysore|Mangaluru|Hubli|Dharwad|Nellore|Guntur|Tirupati|Warangal|Bhilai|Durgapur|Asansol|Siliguri|Imphal|Shillong|Aizawl|Itanagar|Kohima|Agartala|Gangtok|Panaji|Silvassa|Daman|Wardha|Yavatmal|Chandrapur|Bhandara|Gondia|Akola|Amravati)\b/i;
    const cityM = text.match(CITIES);
    if (cityM) city = cityM[1];
  }

  return { idType, idNumber, name, dob, age, gender, address, city, pincode: pinM ? pinM[1] : '', rawText };
}
