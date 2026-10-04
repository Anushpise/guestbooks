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
    'TRANSPORT', 'LICENCE', 'CLASS', 'VALIDITY', 'BLOOD', 'GROUP',
    'NATIONALITY', 'SEX', 'PLACE', 'REGISTERING', 'AUTHORITY',
    'BADGE', 'HAZARDOUS', 'GOODS', 'HILL', 'PERMISSION',
    'MINISTER', 'CIVIL', 'AVIATION', 'IMMIGRATION',
    'PIN', 'PINCODE', 'FILE', 'OLD', 'NO', 'APP', 'APPLICATION',
    'DOB', 'YEARS', 'YRS', 'CODE', 'STATUS',
    'EPIC', 'ELECTORAL', 'ASSEMBLY', 'CONSTITUENCY', 'PART', 'NOTE',
    'SERIAL', 'NEPAL', 'NEPALI', 'RAHADANI', 'HOLDER', 'PERSONAL',
    'ISSUING', 'OFFICER', 'REGISTRATION', 'NIVADANUK', 'AAYOG',
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
    if not s or len(s) < 3 or len(s) > 50:
        return False
    # Only letters, spaces, dots, apostrophes
    if not re.match(r'^[A-Za-z][A-Za-z\s\.\']{1,}[A-Za-z]$', s):
        return False
    upper = s.upper().strip()
    # Reject strings with government / card / department keywords
    if re.search(r'GOVER|GOVT|INDIA|BHARAT|INCOME|TAX|COMMISS|AADHAAR|UNIQUE|IDENTIF|ENROL|AUTHORIT|DEPARTMENT|REPUBLIC|PERMANENT|ACCOUNT|SIGNATURE|TRANSPORT|AVIATION|IMMIGRATION|CIVIL|ELECTION|COMMISSION|MOTOR|VEHICLE|EPIC|ELECTOR|ELECTORAL|NEPAL|RAHADANI|FHOTO|IDENT', upper):
        return False
    # Reject permutations and OCR misreads of EPIC (e.g. IEPI, EPI, OEPIC, BPIC, 1EEPIC)
    if re.match(r'^[OIB01]?[EP1I]{2,4}[C0O]?$', upper):
        return False
    words = [w for w in s.split() if w]
    if len(words) < 1 or len(words) > 6:
        return False
    if any(len(w) < 2 for w in words):
        return False
    # If single word, must be at least 5 letters and not a known stop word or OCR artifact
    if len(words) == 1 and len(words[0]) < 5:
        return False
    for w in words:
        if w.upper() in STOP_WORDS or re.match(r'^[OIB01]?[EP1I]{2,4}[C0O]?$', w.upper()):
            return False
    if upper in STOP_WORDS:
        return False
    return True


def fix_passport_ocr(s: str) -> str:
    """Normalize Passport number: 1 or 2 letters + 7-8 digits (India, Nepal, etc.)."""
    s = re.sub(r'[^A-Za-z0-9]', '', s.strip()).upper()
    if not (8 <= len(s) <= 9):
        return s
    num_letters = 2 if s[:2].isalpha() else 1
    letters = ""
    for ch in s[:num_letters]:
        letters += OCR_LETTER_FIXES.get(ch, ch)
    digits = ""
    for ch in s[num_letters:]:
        digits += OCR_DIGIT_FIXES.get(ch, ch)
    return f"{letters}{digits}"


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


def fix_voter_id_ocr(s: str) -> str:
    """Normalize Voter ID: 3 uppercase letters + 7 digits."""
    s = s.strip().upper()
    # Fix common letter-digit confusions in digit part
    fixed = ""
    for i, c in enumerate(s):
        if i < 3:
            fixed += OCR_LETTER_FIXES.get(c, c)
        else:
            fixed += OCR_DIGIT_FIXES.get(c, c)
    return fixed


def fix_dl_ocr(s: str) -> str:
    """Normalize DL number by keeping only alphanumeric and hyphens."""
    return re.sub(r'[^A-Z0-9\-]', '', s.upper())


# ─── Name Extraction Strategies ───────────────────────────────────────────────

