import re
from datetime import datetime

def parse_indian_id_text(text: str) -> dict:
    """
    Intelligent line parser specifically tuned for Indian Government IDs:
    - Aadhaar Card (12-digit number e.g. 3379 7203 6560, Name e.g. Vijender Singh, YOB 1988, Gender, Address)
    - PAN Card (10-character PAN, Name, Father Name, DOB)
    - Voter ID (10-character EPIC ID, Name, Age/DOB)
    - Passport (8-character Passport number, Given name, Address)
    """
    if not text:
        return {}

    lines = [l.strip() for l in text.split('\n') if l.strip()]
    full_text = " ".join(lines)

    id_type = "Aadhaar Card"
    id_number = ""
    name = ""
    dob = ""
    age = ""
    gender = "Male"
    address = ""
    city = ""
    pincode = ""

    # 1. Flexible Regex ID Number Detection
    aadhaar_match = re.search(r'([2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4})', full_text)
    pan_match = re.search(r'([A-Z]{5}[0-9]{4}[A-Z]{1})', full_text, re.IGNORECASE)
    voter_match = re.search(r'([A-Z]{3}[0-9]{7})', full_text, re.IGNORECASE)
    passport_match = re.search(r'([A-Z][0-9]{7})', full_text, re.IGNORECASE)

    if pan_match:
        id_type = "PAN Card"
        id_number = pan_match.group(1).upper()
    elif voter_match:
        id_type = "Voter ID"
        id_number = voter_match.group(1).upper()
    elif aadhaar_match:
        id_type = "Aadhaar Card"
        id_number = aadhaar_match.group(1)
    elif passport_match:
        id_type = "Passport"
        id_number = passport_match.group(1).upper()
    else:
        # Digits fallback
        digits_only = re.sub(r'[^0-9]', '', full_text)
        m12 = re.search(r'([2-9]\d{11})', digits_only)
        if m12:
            id_type = "Aadhaar Card"
            num_str = m12.group(1)
            id_number = f"{num_str[:4]} {num_str[4:8]} {num_str[8:]}"

    # 2. Extract DOB / YOB
    dob_match = re.search(r'(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})', full_text)
    yob_match = re.search(r'(?:Year of Birth|YOB|DOB|Birth|birth)[\s\/:\-\w]*(\d{4})', full_text, re.IGNORECASE) or re.search(r'\b(19[4-9]\d|20[0-2]\d)\b', full_text)

    current_year = datetime.now().year

    if dob_match:
        dob = dob_match.group(1)
        parts = re.split(r'[\/\.-]', dob)
        if len(parts) == 3:
            try:
                birth_year = int(parts[2])
                if 1900 <= birth_year <= current_year:
                    age = str(current_year - birth_year)
            except ValueError:
                pass
    elif yob_match:
        try:
            birth_year = int(yob_match.group(1))
            if 1900 <= birth_year <= current_year:
                age = str(current_year - birth_year)
                dob = f"01/01/{birth_year}"
        except ValueError:
            pass

    # 3. Extract Gender
    if re.search(r'(?:FEMALE|Female|Woman|महिला)', full_text, re.IGNORECASE) and not re.search(r'MALE', full_text):
        gender = "Female"
    elif re.search(r'(?:MALE|Male|Man|पुरुष)', full_text, re.IGNORECASE):
        gender = "Male"

    # 4. Smart Name Extraction
    ignore_words = {
        'GOVERNMENT', 'INDIA', 'INCOME', 'TAX', 'DEPARTMENT', 'ELECTION',
        'COMMISSION', 'AADHAAR', 'MALE', 'FEMALE', 'FATHER', 'MOTHER',
        'ADDRESS', 'DOB', 'DATE', 'BIRTH', 'CARD', 'REPUBLIC', 'INDIAN',
        'UNIQUE', 'IDENTIFICATION', 'AUTHORITY', 'BHARAT', 'GOVT', 'S/O',
        'W/O', 'D/O', 'C/O', 'SIGNATURE', 'CARDHOLDER', 'ISSUED', 'HELP',
        'ENROLMENT', 'NUMBER', 'NAME', 'PATA'
    }

    # PAN Card Name Heuristic
    if id_type == "PAN Card":
        for i, l in enumerate(lines):
            if re.search(r'INCOME TAX|GOVT OF INDIA', l, re.IGNORECASE) and i + 1 < len(lines):
                candidate = re.sub(r'[^A-Za-z\s]', '', lines[i + 1]).strip()
                if len(candidate) >= 3 and not any(w in candidate.upper() for w in ignore_words):
                    name = candidate
                    break

    # General Name Fallback
    if not name:
        for l in lines:
            clean_l = re.sub(r'^[^A-Za-z]+', '', l)
            clean_l = re.sub(r'^(Name|Full Name|Name:)\s*', '', clean_l, flags=re.IGNORECASE).strip()
            upper_l = clean_l.upper()

            if (
                3 <= len(clean_l) <= 35
                and re.match(r'^[A-Za-z\s\.]+$', clean_l)
                and not re.search(r'\d', clean_l)
                and not any(w in upper_l for w in ignore_words)
            ):
                name = clean_l
                break

    # 5. Permanent Address Extraction
    pin_match = re.search(r'\b([1-9][0-9]{5})\b', full_text)
    if pin_match:
        pincode = pin_match.group(1)

    address_lines = []
    capture_address = False

    for l in lines:
        if re.search(r'(?:Address|Address:|पता|पता:|S\/O|W\/O|D\/O|C\/O|द्वारा|House|Vill|Village|Post|Street|Road|Nagar|Colony|P\.O|Dist|District|Sector|Floor)', l, re.IGNORECASE):
            capture_address = True
        if capture_address:
            clean_addr = re.sub(r'^(Address|Address:|पता|पता:)\s*', '', l, flags=re.IGNORECASE).strip()
            if clean_addr:
                address_lines.append(clean_addr)
            if pincode and pincode in l:
                break

    if address_lines:
        address = ", ".join(address_lines)
    elif pincode:
        address = f"PIN Code: {pincode}"

    # Extract City heuristic
    city_match = re.search(r'(Delhi|New Delhi|Mumbai|Bengaluru|Bangalore|Hyderabad|Chennai|Kolkata|Pune|Ahmedabad|Jaipur|Lucknow|Chandigarh|Indore|Bhopal|Surat|Nagpur|Patna|Gurugram|Noida|Ghaziabad|Faridabad)', full_text, re.IGNORECASE)
    if city_match:
        city = city_match.group(1)

    return {
        "idType": id_type,
        "idNumber": id_number,
        "name": name,
        "dob": dob,
        "age": age,
        "gender": gender,
        "address": address,
        "city": city,
        "pincode": pincode,
        "rawText": text
    }
