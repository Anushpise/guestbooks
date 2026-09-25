/**
 * ocrUtils.js
 *
 * Uses Tesseract.js v7 with eng+hin (Hindi+English) language pack.
 * No AI API used. Pure browser-based OCR with smart Indian ID parsing.
 *
 * Hindi language support is KEY — without it, Hindi characters on Aadhaar
 * get misread as random ASCII garbage (like "a at El IN").
 * With hin+eng, Tesseract correctly segments Hindi vs English text.
 */

import { createWorker } from 'tesseract.js';

// ─── Image pre-processing ─────────────────────────────────────────────────────

/**
 * Sharpens + contrast-boosts an image before feeding to Tesseract.
 * Returns a data URL (PNG) with upscaled resolution for better OCR.
 */
export async function preprocessImageForOCR(imageFile) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const url =
      typeof imageFile === 'string' ? imageFile : URL.createObjectURL(imageFile);
    img.src = url;

    img.onload = () => {
      // Scale up to at least 1800px on the larger dimension
      const scale = Math.max(1, 1800 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Pass 1: grayscale + strong contrast
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const boosted = Math.min(255, Math.max(0, 1.8 * (g - 128) + 128));
        d[i] = d[i + 1] = d[i + 2] = boosted;
      }
      ctx.putImageData(imageData, 0, 0);

      // Pass 2: unsharp-mask style sharpening via a second draw
      ctx.globalAlpha = 0.85;
      ctx.drawImage(canvas, 0, 0);
      ctx.globalAlpha = 1.0;

      resolve(canvas.toDataURL('image/png', 1.0));
    };

    img.onerror = () => resolve(imageFile); // fallback: use original
  });
}

// ─── OCR runner ───────────────────────────────────────────────────────────────

/**
 * Run Tesseract OCR on one image file/blob.
 * Uses eng+hin so Hindi characters on Aadhaar/Voter ID are properly
 * recognized and separated from English text — eliminates garbage like
 * "a at El IN" that happens with eng-only mode.
 *
 * @param {File|Blob|string} imageFile
 * @returns {Promise<string>} raw extracted text
 */
export async function scanDocumentWithOCR(imageFile) {
  const processedUrl = await preprocessImageForOCR(imageFile);

  // eng+hin: English + Hindi bilingual mode
  // This downloads ~4MB of traineddata on first use (cached automatically)
  const worker = await createWorker(['eng', 'hin']);

  // PSM 3 = auto segmentation (best for mixed-layout cards)
  // OEM 1 = LSTM neural net only (better than legacy)
  await worker.setParameters({
    tessedit_pageseg_mode: '3',
    tessedit_ocr_engine_mode: '1',
  });

  const { data } = await worker.recognize(processedUrl);
  await worker.terminate();

  return data.text || '';
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

  let address = '';
  const pinRx = /\b([1-9][0-9]{5})\b/;
  const pinM  = text.match(pinRx);

  const addrStartRx = /\b(?:Address|पता|S\/O|W\/O|D\/O|C\/O|House|H\.?No\.?|H-No|Flat|Plot|Door|Village|Vill\.|Post|P\.O\.|Ward|Block|Sector|Floor|Near|Beside|Opposite|Gali|Mohalla|Chowk)\b/i;
  const addrStopRx  = /\b(?:Date of Issue|Valid Upto|Signature|UIDAI Help|Toll Free|Email|www\.|http|Mobile|Phone)\b/i;
  const headerRx    = /\b(?:AADHAAR|GOVERNMENT OF INDIA|ELECTION COMMISSION|INCOME TAX DEPT|UNIQUE IDENTIFICATION|REPUBLIC OF INDIA)\b/i;

  const addrLines = [];
  let inAddr = false;

  for (const line of allLines) {
    if (!line || line.length < 3) continue;
    if (!inAddr && addrStartRx.test(line)) inAddr = true;
    if (!inAddr) continue;
    if (addrStopRx.test(line)) break;
    if (headerRx.test(line)) continue;

    let cl = line
      .replace(/^(?:Address|पता)\s*[:\-]\s*/i, '')
      .replace(/\|/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cl || cl.length < 3 || !isReadable(cl)) continue;
    if (/^\d{1,3}$/.test(cl)) continue;

    addrLines.push(cl);
    if (pinM && cl.includes(pinM[1])) break;
    if (addrLines.length >= 5) break;
  }

  if (addrLines.length > 0) {
    address = addrLines.join(', ')
      .replace(/,\s*,/g, ',')
      .replace(/,\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim();
  } else if (pinM) {
    // Grab lines around pincode
    const pi = allLines.findIndex((l) => l.includes(pinM[1]));
    if (pi >= 0) {
      address = allLines
        .slice(Math.max(0, pi - 3), pi + 1)
        .filter(isReadable)
        .map((l) => l.replace(/\|/g, ' ').trim())
        .join(', ')
        .trim();
    }
  }

  // ── 6. City ───────────────────────────────────────────────────────────────

  let city = '';
  const CITIES = /\b(Delhi|New Delhi|Mumbai|Bengaluru|Bangalore|Hyderabad|Chennai|Kolkata|Pune|Ahmedabad|Jaipur|Lucknow|Chandigarh|Indore|Bhopal|Surat|Nagpur|Patna|Gurugram|Gurgaon|Noida|Ghaziabad|Faridabad|Agra|Varanasi|Meerut|Kanpur|Nashik|Vizag|Visakhapatnam|Coimbatore|Madurai|Kochi|Bhubaneswar|Guwahati|Ranchi|Raipur|Vadodara|Rajkot|Amritsar|Ludhiana|Jodhpur|Udaipur|Prayagraj|Allahabad|Dehradun|Jammu|Srinagar|Mysuru|Mysore|Mangaluru|Hubli|Dharwad|Nellore|Guntur|Tirupati|Warangal|Bhilai|Durgapur|Asansol|Siliguri|Imphal|Shillong|Aizawl|Itanagar|Kohima|Agartala|Gangtok|Panaji|Silvassa|Daman|Kavaratti|Port Blair)\b/i;
  const cityM = text.match(CITIES);
  if (cityM) city = cityM[1];

  return { idType, idNumber, name, dob, age, gender, address, city, rawText };
}
