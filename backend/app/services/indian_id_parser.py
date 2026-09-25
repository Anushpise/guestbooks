"""
indian_id_parser.py

State-of-the-Art Structured Parser for Indian Government Identity Documents.
Accurately extracts:
- Document Type (Aadhaar, PAN, Voter ID, Passport, Driving License)
- ID Number (Normalized with OCR character confusion repair)
- Guest Name (Multi-strategy layout-aware & spatial heuristic extraction)
- Date of Birth & Calculated Age
- Gender (Male, Female, Other, Hindi bilingual)
- Permanent Address & Pincode
- City
"""

import re
from datetime import datetime
import logging

logger = logging.getLogger("indian_id_parser")

# OCR Digit vs Character Confusions
OCR_DIGIT_FIXES = {
    'O': '0', 'o': '0', 'D': '0', 'Q': '0',
    'I': '1', 'l': '1', '|': '1', '!': '1', 'i': '1',
    'Z': '2', 'z': '2',
    'E': '3',
    'A': '4',
    'S': '5', 's': '5',
    'G': '6', 'b': '6',
    'T': '7',
    'B': '8',
    'g': '9', 'q': '9', 'm': '9',
}

OCR_LETTER_FIXES = {
    '0': 'O',
    '1': 'I',
    '2': 'Z',
    '5': 'S',
    '8': 'B',
}

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
    'ELECTOR', 'ELECTORS', 'MERA', 'ENROLLMENT', 'UNION', 'MOTOR',
    'VEHICLES', 'DETAILS', 'FORM', 'ISSUE', 'EXPIRY', 'HOLDERS',
    'GOVT', 'OF', 'STATE', 'AUTHORITY', 'DIRECTORATE', 'REPUBLIC',
    'MOM', 'VERIFICATION', 'VID', 'HELP', 'TOLL', 'FREE', 'WWW',
}


def title_case(s: str) -> str:
    return ' '.join(w.capitalize() for w in s.split())