def extract_name(lines: list, id_type: str, full_text: str, dob: str) -> str:
    """
    Multi-strategy Name Extraction based on physical layout of Indian IDs.
    """
    # Strategy 1: Passport MRZ (Machine Readable Zone - 100% ground truth)
    mrz_m = re.search(r'P<([A-Z]{3})([A-Z0-9<]+)', full_text)
    if mrz_m:
        raw = mrz_m.group(2)
        parts = raw.split('<<')
        surname = parts[0].replace('<', ' ').strip().title()
        given = parts[1].replace('<', ' ').strip().title() if len(parts) > 1 else ''
        # Strip trailing OCR artifacts from chevron misreads (e.g. '<' read as 'K' or 'C')
        given = re.sub(r'[\s<]+[KkCcXx<]+$', '', given).strip()
        given = re.sub(r'\b[KkCcXx<]$', '', given).strip()
        if len(given) > 3 and given[-1].upper() in ('K', 'C', 'X', 'I') and given[:-1].upper() in full_text.upper():
            given = given[:-1]
        name_cand = f"{given} {surname}".strip()
        if is_valid_name(name_cand):
            return title_case(name_cand)

    # Strategy 1B: Passport Labeled Surname & Given Name (Standard & International/Nepal Passports)
    if id_type == 'Passport' or re.search(r'\b(?:Surname|Given\s*Names?|थर|नाम)\b', full_text, re.I):
        sur_m = re.search(r'(?:Surname|थर)\s*[:\.\-\s\|]*([A-Za-z][A-Za-z\s\.\']{1,30})', full_text, re.I)
        giv_m = re.search(r'(?:Given\s*Names?|नाम)\s*[:\.\-\s\|]*([A-Za-z][A-Za-z\s\.\']{1,40})', full_text, re.I)
        if giv_m and sur_m:
            gn = re.sub(r'\b(?:Nationality|Sex|DOB|Date|Place|Country|Personal|Issue|Expiry|Personal).*$', '', giv_m.group(1), flags=re.I).strip()
            sn = re.sub(r'\b(?:Given|Nationality|Sex|DOB|Date|Place|Country).*$', '', sur_m.group(1), flags=re.I).strip()
            full_n = f"{gn} {sn}".strip()
            if is_valid_name(full_n):
                return title_case(full_n)
        elif giv_m:
            gn = re.sub(r'\b(?:Nationality|Sex|DOB|Date|Place|Country|Personal).*$', '', giv_m.group(1), flags=re.I).strip()
            if is_valid_name(gn):
                return title_case(gn)

    # Strategy 2A: Explicit "Holder's Name:" / "Name:" label patterns (same-line or next-line)
    for i, line in enumerate(lines):
        # Skip relative labels
        if re.search(r'Father|Mother|Husband|Spouse|Pita|Mata|S\/O|D\/O|W\/O|C\/O|Son of|Wife of|Guardian|Son\/Daughter|वडिलांचे|पतीचे', line, re.I):
            continue

        # Same-line: "Name: Rahul Sharma"
        m_same = re.search(
            r'(?:^|\b)(?:Name|Full Name|Holder\'?s?\s*Name|Elector\'?s?\s*Name|Cardholder(?:\'s)?\s*Name|Applicant\'?s?\s*Name|नाम|Naam)\s*[:\-\.]\s*([A-Za-z][A-Za-z\s\.\']{2,40})',
            line, re.I
        )
        if m_same:
            cand = m_same.group(1).strip()
            cand = re.sub(r'\b(?:DOB|Date|Birth|Father|Mother|Husband|Spouse|Son|Daughter|Sex|Gender|Male|Female|Valid|Blood|Issue|Expiry|S\/O|D\/O|W\/O|C\/O|Age|House|PIN|EPIC).*$', '', cand, flags=re.I).strip()
            if is_valid_name(cand):
                return title_case(cand)

        # Next-line: "Name" on one line, name on next
        if re.match(r'^(?:Name|Full Name|Holder\'?s?\s*Name|Elector\'?s?\s*Name|Cardholder(?:\'s)?\s*Name|Applicant\'?s?\s*Name|नाम|Naam)\s*[:\-]?$', line.strip(), re.I):
            if i + 1 < len(lines):
                cand = lines[i + 1].strip()
                cand = re.sub(r'\b(?:DOB|Date|Birth|Father|Mother|Husband|Spouse|Son|Daughter|Sex|Gender|Male|Female|Valid|Blood|Issue|Expiry|S\/O|D\/O|W\/O|C\/O|Age|House|PIN|EPIC).*$', '', cand, flags=re.I).strip()
                if is_valid_name(cand) and not re.search(r'Father|Mother|DOB|Birth|Gender|India|Tax|Driving|Transport|EPIC|VOTER|Election', cand, re.I):
                    return title_case(cand)

    # Strategy 3: Voter ID — "Elector's Name" / "मतदाराचे नाव" / multi-line layout
    for i, line in enumerate(lines):
        if re.search(r'(?:Elector\'?s?\s*Name|मतदाराच[ेे]?\s*नाव|मतदार\s*नाव|निर्वाचकाचे\s*नाव|निर्वाचक\s*का\s*नाम|मतदाता\s*का\s*नाम)\b', line, re.I):
            cl = re.sub(r'^(?:.*?(?:Elector\'?s?\s*Name|मतदाराच[ेे]?\s*नाव|मतदार\s*नाव|निर्वाचकाचे\s*नाव|निर्वाचक\s*का\s*नाम|मतदाता\s*का\s*नाम))\s*[:\.\-\s\|]*', '', line, flags=re.I).strip()
            cl = re.sub(r'[^A-Za-z\s\.]', '', cl).strip()
            name_parts = []
            if is_valid_name(cl):
                name_parts.append(cl)
            # Check next line: in many Voter IDs, surname is on next line (e.g. Mahalle)
            if i + 1 < len(lines):
                next_l = lines[i + 1].strip()
                if not re.search(r'Father|Mother|Husband|Spouse|वडिलांचे|पतीचे|आईचे|Date|DOB|Birth|Sex|Gender|EPIC|Elector', next_l, re.I):
                    next_cl = re.sub(r'[^A-Za-z\s\.]', '', next_l).strip()
                    if is_valid_name(next_cl) and len(next_cl.split()) <= 2:
                        name_parts.append(next_cl)
            if name_parts:
                combined = ' '.join(name_parts).strip()
                if is_valid_name(combined):
                    return title_case(combined)

    # Strategy 3B: Regex search across full text for Voter Name
    voter_name_rx = re.search(
        r'(?:Elector\'?s?\s*Name|ELECTOR\'?S?\s*NAME|मतदाराच[ेे]?\s*नाव|मतदार\s*नाव|निर्वाचकाचे\s*नाव|निर्वाचक\s*का\s*नाम|मतदाता\s*का\s*नाम)\s*[:\.\-\s\|]*([A-Za-z][A-Za-z\s\.\']{2,40})',
        full_text, re.I
    )
    if voter_name_rx:
        cand = voter_name_rx.group(1).strip()
        cand = re.sub(r'\b(?:DOB|Date|Birth|Father|Mother|Husband|Spouse|Son|Daughter|Sex|Gender|Male|Female|Valid|Blood|Issue|Expiry|S\/O|D\/O|W\/O|C\/O|Age|House|PIN|EPIC).*$', '', cand, flags=re.I).strip()
        cand = re.sub(r'[^A-Za-z\s\.\'].*$', '', cand).strip()
        if is_valid_name(cand):
            return title_case(cand)

    # Strategy 3C: Driving License — "Name of Holder" or applicant name
    dl_name_rx = re.search(
        r'(?:Name\s*of\s*(?:the\s*)?Holder|License(?:e\'?)?s?\s*Name|Applicant(?:\'s)?\s*Name|Holder(?:\'s)?\s*Name|D\.?L\.?\s*Holder(?:\'s)?\s*Name)\s*[:\-]?\s*([A-Za-z][A-Za-z\s\.\']{2,40})',
        full_text, re.I
    )
    if dl_name_rx:
        cand = dl_name_rx.group(1).strip()
        cand = re.sub(r'\b(?:DOB|Date|Birth|Father|Mother|Husband|Spouse|Son|Daughter|Sex|Gender|Male|Female|Valid|Blood|Issue|Expiry|S\/O|D\/O|W\/O|C\/O|Age|House|PIN|EPIC).*$', '', cand, flags=re.I).strip()
        cand = re.sub(r'[^A-Za-z\s\.\'].*$', '', cand).strip()
        if is_valid_name(cand):
            return title_case(cand)

    # Strategy 4: PAN Card Layout (Classic without labels)
    # Header -> Guest Name -> Father's Name -> DOB -> PAN No
    if id_type == 'PAN Card':
        candidates = []
        for line in lines:
            cl = re.sub(r'[^A-Za-z\s\.]', '', line).strip()
            if is_valid_name(cl):
                candidates.append(title_case(cl))
        if candidates:
            return candidates[0]  # First name is cardholder, second is father

    # Strategy 5: Aadhaar / Voter ID / DL — Line preceding DOB
    dob_idx = -1
    for i, line in enumerate(lines):
        if re.search(r'(?:DOB|Date of Birth|Year of Birth|YOB|जन्म)\b', line, re.I) or re.search(r'\b\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4}\b', line):
            dob_idx = i
            break
        if dob and dob in line:
            dob_idx = i
            break

    if dob_idx > 0:
        # Check backwards up to 4 lines
        for back in range(dob_idx - 1, max(-1, dob_idx - 5), -1):
            cl = re.sub(r'^(?:Name|नाम|S\/O|D\/O|W\/O|C\/O)\s*[:\-]?\s*', '', lines[back], flags=re.I).strip()
            cl = re.sub(r'[^A-Za-z\s\.]', '', cl).strip()
            if is_valid_name(cl):
                return title_case(cl)

    # Strategy 6: e-Aadhaar "To" or "Enrollment" line
    for i, line in enumerate(lines):
        if re.match(r'^(?:To|Enrollment\s*No\.?)\s*[:\-]?$', line, re.I) or re.search(r'\bTo\b', line):
            if i + 1 < len(lines):
                cl = re.sub(r'[^A-Za-z\s\.]', '', lines[i + 1]).strip()
                if is_valid_name(cl):
                    return title_case(cl)

    # Strategy 7: General Fallback (First valid name-like line not a stop word)
    for line in lines:
        cl = re.sub(r'^(?:Name|नाम|S\/O|D\/O|W\/O|C\/O)\s*[:\-]?\s*', '', line, flags=re.I).strip()
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

    if re.search(r'INCOME TAX|PERMANENT ACCOUNT NUMBER|\bPAN\s*CARD\b|\bINCOMETAX\b', full_text, re.I):
        id_type = 'PAN Card'
    elif re.search(r'ELECTION COMMISSION|ELECTOR|\bEPIC\b|\bVOTER\b|ELECTORAL|NIRVACHAN|निर्वाचन|मतदाता|पहचान\s*पत्र', full_text, re.I):
        id_type = 'Voter ID'
    elif re.search(r'PASSPORT|REPUBLIC OF INDIA.*PASS|P<IND|P<[A-Z]{3}|MINISTRY OF EXTERNAL|IMMIGRATION|\bSURNAME\b.*PLACE OF BIRTH', full_text, re.I | re.DOTALL):
        id_type = 'Passport'
    elif re.search(r'DRIVING LICEN[SC]E|MOTOR VEHICLES?|TRANSPORT (?:AUTHORITY|DEPT)|DL\s*NO|BADGE\s*NO|RTO|UNION OF INDIA.*DRIVING|SARATHI|LMV|MCWG|LICENSE\s*NO', full_text, re.I):
        id_type = 'Driving License'
    elif re.search(r'AADHAAR|UIDAI|UNIQUE IDENTIFICATION', full_text, re.I):
        id_type = 'Aadhaar Card'

    # ── 2. ID Number Extraction ───────────────────────────────────────────────

    id_number = ''

    # Regex patterns
    pan_strict_rx = re.compile(r'\b([A-Z]{5}[0-9]{4}[A-Z])\b')
    pan_fuzzy_rx  = re.compile(r'\b([A-Z]{5}[0-9OIlSB]{4}[A-Z])\b')
    aadhaar_rx    = re.compile(r'\b([2-9][0-9OIl]{3}[\s\-]?[0-9OIl]{4}[\s\-]?[0-9OIl]{4})\b')
    # Voter ID: 3 uppercase letters + 7 digits (or 2-3 letters + 6-8 digits)
    voter_rx      = re.compile(r'\b([A-Z]{2,3}[\s\-]?[0-9OIlSB]{6,8})\b')
    # Passport: 1-2 letters + 7-8 digits (Indian, Nepali PA-series, and International)
    passport_rx   = re.compile(r'\b([A-Z]{1,2}[0-9OIlSBD]{7,8})\b', re.I)
    # DL: State code (2 alpha) + year (2-4 digits) + unique no (varies: 4-11 digits)
    dl_rx         = re.compile(
        r'\b([A-Z]{2}[\-\s\/]?[0-9]{2}[\-\s\/]?(?:19\d{2}|20\d{2})[\-\s\/]?[0-9]{4,8}|'
        r'[A-Z]{2}[\-\s\/]?[0-9]{2}[\-\s\/]?[0-9]{7,11}|'
        r'[A-Z]{2}[0-9]{13,15})\b',
        re.I
    )
    dl_alt_rx     = re.compile(r'\b([A-Z]{2}[0-9]{13,15})\b', re.I)

    # A. PAN Card
    if id_type == 'PAN Card':
        m_pan = pan_strict_rx.search(full_text) or pan_fuzzy_rx.search(full_text)
        if m_pan:
            id_number = fix_pan_ocr(m_pan.group(1))

    # B. Voter ID
    elif id_type == 'Voter ID':
        # Try labeled first: "EPIC No: ABC1234567"
        epic_lbl = re.search(
            r'(?:EPIC\s*(?:No\.?|Number)?|Voter\s*ID\s*(?:No\.?)?|Card\s*No\.?|मतदाता\s*पहचान\s*पत्र\s*क्र\.?|पहचान\s*पत्र\s*क्र\.?)\s*[:\-]?\s*'
            r'([A-Z]{2,3}[\s\-\/]?[0-9OIlSB]{6,8}|[A-Z]{2}\/[0-9\/]+)',
            full_text, re.I
        )
        if epic_lbl:
            raw_vid = re.sub(r'[\s\-]+', '', epic_lbl.group(1).upper())
            id_number = fix_voter_id_ocr(raw_vid)
        else:
            m_voter = voter_rx.search(full_text)
            if m_voter:
                raw_vid = re.sub(r'[\s\-]+', '', m_voter.group(1).upper())
                id_number = fix_voter_id_ocr(raw_vid)

    # C. Passport
    elif id_type == 'Passport':
        # 1. MRZ Line 2: passport number appears before check digit & 3-letter country code
        # e.g. PA16616618NPL... or J1234567<4IND...
        mrz2_m = re.search(r'\b([A-Z]{1,2}[0-9OIlSBD]{7,8})[0-9<]([A-Z]{3})', full_text)
        if mrz2_m:
            id_number = fix_passport_ocr(mrz2_m.group(1))
        if not id_number:
            # 2. Labeled: "PASSPORT NO.: PA1661661", "राहदानी नं. | PASSPORT NO.: PA1661661", "Passport No: J1234567"
            pass_lbl = re.search(
                r'(?:Passport\s*(?:No\.?|Number)?|Passeport\s*No\.?|राहदानी\s*नं\.?|पासपोर्ट\s*क्र\.?)\s*[:\.\-\s\|]*([A-Z]{1,2}[0-9OIlSBD]{7,8})',
                full_text, re.I
            )
            if pass_lbl:
                id_number = fix_passport_ocr(pass_lbl.group(1))
            else:
                m_pass = passport_rx.search(full_text)
                if m_pass:
                    id_number = fix_passport_ocr(m_pass.group(1))

    # D. Driving License
    elif id_type == 'Driving License':
        dl_lbl = re.search(
            r'(?:DL\s*(?:No\.?|Number)?|License\s*(?:No\.?|Number)?|Licence\s*(?:No\.?|Number)?|'
            r'Driving\s*Licen[sc]e\s*(?:No\.?)?|D\/L\s*No\.?)\s*[:\-]?\s*'
            r'([A-Z]{2}[\-\s\/]?[0-9]{2}[\-\s\/]?(?:19\d{2}|20\d{2})[\-\s\/]?[0-9]{4,8}|'
            r'[A-Z]{2}[\-\s\/]?[0-9]{2}[\-\s\/]?[0-9]{7,11}|'
            r'[A-Z]{2}[0-9]{13,15})',
            full_text, re.I
        )
        if dl_lbl:
            id_number = fix_dl_ocr(dl_lbl.group(1))
        else:
            m_dl = dl_rx.search(full_text) or dl_alt_rx.search(full_text)
            if m_dl:
                id_number = fix_dl_ocr(m_dl.group(1))

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
            # Check Voter ID pattern
            m_voter = voter_rx.search(full_text)
            if m_voter and re.search(r'Election|Elector|Voter|EPIC|Commission|India', full_text, re.I):
                id_number = fix_voter_id_ocr(re.sub(r'[\s\-]+', '', m_voter.group(1).upper()))
                id_type = 'Voter ID'
            else:
                # Check DL pattern
                m_dl = dl_rx.search(full_text)
                if m_dl and re.search(r'Transport|Vehicles|Driving|Licen|RTO|Sarathi', full_text, re.I):
                    id_number = fix_dl_ocr(m_dl.group(1))
                    id_type = 'Driving License'
                else:
                    # Check Passport pattern
                    m_pass = passport_rx.search(full_text)
                    if m_pass and re.search(r'Passport|Republic|Nationality|Given Name|Surname', full_text, re.I):
                        id_number = m_pass.group(1).upper()
                        id_type = 'Passport'
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

    # Check Passport MRZ Line 2 (format: PassNo + CheckDigit + Country + YYMMDD + CheckDigit + Sex + Expiry)
    # e.g., PA16616618NPL0310309F3306068... or J1234567<4IND8805128M...
    mrz2_match = re.search(r'([A-Z]{1,2}[0-9OIlSBD]{7,8})[0-9<]([A-Z]{3})([0-9]{2})(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[0-9<]([MF<])', full_text)
    if mrz2_match:
        yy, mm, dd = int(mrz2_match.group(3)), mrz2_match.group(4), mrz2_match.group(5)
        full_yr = 1900 + yy if yy > (current_year % 100) else 2000 + yy
        dob = f"{dd}/{mm}/{full_yr}"
        age = str(current_year - full_yr)

    if not dob:
        # Check general Passport MRZ DOB (format: YYMMDD)
        mrz_dob = re.search(r'([0-9]{2})(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[0-9][MF]', full_text)
        if mrz_dob:
            yy, mm, dd = int(mrz_dob.group(1)), mrz_dob.group(2), mrz_dob.group(3)
            full_yr = 1900 + yy if yy > (current_year % 100) else 2000 + yy
            dob = f"{dd}/{mm}/{full_yr}"
            age = str(current_year - full_yr)

    # Textual month mapping for passports and international IDs (e.g., 30 OCT 2003)
    MONTH_MAP = {
        'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
        'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
    }

    if not dob:
        # Try labeled DOB with textual month: "DATE OF BIRTH: 30 OCT 2003", "जन्म मिति : 30 OCT 2003"
        dob_text_m = re.search(
            r'(?:DOB|D\.?O\.?B\.?|Date\s*of\s*Birth|जन्म\s*(?:तिथि|तारीख|मिति)|Born)\s*[:\|\.\-\s\/]*'
            r'(\d{1,2})\s*([A-Za-z]{3,9})\s*(\d{4})',
            full_text, re.I
        )
        if dob_text_m:
            d_val = dob_text_m.group(1).zfill(2)
            m_str = dob_text_m.group(2)[:3].upper()
            yr_val = dob_text_m.group(3)
            if m_str in MONTH_MAP and yr_val.isdigit():
                yr = int(yr_val)
                if 1900 < yr <= current_year:
                    dob = f"{d_val}/{MONTH_MAP[m_str]}/{yr}"
                    age = str(current_year - yr)

    if not dob:
        # Try labeled numeric DOB: "Date of Birth: 05/05/1997", "जन्म तारीख / Date of Birth : 05/05/1997"
        dob_label_rx = re.compile(
            r'(?:DOB|D\.?O\.?B\.?|Date\s*of\s*Birth|जन्म\s*(?:तिथि|तारीख|मिति)|Born)\s*[:\|\.\-\s\/]*'
            r'(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4})',
            re.I
        )
        dob_lbl_m = dob_label_rx.search(full_text)
        if dob_lbl_m:
            dob = dob_lbl_m.group(1).replace('.', '/').replace('-', '/')
            parts = dob.split('/')
            if len(parts) == 3 and parts[2].isdigit():
                yr = int(parts[2])
                if 1900 < yr <= current_year:
                    age = str(current_year - yr)

    if not dob:
        # Strip non-DOB dates from candidate text for dob_full_rx
        # e.g., 'Age as on 01.01.2023', 'Valid Upto 09/11/2045', 'Valid From 10/02/2012', 'Date of Issue: 10/01/2015'
        dob_cand_text = full_text
        dob_cand_text = re.sub(
            r'(?:Age\s*as\s*on|Valid\s*(?:Upto|Till|From|Through)|(?:Date\s*of\s*)?Issue|(?:Date\s*of\s*)?Expiry)\s*[:\-]?\s*\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4}',
            '',
            dob_cand_text,
            flags=re.I
        )
        dob_full_rx = re.compile(r'\b(\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4})\b')
        dob_m = dob_full_rx.search(dob_cand_text)
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
        yob_m = re.search(r'(?:Year of Birth|YOB|जन्म\s*का\s*वर्ष)\s*[:\-\/]?\s*(\d{4})', full_text, re.I)
        if yob_m:
            yr = int(yob_m.group(1))
            if 1900 < yr <= current_year:
                dob = f"01/01/{yr}"
                age = str(current_year - yr)

    # Voter ID / Age fallback (many voter cards list Age instead of full DOB)
    if not dob:
        age_m = re.search(r'(?:Age\s*(?:as\s*on\s*[\d\.\/]+)?|आयु)\s*[:\-]?\s*(\d{2})\s*(?:Years|Yrs|वर्ष)?\b', full_text, re.I)
        if age_m:
            cand_age = int(age_m.group(1))
            if 18 <= cand_age <= 110:
                age = str(cand_age)
                est_yr = current_year - cand_age
                dob = f"01/01/{est_yr}"

    # Driving License: try valid-from/issue date as DOB if DOB field is labeled
    if not dob and id_type == 'Driving License':
        dl_dob_rx = re.search(r'(?:DOB|Date\s*of\s*Birth)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})', full_text, re.I)
        if dl_dob_rx:
            dob = dl_dob_rx.group(1).replace('.', '/').replace('-', '/')
            parts = dob.split('/')
            if len(parts) == 3 and parts[2].isdigit():
                yr = int(parts[2])
                if 1900 < yr <= current_year:
                    age = str(current_year - yr)

    # ── 4. Gender ─────────────────────────────────────────────────────────────

    gender = ''
    # 1. From Passport MRZ line 2
    if mrz2_match and mrz2_match.group(6) in ('M', 'F'):
        gender = 'Male' if mrz2_match.group(6) == 'M' else 'Female'

    # 2. General MRZ Gender regex
    if not gender:
        mrz_gen = re.search(r'[0-9]{7}[A-Z]{3}[0-9]{6}[0-9]([MF])', full_text)
        if mrz_gen:
            gender = 'Male' if mrz_gen.group(1) == 'M' else 'Female'

    # 3. Labeled Sex/Gender field: e.g. "Sex : पुरुष / Male", "लिंग / Sex : पुरुष / Male", "लिङ्ग | SEX: F"
    if not gender:
        sex_m = re.search(r'\b(?:Sex|Gender|लिंग|लिङ्ग)\s*[:\|\-\/]?\s*([A-Za-z\u0900-\u097F]+)', full_text, re.I)
        if sex_m:
            val = sex_m.group(1).upper()
            if val.startswith('F') or 'FEMALE' in val or 'महिला' in val or 'स्त्री' in val:
                gender = 'Female'
            elif val.startswith('M') or 'MALE' in val or 'पुरुष' in val:
                gender = 'Male'

    # 4. Keyword search
    if not gender:
        if re.search(r'\b(?:FEMALE|Female|महिला|स्त्री|WIFE)\b', full_text):
            gender = 'Female'
        elif re.search(r'\b(?:MALE|Male|पुरुष|HUSBAND)\b', full_text):
            gender = 'Male'
        elif re.search(r'\b(?:OTHER|Third Gender|Transgender)\b', full_text, re.I):
            gender = 'Other'

    if not gender:
        gender = 'Male'  # Default

    # ── 5. Name Extraction ────────────────────────────────────────────────────

    name = extract_name(all_lines, id_type, full_text, dob)

    # ── 6. Address & Pincode ──────────────────────────────────────────────────

    pincode = ''
    address = ''

    pin_m = re.search(r'\b([1-9][0-9]{5})\b', full_text)
    if pin_m:
        pincode = pin_m.group(1)

    addr_start_rx = re.compile(
        r'\b(?:Address|Adress|Addr|पत्ता|पता|ठेगाना|आत्मज|पत्नी|मुलगा|मुलगी|पुत्र|पुत्री|'
        r'S\/O|W\/O|D\/O|C\/O|S\/o|W\/o|D\/o|C\/o|Care of|Son of|Daughter of|Wife of|'
        r'House|H\.?No\.?|H-No|Flat|Plot|Door|Bldg|Apartment|Room|Survey|Gat|'
        r'Village|Vill\.|Post|P\.O\.|मु\.पो|मु\. पो|मुकाम|पोस्ट|तहसील|तालुका|जिल्हा|'
        r'Dist|District|Ward|Block|Sector|Floor|Near|Beside|Opposite|Behind|Adjacent|'
        r'Gali|Mohalla|Chowk|Street|Road|Lane|Nagar|Colony|Park|Marg|Layout|Vihar|Enclave)\b',
        re.I
    )
    addr_stop_rx = re.compile(
        r'\b(?:Date of Issue|Valid Upto|Validity|Signature|UIDAI Help|Toll Free|Email|www\.|'
        r'http|Mobile|Phone|Tel|Telephone|टेलिफोन|1947|help@|uidai\.gov|Badge|Hazardous|Blood\s*Group|'
        r'Class of Vehicle|Licence Class|EPIC\s*No|ELECTOR|ELECTORAL|Passport\s*No|राहदानी|प्रकार|नेपाल|मुलुक|'
        r'DL\s*No|Licence\s*No|License\s*No|Enrolment\s*No|VID\s*No|विधानसभा|Assembly\s*Constituency)\b',
        re.I
    )

    personal_info_rx = re.compile(
        r'\b(?:Father(?:\'s)?\s*Name|Mother(?:\'s)?\s*Name|Husband(?:\'s)?\s*Name|Spouse(?:\'s)?\s*Name|'
        r'पिता(?:\s*का)?\s*नाम|माता(?:\s*का)?\s*नाम|पति(?:\s*का)?\s*नाम|'
        r'Date\s*of\s*Birth|DOB|Year\s*of\s*Birth|YOB|जन्म\s*(?:तिथि|तारीख|मिति)|'
        r'Sex\b|Gender|Male\b|Female\b|Transgender|लिंग|लिङ्ग|पुरुष|महिला|'
        r'Elector(?:\'s)?\s*Name|Given\s*Names?|Surname|Cardholder|Applicant(?:\'s)?\s*Name|'
        r'Place\s*of\s*Birth|Place\s*of\s*Issue|Date\s*of\s*Issue|Date\s*of\s*Expiry|Valid\s*Upto|'
        r'Blood\s*Group|Nationality|Passport\s*No|EPIC\s*No|DL\s*No|Licence\s*No|License\s*No)\b',
        re.I
    )

    header_rx = re.compile(
        r'\b(?:AADHAAR|GOVERNMENT OF INDIA|ELECTION COMMISSION|INCOME TAX|UNIQUE IDENTIFICATION|'
        r'BHARAT SARKAR|भारत सरकार|MINISTRY OF ROAD|TRANSPORT AUTHORITY|DRIVING LICENCE|'
        r'MINISTRY OF EXTERNAL|REPUBLIC OF INDIA)\b',
        re.I
    )

    has_explicit_addr_lbl = any(
        re.search(r'\b(?:Address|Adress|Addr|पत्ता|पता|ठेगाना)\b', l, re.I)
        for l in all_lines
    )

    addr_lines = []
    in_addr = False

    for line in all_lines:
        if len(line) < 3:
            continue
        # Strip document section separators like '--- BACK DOCUMENT ---'
        if re.search(r'---\s*(?:BACK|FRONT|DOCUMENT|SCAN)', line, re.I):
            continue
        if header_rx.search(line):
            continue

        if not in_addr:
            if has_explicit_addr_lbl:
                if re.search(r'\b(?:Address|Adress|Addr|पत्ता|पता|ठेगाना)\b', line, re.I):
                    in_addr = True
            else:
                if not personal_info_rx.search(line) and addr_start_rx.search(line):
                    in_addr = True

        if not in_addr:
            continue
        if addr_stop_rx.search(line):
            break
        if personal_info_rx.search(line):
            continue

        # If line contains 'Address:' strip everything before the label
        lbl_m = re.search(r'\b(?:Address|Adress|Addr|पत्ता|पता|ठेगाना)\s*[:\|\-]\s*', line, re.I)
        cl = line[lbl_m.end():] if lbl_m else line

        cl = re.sub(r'\|', ' ', cl).strip()

        # Remove 12-digit Aadhaar / ID numbers from address line
        cl = re.sub(r'\b[2-9][0-9]{3}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}\b', '', cl)
        cl = re.sub(r'\b\d{4}\s+\d{4,5}[\s,]*\d{3,5}\b', '', cl)
        if id_number:
            cl = cl.replace(id_number, '').replace(id_number.replace(' ', ''), '')

        cl = re.sub(r'\s+', ' ', cl).strip(' ,-.')

        if cl and len(cl) >= 3 and not re.match(r'^\d{1,4}$', cl):
            if not re.search(r'^[a-zA-Z]{1,2}\s*$', cl):
                addr_lines.append(cl)

        if pincode and pincode in line:
            break
        if len(addr_lines) >= 6:
            break

    # Backward scan from pincode if not enough address collected
    has_good_addr = (
        len(addr_lines) >= 2 or
        (len(addr_lines) == 1 and (
            len(addr_lines[0]) >= 25 or
            re.search(r'\b(?:House|Flat|Plot|Sector|Road|Nagar|Colony|Street|Marg|Vihar|Lane|Enclave)\b', addr_lines[0], re.I)
        ))
    )
    if not has_good_addr and pincode:
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
                if re.search(r'---\s*(?:BACK|FRONT|DOCUMENT|SCAN)', l, re.I):
                    continue
                if header_rx.search(l) or addr_stop_rx.search(l) or personal_info_rx.search(l):
                    continue
                if re.match(r'^\d{4}\s*\d{4}\s*\d{4}$', l) or re.match(r'^\d{1,4}$', l):
                    continue
                if any(k in l.lower() for k in ['unique identification', 'authority of india', 'help@', '1947', 'government of india', 'भारत सरकार', 'ministry of road', 'transport authority']):
                    continue

                lbl_m = re.search(r'\b(?:Address|Adress|Addr|पत्ता|पता|ठेगाना)\s*[:\|\-]\s*', l, re.I)
                cl = l[lbl_m.end():] if lbl_m else l
                cl = re.sub(r'\|', ' ', cl).strip()

                cl = re.sub(r'\b[2-9][0-9]{3}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}\b', '', cl)
                cl = re.sub(r'\b\d{4}\s+\d{4,5}[\s,]*\d{3,5}\b', '', cl)

                cl = re.sub(r'\s+', ' ', cl).strip(' ,-.')

                if cl and len(cl) >= 3 and not re.search(r'^[a-zA-Z]{1,2}\s*$', cl):
                    collected.append(cl)
            if collected:
                addr_lines = collected

    if addr_lines:
        raw_addr = ', '.join(addr_lines)
        raw_addr = re.sub(r'---\s*(?:BACK|FRONT|DOCUMENT|SCAN)[^-\n]*---', '', raw_addr, flags=re.I)
        lbl_m = re.search(r'\b(?:Address|Adress|Addr|पत्ता|पता|ठेगाना)\s*[:\|\-]\s*', raw_addr, re.I)
        if lbl_m:
            raw_addr = raw_addr[lbl_m.end():]

        raw_addr = re.sub(r'\b[2-9][0-9]{3}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}\b', '', raw_addr)
        raw_addr = re.sub(r'\b\d{1,4}\s+\d{4,5}[\s,]*\d{3,5}\b', '', raw_addr)
        if id_number:
            raw_addr = raw_addr.replace(id_number, '').replace(id_number.replace(' ', ''), '')

        raw_addr = re.sub(r'^(?:[a-zA-Z]{1,3}\s+)*[a-zA-Z]{1,2}\s*,\s*', '', raw_addr)
        raw_addr = re.sub(r',\s*,', ',', raw_addr)
        raw_addr = re.sub(r'\s+', ' ', raw_addr).strip(', .-')

        words = raw_addr.split(' ')
        cleaned_words = []
        for w in words:
            if not w:
                continue
            if w.upper() in ('PO', 'SO', 'DO', 'CO', 'HO', 'PIN', 'NO', 'HN', 'FLAT'):
                cleaned_words.append(w.upper())
            elif re.match(r'^\d+[a-zA-Z]?$', w):
                cleaned_words.append(w)
            elif w.upper() in ('(MH)', '(UP)', '(DL)', '(MP)', '(GJ)', '(RJ)', '(KA)', '(TN)', '(KL)', '(WB)'):
                cleaned_words.append(w.upper())
            else:
                cleaned_words.append(w.capitalize())

        address = ' '.join(cleaned_words)
        address = re.sub(r'\s*,\s*', ', ', address)
        address = re.sub(r'(,\s*){2,}', ', ', address).strip(' ,-.')
    elif pincode:
        address = f"PIN Code: {pincode}"

    # ── 7. City & State ───────────────────────────────────────────────────────

    city = ''
    STATES_SET = {
        'MAHARASHTRA', 'महाराष्ट्र', 'UTTAR PRADESH', 'MADHYA PRADESH', 'GUJARAT',
        'RAJASTHAN', 'BIHAR', 'DELHI', 'HARYANA', 'PUNJAB', 'TAMIL NADU', 'KARNATAKA',
        'KERALA', 'WEST BENGAL', 'TELANGANA', 'ANDHRA PRADESH', 'ODISHA', 'ASSAM',
        'JHARKHAND', 'MH', 'UP', 'MP', 'GJ', 'RJ', 'DL', 'HR', 'PB', 'TN', 'KA', 'KL', 'WB', 'TS', 'AP',
        'NEPAL', 'INDIA'
    }

    if pincode:
        for l in all_lines:
            if pincode in l:
                clean_l = re.sub(r'[\s\-]*' + pincode + r'.*$', '', l).strip(' ,-')
                clean_l = re.sub(r'^(?:PIN|PINCODE|PIN\s*CODE|ZIP)[\s:]*', '', clean_l, flags=re.I).strip(' ,-')
                parts = [p.strip() for p in clean_l.split(',') if p.strip() and len(p.strip()) > 2 and not re.match(r'^(?:PIN|PINCODE|PIN\s*CODE|FILE|OLD)\b', p.strip(), re.I)]
                if parts:
                    cand = parts[-1]
                    # If last part is like "Dist - Wardha (MH)" or "(महाराष्ट्र)", clean it
                    cand = re.sub(r'\([A-Za-z\u0900-\u097F\s]+\)', '', cand).strip(' ,-')
                    cand = re.sub(r'^(?:Dist(?:rict)?|Teh(?:sil)?|Taluka|तालुका|जिल्हा)\s*[\-:]\s*', '', cand, flags=re.I).strip(' ,-')
                    if cand and cand.upper() not in STATES_SET and len(cand) >= 3 and not re.search(r'[\u0900-\u097F]', cand):
                        city = cand
                    elif len(parts) >= 2:
                        cand2 = parts[-2]
                        cand2 = re.sub(r'\([A-Za-z\u0900-\u097F\s]+\)', '', cand2).strip(' ,-')
                        cand2 = re.sub(r'^(?:Dist(?:rict)?|Teh(?:sil)?|Taluka|तालुका|जिल्हा)\s*[\-:]\s*', '', cand2, flags=re.I).strip(' ,-')
                        if cand2 and cand2.upper() not in STATES_SET and len(cand2) >= 3 and not re.search(r'[\u0900-\u097F]', cand2):
                            city = cand2
                break

    if city and (city.upper().strip('()[] ') in STATES_SET or re.match(r'^(?:PIN|PINCODE|PIN\s*CODE|NO|NUMBER|NULL|NONE|INDIA)[\s:]*$', city, re.I)):
        city = ''

    # Fallback 1: Extract from labeled District: "Dist - Wardha", "District: Nagpur"
    if not city or len(city) < 3:
        dist_m = re.search(r'\b(?:Dist(?:rict)?|जिल्हा)\s*[\-:]\s*([A-Za-z]{3,20})', full_text, re.I)
        if dist_m:
            cand_dist = dist_m.group(1).capitalize()
            if cand_dist.upper() not in STATES_SET:
                city = cand_dist

    # Fallback 2: Extract from Place of Birth / Emergency Address (e.g. Nepal Passport: Saptari, Kathmandu)
    if not city or len(city) < 3:
        pob_m = re.search(r'\b(?:Place\s*of\s*Birth)\s*[:\|\-]?\s*([A-Za-z]{3,20})', full_text, re.I)
        if not pob_m:
            pob_m = re.search(r'\b(?:जन्मस्थान)\s*[:\|\-]?\s*([A-Za-z]{3,20})', full_text, re.I)
        if pob_m:
            cand_pob = pob_m.group(1).capitalize()
            if cand_pob.upper() not in STATES_SET and cand_pob.upper() not in ('PLACE', 'BIRTH', 'ISSUE', 'DATE', 'NAME', 'SURNAME'):
                city = cand_pob

    # Fallback 3: Major Indian & Subcontinent Cities dictionary
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
            r'Wardha|Yavatmal|Chandrapur|Bhandara|Gondia|Nanded|Jalgaon|Ahmednagar|Satara|Sangli|Ratnagiri|'
            r'Kathmandu|Pokhara|Lalitpur|Biratnagar|Birgunj|Dharan|Bharatpur|Janakpur|Hetauda|Butwal|Saptari)\b',
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
