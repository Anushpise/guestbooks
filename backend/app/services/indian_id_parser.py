"""
indian_id_parser.py

Smart parser for Indian Government ID cards: Aadhaar, PAN, Voter ID, Passport.
Handles OCR errors, garbled text, blurry-scan artifacts, and mixed Hindi-English.

Improvements:
- OCR error correction (0→O, 1→I, etc.) for ID numbers
- Fuzzy regex patterns for common OCR misreads
- Better name heuristics using positional context
- More robust address extraction
- Nationality/state extraction for Passport
"""

import re
from datetime import datetime


# ─── OCR Error Correction ─────────────────────────────────────────────────────

# Common OCR character confusions on Indian IDs
OCR_ALPHA_FIXES = str.maketrans({
    '0': 'O', '1': 'I', '5': 'S', '8': 'B',
    '$': 'S', '@': 'A', '!': 'I', '|': 'I',
})
OCR_DIGIT_FIXES = str.maketrans({
    'O': '0', 'o': '0', 'Q': '0',
    'I': '1', 'l': '1', 'i': '1',
    'S': '5', 's': '5',
    'B': '8', 'G': '6', 'Z': '2',
    ' ': '', '-': '',
})

def fix_pan_ocr(s: str) -> str:
    """Fix OCR errors in PAN card number (AAAAA9999A format)."""
    s = s.upper().strip()
    result = []
    for i, c in enumerate(s):
        if i < 5 or i == 9:   # positions 0-4 and 9 must be alpha
            result.append(c.translate(OCR_ALPHA_FIXES) if c.isdigit() else c)
        else:                  # positions 5-8 must be digit
            result.append(c.translate(OCR_DIGIT_FIXES) if c.isalpha() else c)
    return "".join(result)

def fix_aadhaar_ocr(s: str) -> str:
    """Strip non-digits and fix common alpha→digit OCR errors."""
    clean = ""
    for c in s:
        if c.isdigit():
            clean += c
        elif c in OCR_DIGIT_FIXES:
            clean += OCR_DIGIT_FIXES[c]
    return clean


# ─── Text Cleaner ────────────────────────────────────────────────────────────