def clean_text(raw: str) -> str:
    """Standardizes text, cleans non-alphanumeric noise while retaining Devanagari."""
    text = raw
    text = re.sub(r'\|', ' ', text)
    text = re.sub(r'[£¥€©®™°~`_"]', '', text)
    text = re.sub(r'[^\x00-\x7F\u0900-\u097F\n]', ' ', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def is_valid_name(s: str) -> bool:
    """Validates if a candidate line is a genuine human name."""
    if not s or len(s) < 3 or len(s) > 42:
        return False
    # Only letters, spaces, dots, apostrophes
    if not re.match(r'^[A-Za-z][A-Za-z\s\.\']{1,}[A-Za-z]$', s):
        return False
    upper = s.upper()
    # Reject strings with government / card / department keywords
    if re.search(r'GOVER|GOVT|INDIA|BHARAT|INCOME|TAX|COMMISS|AADHAAR|UNIQUE|IDENTIF|ENROL|AUTHORIT|DEPARTMENT|REPUBLIC|PERMANENT|ACCOUNT|SIGNATURE', upper):
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


# ─── ID Number Fixers ─────────────────────────────────────────────────────────

def fix_pan_ocr(candidate: str) -> str:
    """Repairs OCR character confusions in a 10-character PAN candidate."""
    if len(candidate) != 10:
        return candidate
    letters_part = ""
    for ch in candidate[:5]:
        letters_part += OCR_LETTER_FIXES.get(ch, ch)
    digits_part = ""
    for ch in candidate[5:9]:
        digits_part += OCR_DIGIT_FIXES.get(ch, ch)
    last_ch = OCR_LETTER_FIXES.get(candidate[9], candidate[9])
    fixed = f"{letters_part}{digits_part}{last_ch}".upper()
    return fixed


def fix_aadhaar_ocr(s: str) -> str:
    clean = ""
    for c in s:
        if c.isdigit():
            clean += c
        elif c in OCR_DIGIT_FIXES:
            clean += OCR_DIGIT_FIXES[c]
    return clean


# ─── Name Extraction Strategies ───────────────────────────────────────────────

def extract_name(lines: list[str], id_type: str, full_text: str, dob: str) -> str:
    """
    Multi-strategy Name Extraction based on physical layout of Indian IDs.
    """
    # Strategy 1: Passport MRZ (Machine Readable Zone - 100% ground truth)
    mrz_m = re.search(r'P<([A-Z]{3})([A-Z<]+)', full_text)
    if mrz_m:
        raw = mrz_m.group(2)
        parts = raw.split('<<')
        surname = parts[0].replace('<', ' ').strip().title()
        given = parts[1].replace('<', ' ').strip().title() if len(parts) > 1 else ''
        name_cand = f"{given} {surname}".strip()
        if name_cand:
            return name_cand

    # Strategy 2: Explicit Label Detection (Same-line and Next-line)
    for i, line in enumerate(lines):
        # Exclude lines that are father/mother/husband relative labels
        if re.search(r'Father|Mother|Husband|Spouse|Pita|Mata|S\/O|D\/O|W\/O|C\/O|Son of|Wife of', line, re.I):
            continue

        # 2A: Same-line (e.g., "Name: Rahul Sharma" or "Elector's Name : Rahul Sharma")
        m_same = re.search(
            r'(?:^|\b)(?:Name|Full Name|Elector\'?s?\s*Name|Cardholder(?:\'s)?\s*Name|नाम|Naam)\s*[:\-\.]\s*([A-Za-z][A-Za-z\s\.\']{2,40})',
            line, re.I
        )
        if m_same:
            cand = m_same.group(1).strip()
            if is_valid_name(cand):
                return title_case(cand)

        # 2B: Next-line (e.g., Line i = "Name", Line i+1 = "RAHUL SHARMA")
        if re.match(r'^(?:Name|Full Name|Elector\'?s?\s*Name|Cardholder(?:\'s)?\s*Name|नाम|Naam)\s*[:\-]?$', line.strip(), re.I):
            if i + 1 < len(lines):
                cand = lines[i + 1].strip()
                # Verify line i+1 is not another label
                if is_valid_name(cand) and not re.search(r'Father|Mother|DOB|Birth|Gender|India|Tax', cand, re.I):
                    return title_case(cand)

    # Strategy 3: PAN Card Layout (Classic without labels)
    # Header -> Guest Name -> Father's Name -> DOB -> PAN No
    if id_type == 'PAN Card':
        candidates = []
        for line in lines:
            cl = re.sub(r'[^A-Za-z\s\.]', '', line).strip()
            if is_valid_name(cl):
                candidates.append(title_case(cl))
        if candidates:
            return candidates[0]  # First name is cardholder, second is father

    # Strategy 4: Aadhaar Card Layout (Line preceding DOB)
    # Almost all Aadhaar cards place the cardholder's English name directly above DOB
    dob_idx = -1
    for i, line in enumerate(lines):
        if re.search(r'(?:DOB|Date of Birth|Year of Birth|YOB|जन्म)\b', line, re.I) or re.search(r'\b\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4}\b', line):
            dob_idx = i
            break
        if dob and dob in line:
            dob_idx = i
            break

    if dob_idx > 0:
        # Check backwards up to 3 lines
        for back in range(dob_idx - 1, max(-1, dob_idx - 4), -1):
            cl = re.sub(r'^(?:Name|नाम)\s*[:\-]?\s*', '', lines[back], flags=re.I).strip()
            cl = re.sub(r'[^A-Za-z\s\.]', '', cl).strip()
            if is_valid_name(cl):
                return title_case(cl)

    # Strategy 5: e-Aadhaar "To" or "Enrollment" line
    for i, line in enumerate(lines):
        if re.match(r'^(?:To|Enrollment\s*No\.?)\s*[:\-]?$', line, re.I) or re.search(r'\bTo\b', line):
            if i + 1 < len(lines):
                cl = re.sub(r'[^A-Za-z\s\.]', '', lines[i + 1]).strip()
                if is_valid_name(cl):
                    return title_case(cl)

    # Strategy 6: General Fallback (First valid name-like line)
    for line in lines:
        cl = re.sub(r'^(?:Name|नाम)\s*[:\-]?\s*', '', line, flags=re.I).strip()
        cl = re.sub(r'[^A-Za-z\s\.]', '', cl).strip()
        if is_valid_name(cl):
            return title_case(cl)

    return ''


# ─── Main Parser ─────────────────────────────────────────────────────────────

def parse_indian_id_text(text: str) -> dict:
    """
    Main parser entry point.
    Returns: { idType, idNumber, name, dob, age, gender, address, city, pincode, rawText }
    """
    if not text:
        return {}

    raw_text = text
    text = clean_text(text)
    all_lines = [l.strip() for l in text.split('\n') if l.strip()]
    full_text = ' '.join(all_lines)

    # ── 1. Document Type Detection ────────────────────────────────────────────

    id_type = 'Aadhaar Card'

    if re.search(r'INCOME TAX|PERMANENT ACCOUNT NUMBER|\bPAN\s*CARD\b', full_text, re.I):
        id_type = 'PAN Card'
    elif re.search(r'ELECTION COMMISSION|ELECTOR|\bEPIC\s*NO\b|\bVOTER\b', full_text, re.I):
        id_type = 'Voter ID'
    elif re.search(r'PASSPORT|REPUBLIC OF INDIA.*PASS|P<IND', full_text, re.I | re.DOTALL):
        id_type = 'Passport'
    elif re.search(r'DRIVING LICEN[SC]E|MOTOR VEHICLES|UNION OF INDIA.*DL', full_text, re.I):
        id_type = 'Driving License'
    elif re.search(r'AADHAAR|UIDAI|UNIQUE IDENTIFICATION', full_text, re.I):
        id_type = 'Aadhaar Card'

    # ── 2. ID Number Extraction ───────────────────────────────────────────────

    id_number = ''

    # Strict PAN: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F)
    pan_strict_rx = re.compile(r'\b([A-Z]{5}[0-9]{4}[A-Z])\b')
    pan_fuzzy_rx  = re.compile(r'\b([A-Z]{5}[0-9OIlSB]{4}[A-Z])\b')
    aadhaar_rx    = re.compile(r'\b([2-9][0-9OIl]{3}[\s\-]?[0-9OIl]{4}[\s\-]?[0-9OIl]{4})\b')
    voter_rx      = re.compile(r'\b([A-Z]{3}[0-9OIl]{7})\b')
    passport_rx   = re.compile(r'\b([A-PR-WYZ][1-9][0-9]{6}[0-9]?)\b', re.I)
    dl_rx         = re.compile(r'\b([A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{4}[-\s]?[0-9]{7})\b')

    # A. PAN Card
    if id_type == 'PAN Card':
        m_pan = pan_strict_rx.search(full_text) or pan_fuzzy_rx.search(full_text)
        if m_pan:
            id_number = fix_pan_ocr(m_pan.group(1))

    # B. Voter ID
    elif id_type == 'Voter ID':
        m_voter = voter_rx.search(full_text)
        if m_voter:
            id_number = m_voter.group(1).upper()

    # C. Passport
    elif id_type == 'Passport':
        # Check MRZ line 2 for passport number
        mrz_no = re.search(r'\b([A-PR-WYZ][0-9]{7})<', full_text)
        if mrz_no:
            id_number = mrz_no.group(1).upper()
        else:
            m_pass = passport_rx.search(full_text)
            if m_pass:
                id_number = m_pass.group(1).upper()

    # D. Driving License
    elif id_type == 'Driving License':
        m_dl = dl_rx.search(full_text)
        if m_dl:
            id_number = m_dl.group(1).upper()

    # E. Aadhaar Card
    elif id_type == 'Aadhaar Card':
        m_aadh = aadhaar_rx.search(full_text)
        if m_aadh:
            digits = fix_aadhaar_ocr(m_aadh.group(1))
            if len(digits) == 12:
                id_number = f"{digits[:4]} {digits[4:8]} {digits[8:]}"

    # Global Fallbacks if ID number wasn't matched above
    if not id_number:
        # Check PAN pattern
        m_pan = pan_strict_rx.search(full_text)
        if m_pan:
            id_number = m_pan.group(1)
            id_type = 'PAN Card'
        else:
            # Check Aadhaar pattern
            m_aadh = aadhaar_rx.search(full_text)
            if m_aadh:
                digits = fix_aadhaar_ocr(m_aadh.group(1))
                if len(digits) == 12:
                    id_number = f"{digits[:4]} {digits[4:8]} {digits[8:]}"
                    id_type = 'Aadhaar Card'

    # ── 3. Date of Birth & Age ────────────────────────────────────────────────

    dob = ''
    age = ''
    current_year = datetime.now().year

    # Check Passport MRZ DOB (format: YYMMDD)
    mrz_dob = re.search(r'([0-9]{2})(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[0-9][MF]', full_text)
    if mrz_dob:
        yy, mm, dd = int(mrz_dob.group(1)), mrz_dob.group(2), mrz_dob.group(3)
        full_yr = 1900 + yy if yy > (current_year % 100) else 2000 + yy
        dob = f"{dd}/{mm}/{full_yr}"
        age = str(current_year - full_yr)

    if not dob:
        dob_full_rx = re.compile(r'\b(\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4})\b')
        dob_m = dob_full_rx.search(full_text)
        if dob_m:
            dob = dob_m.group(1).replace('.', '/').replace('-', '/')
            parts = dob.split('/')
            if len(parts) == 3 and parts[2].isdigit():
                yr = int(parts[2])
                if 1900 < yr <= current_year:
                    age = str(current_year - yr)

    if not dob:
        # Fuzzy DOB recovery for blurry text
        fuzzy_dob = re.search(
            r'(?:DOB|00B|DO8|003|D\.?O\.?B\.?|Date of Birth|जन्म)\s*[:\.\- ]?\s*([0-9OIlSB]{2}[\/\.\-][0-9OIlSB]{2}[\/\.\-][0-9OIlSBm]{4})',
            full_text, re.I
        )
        if fuzzy_dob:
            raw_d = fuzzy_dob.group(1).replace('.', '/').replace('-', '/')
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

    if not dob:
        # Year of Birth fallback
        yob_m = re.search(r'(?:Year of Birth|YOB)\s*[:\-\/]?\s*(\d{4})', full_text, re.I)
        if yob_m:
            yr = int(yob_m.group(1))
            if 1900 < yr <= current_year:
                dob = f"01/01/{yr}"
                age = str(current_year - yr)

    # ── 4. Gender ─────────────────────────────────────────────────────────────

    gender = 'Male'
    if re.search(r'\b(?:FEMALE|Female|महिला|स्त्री|F(?:EMALE)?)\b', full_text):
        gender = 'Female'
    elif re.search(r'\b(?:MALE|Male|पुरुष|M(?:ALE)?)\b', full_text):
        gender = 'Male'
    elif re.search(r'\b(?:OTHER|Third Gender|Transgender)\b', full_text, re.I):
        gender = 'Other'

    # ── 5. Name Extraction ────────────────────────────────────────────────────

    name = extract_name(all_lines, id_type, full_text, dob)

    # ── 6. Address & Pincode ──────────────────────────────────────────────────

    pincode = ''
    address = ''

    pin_m = re.search(r'\b([1-9][0-9]{5})\b', full_text)
    if pin_m:
        pincode = pin_m.group(1)

    addr_start_rx = re.compile(
        r'\b(?:Address|पत्ता|पता|आत्मज|पत्नी|मुलगा|मुलगी|पुत्र|पुत्री|'
        r'S\/O|W\/O|D\/O|C\/O|S\/o|W\/o|D\/o|C\/o|Care of|Son of|Daughter of|Wife of|'
        r'House|H\.?No\.?|H-No|Flat|Plot|Door|Bldg|Apartment|Room|Survey|Gat|'
        r'Village|Vill\.|Post|P\.O\.|मु\.पो|मु\. पो|मुकाम|पोस्ट|तहसील|तालुका|जिल्हा|'
        r'Dist|District|Ward|Block|Sector|Floor|Near|Beside|Opposite|Behind|Adjacent|'
        r'Gali|Mohalla|Chowk|Street|Road|Lane|Nagar|Colony|Park|Marg|Layout|Vihar|Enclave)\b',
        re.I
    )
    addr_stop_rx = re.compile(
        r'\b(?:Date of Issue|Valid Upto|Signature|UIDAI Help|Toll Free|Email|www\.|'
        r'http|Mobile|Phone|Tel|1947|help@|uidai\.gov)\b',
        re.I
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

        cl = re.sub(r'^(?:Address|पत्ता|पता)\s*[:\-]\s*', '', line, flags=re.I)
        cl = re.sub(r'\|', ' ', cl).strip()
        if cl and len(cl) >= 3 and not re.match(r'^\d{1,4}$', cl):
            addr_lines.append(cl)

        if pincode and pincode in line:
            break
        if len(addr_lines) >= 6:
            break

    # If forward scan yielded nothing or only 1 short line, use backward scan from pincode line
    if len(addr_lines) < 2 and pincode:
        pin_idx = -1
        for i, l in enumerate(all_lines):
            if pincode in l:
                pin_idx = i
                break
        if pin_idx >= 0:
            collected = []
            for i in range(max(0, pin_idx - 5), pin_idx + 1):
                l = all_lines[i].strip()
                if not l or len(l) < 3:
                    continue
                # Skip pure number lines / IDs / noise
                if re.match(r'^\d{4}\s*\d{4}\s*\d{4}$', l) or re.match(r'^\d{1,4}$', l):
                    continue
                if addr_stop_rx.search(l):
                    continue
                if any(k in l.lower() for k in ['unique identification', 'authority of india', 'help@', '1947', 'government of india', 'भारत सरकार']):
                    continue
                cl = re.sub(r'^(?:Address|पत्ता|पता)\s*[:\-]\s*', '', l, flags=re.I)
                cl = re.sub(r'\|', ' ', cl).strip()
                if cl and len(cl) >= 3:
                    collected.append(cl)
            if collected:
                addr_lines = collected

    if addr_lines:
        address = ', '.join(addr_lines)
        address = re.sub(r',\s*,', ',', address).strip(', ').strip()
    elif pincode:
        address = f"PIN Code: {pincode}"

    # ── 7. City & State ───────────────────────────────────────────────────────

    city = ''
    # A. Try extracting from pincode line (e.g., "Wardha, Maharashtra - 442001" or "Nalwadi, Wardha, Maharashtra 442001")
    if pincode:
        for l in all_lines:
            if pincode in l:
                clean_l = re.sub(r'[\s\-]*' + pincode + r'.*$', '', l).strip(' ,-')
                parts = [p.strip() for p in clean_l.split(',') if p.strip() and len(p.strip()) > 2]
                if parts:
                    if len(parts) >= 2:
                        city = f"{parts[-2]}, {parts[-1]}"
                    else:
                        city = parts[-1]
                break

    # B. If not found or too short, search standard Indian cities in full text / address
    if not city or len(city) < 3:
        CITIES = re.compile(
            r'\b(Delhi|New Delhi|Mumbai|Bengaluru|Bangalore|Hyderabad|Chennai|Kolkata|'
            r'Pune|Ahmedabad|Jaipur|Lucknow|Chandigarh|Indore|Bhopal|Surat|Nagpur|'
            r'Patna|Gurugram|Gurgaon|Noida|Ghaziabad|Faridabad|Agra|Varanasi|Meerut|'
            r'Kanpur|Nashik|Vizag|Visakhapatnam|Coimbatore|Madurai|Kochi|Bhubaneswar|'
            r'Guwahati|Ranchi|Raipur|Vadodara|Rajkot|Amritsar|Ludhiana|Jodhpur|Udaipur|'
            r'Prayagraj|Allahabad|Dehradun|Jammu|Srinagar|Mysuru|Mysore|Mangaluru|'
            r'Hubli|Dharwad|Nellore|Guntur|Tirupati|Warangal|Bhilai|Durgapur|Asansol|'
            r'Siliguri|Imphal|Shillong|Aizawl|Itanagar|Kohima|Agartala|Gangtok|Panaji|'
            r'Thane|Navi Mumbai|Aurangabad|Solapur|Kolhapur|Akola|Amravati|Latur|Dhule|'
            r'Wardha|Yavatmal|Chandrapur|Bhandara|Gondia|Nanded|Jalgaon|Ahmednagar|Satara|Sangli|Ratnagiri)\b',
            re.I
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