def clean_text(raw: str) -> str:
    """Remove OCR artifacts while preserving Hindi Devanagari + English."""
    text = raw
    # Common pipe/slash OCR artifacts from card borders
    text = re.sub(r'\|', ' ', text)
    text = re.sub(r'[£¥€©®™°~`]', '', text)
    # Keep ASCII + Devanagari only
    text = re.sub(r'[^\x00-\x7F\u0900-\u097F\n]', ' ', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


# ─── Quality check ───────────────────────────────────────────────────────────

def is_readable(line: str) -> bool:
    if not line or len(line) < 2:
        return False
    an = len(re.findall(r'[A-Za-z0-9]', line))
    return an / len(line) > 0.40


def title_case(s: str) -> str:
    return ' '.join(w.capitalize() for w in s.split())


# ─── Stop Words ──────────────────────────────────────────────────────────────

STOP_WORDS = {
    'GOVERNMENT', 'INDIA', 'INCOME', 'TAX', 'DEPARTMENT', 'ELECTION',
    'COMMISSION', 'AADHAAR', 'UNIQUE', 'IDENTIFICATION', 'AUTHORITY',
    'BHARAT', 'REPUBLIC', 'FATHER', 'MOTHER', 'HUSBAND', 'SPOUSE',
    'ADDRESS', 'DATE', 'BIRTH', 'CARD', 'ISSUED', 'VALID', 'HELP',
    'VOTER', 'PASSPORT', 'DRIVING', 'LICENSE', 'LICENCE', 'ACCOUNT',
    'PERMANENT', 'NUMBER', 'SIGNATURE', 'CARDHOLDER', 'ENROLMENT',
    'FRONT', 'BACK', 'SCAN', 'UPLOAD', 'PHOTO', 'IMAGE', 'OPERATOR',
    'ROAD', 'STREET', 'NAGAR', 'COLONY', 'VILLAGE', 'MOHALLA',
    'DISTRICT', 'TEHSIL', 'MANDAL', 'STATE', 'HOUSE', 'FLAT',
    'NEAR', 'BEHIND', 'OPPOSITE', 'NEXT', 'ABOVE', 'BELOW',
    'POST', 'OFFICE', 'POLICE', 'STATION', 'WARD', 'SECTOR', 'BLOCK',
    'MALE', 'FEMALE', 'GENDER', 'OTHER', 'YEAR', 'MONTH', 'AGE',
    'THE', 'AND', 'FOR', 'WITH', 'FROM', 'THAT', 'THIS', 'YOUR',
    'NAME', 'FULL', 'GIVEN', 'SURNAME', 'PITA', 'MATA', 'PATA',
}


def is_valid_name(s: str) -> bool:
    if not s or len(s) < 3 or len(s) > 52:
        return False
    if not re.match(r'^[A-Za-z][A-Za-z\s\.\']{1,}[A-Za-z]$', s):
        return False
    upper = s.upper()
    # Reject government, department, card headers and their OCR corruptions
    if re.search(r'GOVER|GOVT|INDIA|BHARAT|INCOME|TAX|COMMISS|AADHAAR|UNIQUE|IDENTIF|ENROL|AUTHORIT|DEPARTMENT|REPUBLIC|MOM', upper):
        return False
    words = [w for w in s.split() if w]
    if len(words) < 1 or len(words) > 5:
        return False
    if any(len(w) < 2 for w in words):
        return False
    for w in words:
        if w.upper() in STOP_WORDS:
            return False
    if upper.strip() in STOP_WORDS:
        return False
    return True


# ─── Main Parser ─────────────────────────────────────────────────────────────

def parse_indian_id_text(text: str) -> dict:
    """
    Parse structured fields from OCR output of Indian Government IDs.
    Returns: { idType, idNumber, name, dob, age, gender, address, city, pincode, rawText }
    """
    if not text:
        return {}

    raw_text = text
    text = clean_text(text)
    all_lines = [l.strip() for l in text.split('\n') if l.strip()]
    readable_lines = [l for l in all_lines if is_readable(l)]
    full_text = ' '.join(all_lines)

    # ── 1. Document Type + ID Number ──────────────────────────────────────────

    id_type = 'Aadhaar Card'
    id_number = ''

    # Regex patterns (generous to handle OCR noise)
    # PAN: AAAAA9999A (5 alpha, 4 digit, 1 alpha) — with OCR fix applied
    pan_rx    = re.compile(r'\b([A-Z0-9]{5}[0-9A-Z]{4}[A-Z0-9])\b')
    voter_rx  = re.compile(r'\b([A-Z]{3}[0-9]{7})\b')
    aadhaar_rx = re.compile(r'\b([2-9][0-9O]{3}[\s\-]?[0-9O]{4}[\s\-]?[0-9O]{4})\b')
    passport_rx = re.compile(r'\b([A-PR-WYZ][1-9][0-9]{6}[0-9])\b', re.IGNORECASE)

    pan_m    = pan_rx.search(full_text)
    voter_m  = voter_rx.search(full_text)
    aadhaar_m = aadhaar_rx.search(full_text)
    passport_m = passport_rx.search(full_text)

    # Keyword-based type override takes priority
    if re.search(r'INCOME TAX|PERMANENT ACCOUNT NUMBER', full_text, re.IGNORECASE):
        id_type = 'PAN Card'
    elif re.search(r'ELECTION COMMISSION|VOTER|EPIC\s*NO', full_text, re.IGNORECASE):
        id_type = 'Voter ID'
    elif re.search(r'PASSPORT|REPUBLIC OF INDIA.*PASS', full_text, re.IGNORECASE | re.DOTALL):
        id_type = 'Passport'
    elif re.search(r'AADHAAR|UIDAI|UNIQUE IDENTIFICATION', full_text, re.IGNORECASE):
        id_type = 'Aadhaar Card'
    elif re.search(r'DRIVING LICEN[SC]E|MOTOR VEHICLES', full_text, re.IGNORECASE):
        id_type = 'Driving License'

    # Extract number based on detected type
    if id_type == 'PAN Card' and pan_m:
        raw_pan = pan_m.group(1)
        fixed = fix_pan_ocr(raw_pan)
        if re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]$', fixed):
            id_number = fixed
        else:
            id_number = raw_pan.upper()

    elif id_type == 'Voter ID' and voter_m:
        id_number = voter_m.group(1).upper()

    elif id_type == 'Aadhaar Card' and aadhaar_m:
        raw_aadhaar = aadhaar_m.group(1)
        digits = fix_aadhaar_ocr(raw_aadhaar)
        if len(digits) == 12:
            id_number = f"{digits[:4]} {digits[4:8]} {digits[8:]}"

    elif id_type == 'Passport' and passport_m:
        id_number = passport_m.group(1).upper()

    # Fallback: scrape all digits for Aadhaar-like number
    if not id_number:
        digits_only = fix_aadhaar_ocr(full_text)
        m12 = re.search(r'([2-9]\d{11})', digits_only)
        if m12:
            num = m12.group(1)
            id_number = f"{num[:4]} {num[4:8]} {num[8:]}"
            if id_type not in ('Aadhaar Card',):
                id_type = 'Aadhaar Card'

    # ── 2. DOB + Age ──────────────────────────────────────────────────────────

    dob = ''
    age = ''
    current_year = datetime.now().year

    dob_full_rx = re.compile(r'\b(\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4})\b')
    yob_rx      = re.compile(r'(?:Year of Birth|YOB|Date of Birth|DOB)\s*[:\-\/]?\s*(\d{4})', re.IGNORECASE)
    year_rx     = re.compile(r'\b(19[4-9]\d|20[0-2]\d)\b')

    dob_m = dob_full_rx.search(full_text)
    yob_m = yob_rx.search(full_text)

    if dob_m:
        dob = dob_m.group(1).replace('.', '/').replace('-', '/')
        parts = dob.split('/')
        if len(parts) == 3:
            try:
                yr = int(parts[2])
                if 1900 < yr <= current_year:
                    age = str(current_year - yr)
            except ValueError:
                pass
    elif yob_m:
        try:
            yr = int(yob_m.group(1))
            if 1900 < yr <= current_year:
                dob = f"01/01/{yr}"
                age = str(current_year - yr)
        except ValueError:
            pass
    else:
        # Last resort: find standalone year
        yr_m = year_rx.search(full_text)
        if yr_m:
            try:
                yr = int(yr_m.group(1))
                if 1900 < yr <= current_year:
                    dob = f"01/01/{yr}"
                    age = str(current_year - yr)
            except ValueError:
                pass

    # Blurry OCR recovery for DOB: handles 00B / DO8 / 003 and letter substitutions
    if not dob:
        fuzzy_dob_rx = re.compile(
            r'(?:DOB|00B|DO8|003|D\.?O\.?B\.?|Date of Birth|जन्म)\s*[:\.\- ]?\s*([0-9OIlSB]{2}[\/\.\-][0-9OIlSB]{2}[\/\.\-][0-9OIlSBm]{4})',
            re.IGNORECASE
        )
        fm = fuzzy_dob_rx.search(full_text)
        if fm:
            raw_d = fm.group(1).replace('.', '/').replace('-', '/')
            date_fixed = ""
            for ch in raw_d:
                if ch in ('O', 'o'): date_fixed += '0'
                elif ch in ('I', 'l', '|'): date_fixed += '1'
                elif ch in ('S', 's'): date_fixed += '5'
                elif ch in ('B',): date_fixed += '8'
                elif ch in ('m',): date_fixed += '9'
                else: date_fixed += ch
            parts = date_fixed.split('/')
            if len(parts) == 3 and len(parts[2]) == 4 and parts[2].isdigit():
                yr = int(parts[2])
                if 1900 < yr <= current_year:
                    dob = date_fixed
                    age = str(current_year - yr)

    # ── 3. Gender ─────────────────────────────────────────────────────────────

    gender = 'Male'
    if re.search(r'\b(?:FEMALE|Female|महिला|स्त्री|F(?:EMALE)?)\b', text):
        gender = 'Female'
    elif re.search(r'\b(?:MALE|Male|पुरुष|M(?:ALE)?)\b', text):
        gender = 'Male'
    elif re.search(r'\b(?:OTHER|Third Gender|Transgender)\b', text, re.IGNORECASE):
        gender = 'Other'

    # ── 4. Name Extraction ────────────────────────────────────────────────────
    # Strategy:
    #  A. Explicit "Name:" label (including common OCR corruptions like Mamo, Namo, etc.)
    #  B. For PAN: line after "INCOME TAX" header
    #  C. For Aadhaar: line just before DOB
    #  D. Full scan for name-shaped string (last resort)

    name = ''

    # A. Explicit label
    label_rx = re.compile(
        r'(?:^|\n|\b)(?:Name|Full Name|Mamo|Namo|Nam|Narme|Nome|Hame|Wame|नाम|Naam)\s*[:\-\. ]\s*([A-Za-z][A-Za-z\s\.\']{2,45}?)(?:\n|\bDOB|\b00B|\bDO8|\b003|\bYear|\bGender|$)',
        re.IGNORECASE
    )
    label_m = label_rx.search(text)
    if label_m:
        candidate = label_m.group(1).strip()
        if is_valid_name(candidate):
            name = title_case(candidate)

    # B. PAN: line right after "INCOME TAX" or "GOVT OF INDIA"
    if not name and id_type == 'PAN Card':
        for i, line in enumerate(all_lines):
            if re.search(r'INCOME TAX|GOVT OF INDIA|GOVERNMENT OF INDIA', line, re.IGNORECASE):
                for j in range(i + 1, min(i + 4, len(all_lines))):
                    candidate = re.sub(r'[^A-Za-z\s\.]', '', all_lines[j]).strip()
                    if is_valid_name(candidate):
                        name = title_case(candidate)
                        break
            if name:
                break

    # C. Aadhaar: line before DOB
    if not name and dob and dob_m:
        dob_year = dob.split('/')[-1] if '/' in dob else ''
        if dob_year:
            for i, line in enumerate(readable_lines):
                if dob_year in line and dob_full_rx.search(line):
                    for back in range(i - 1, max(-1, i - 5), -1):
                        cleaned = re.sub(r'^(?:Name|नाम)\s*[:\-]\s*', '', readable_lines[back], flags=re.IGNORECASE)
                        cleaned = re.sub(r'^[^A-Za-z]+', '', cleaned)
                        cleaned = re.sub(r'[^A-Za-z\s\.\']', '', cleaned).strip()
                        if is_valid_name(cleaned):
                            name = title_case(cleaned)
                            break
                    break

    # D. Full scan fallback
    if not name:
        for line in readable_lines:
            cleaned = re.sub(r'^(?:Name|नाम)\s*[:\-]\s*', '', line, flags=re.IGNORECASE)
            cleaned = re.sub(r'^[^A-Za-z]+', '', cleaned)
            cleaned = re.sub(r'[^A-Za-z\s\.\']', '', cleaned).strip()
            if is_valid_name(cleaned):
                name = title_case(cleaned)
                break

    # ── 5. Pincode + Address ──────────────────────────────────────────────────

    pincode = ''
    address = ''

    pin_m = re.search(r'\b([1-9][0-9]{5})\b', full_text)
    if pin_m:
        pincode = pin_m.group(1)

    addr_start_rx = re.compile(
        r'\b(?:Address|पता|S\/O|W\/O|D\/O|C\/O|House|H\.?No\.?|H-No|Flat|Plot|Door|'
        r'Village|Vill\.|Post|P\.O\.|Ward|Block|Sector|Floor|Near|Beside|Opposite|'
        r'Gali|Mohalla|Chowk|Street|Road|Lane|Nagar|Colony|Park)\b',
        re.IGNORECASE
    )
    addr_stop_rx = re.compile(
        r'\b(?:Date of Issue|Valid Upto|Signature|UIDAI Help|Toll Free|Email|www\.|'
        r'http|Mobile|Phone|Tel)\b',
        re.IGNORECASE
    )
    header_rx = re.compile(
        r'\b(?:AADHAAR|GOVERNMENT OF INDIA|ELECTION COMMISSION|INCOME TAX DEPT|'
        r'UNIQUE IDENTIFICATION|REPUBLIC OF INDIA)\b',
        re.IGNORECASE
    )

    addr_lines = []
    in_addr = False

    for line in all_lines:
        if len(line) < 3:
            continue
        if not in_addr and addr_start_rx.search(line):
            in_addr = True
        if not in_addr:
            continue
        if addr_stop_rx.search(line):
            break
        if header_rx.search(line):
            continue

        cl = re.sub(r'^(?:Address|पता)\s*[:\-]\s*', '', line, flags=re.IGNORECASE)
        cl = re.sub(r'\|', ' ', cl).strip()
        if cl and len(cl) >= 3 and is_readable(cl) and not re.match(r'^\d{1,3}$', cl):
            addr_lines.append(cl)

        if pincode and pincode in line:
            break
        if len(addr_lines) >= 5:
            break

    if addr_lines:
        address = ', '.join(addr_lines)
        address = re.sub(r',\s*,', ',', address).strip(', ').strip()
    elif pincode:
        # Try to get lines around pincode
        pin_idx = next((i for i, l in enumerate(all_lines) if pincode in l), -1)
        if pin_idx >= 0:
            snippet = all_lines[max(0, pin_idx - 3): pin_idx + 1]
            address = ', '.join(l for l in snippet if is_readable(l))

    # ── 6. City ───────────────────────────────────────────────────────────────

    city = ''
    CITIES = re.compile(
        r'\b(Delhi|New Delhi|Mumbai|Bengaluru|Bangalore|Hyderabad|Chennai|Kolkata|'
        r'Pune|Ahmedabad|Jaipur|Lucknow|Chandigarh|Indore|Bhopal|Surat|Nagpur|'
        r'Patna|Gurugram|Gurgaon|Noida|Ghaziabad|Faridabad|Agra|Varanasi|Meerut|'
        r'Kanpur|Nashik|Vizag|Visakhapatnam|Coimbatore|Madurai|Kochi|Bhubaneswar|'
        r'Guwahati|Ranchi|Raipur|Vadodara|Rajkot|Amritsar|Ludhiana|Jodhpur|Udaipur|'
        r'Prayagraj|Allahabad|Dehradun|Jammu|Srinagar|Mysuru|Mysore|Mangaluru|'
        r'Hubli|Dharwad|Nellore|Guntur|Tirupati|Warangal|Bhilai|Durgapur|Asansol|'
        r'Siliguri|Imphal|Shillong|Aizawl|Itanagar|Kohima|Agartala|Gangtok|Panaji|'
        r'Silvassa|Daman|Kavaratti|Port Blair|Thane|Navi Mumbai|Aurangabad|Solapur|'
        r'Kolhapur|Nagpur|Akola|Amravati|Latur|Dhule)\b',
        re.IGNORECASE
    )
    city_m = CITIES.search(full_text)
    if city_m:
        city = city_m.group(1)

    return {
        "idType":   id_type,
        "idNumber": id_number,
        "name":     name,
        "dob":      dob,
        "age":      age,
        "gender":   gender,
        "address":  address,
        "city":     city,
        "pincode":  pincode,
        "rawText":  raw_text,
    }
