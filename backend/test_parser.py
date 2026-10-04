import sys
sys.path.insert(0, '.')
sys.stdout.reconfigure(encoding='utf-8')
from app.services.indian_id_parser import parse_indian_id_text

def show(label, r):
    print(label)
    for k in ['idType','idNumber','name','dob','age','gender','address','city','pincode']:
        print(f"  {k}: {r.get(k,'')}")
    print()

# TEST 1: Voter ID
voter_text = """
ELECTION COMMISSION OF INDIA
ELECTOR PHOTO IDENTITY CARD

EPIC No: ABD1234567

Elector's Name: Priya Verma
Father's Name: Suresh Verma
Date of Birth: 15/03/1988
Sex: Female
House No: 45, Sector 12, Noida, Uttar Pradesh 201301
"""
show("VOTER ID TEST:", parse_indian_id_text(voter_text))

# TEST 2: Passport
passport_text = """
REPUBLIC OF INDIA
PASSPORT
Ministry of External Affairs

Passport No: J1234567
Surname: SHARMA
Given Name: AMIT KUMAR
Date of Birth: 22/08/1990
Sex: Male
Place of Birth: Delhi
Date of Issue: 10/01/2015
Date of Expiry: 09/01/2025
"""
show("PASSPORT TEST:", parse_indian_id_text(passport_text))

# TEST 3: Driving License
dl_text = """
GOVERNMENT OF INDIA
MOTOR VEHICLES ACT 1988
DRIVING LICENCE

DL No: MH-01-20120012345
Name: Ravi Shankar Gupta
Father/Husband Name: Ram Gupta
DOB: 05/11/1985
Sex: Male
S/O Ram Gupta
Address: 12 B Patel Nagar, Mumbai, Maharashtra 400001
Blood Group: B+
Valid From: 10/02/2012
Valid Upto: 09/11/2045
"""
show("DRIVING LICENSE TEST:", parse_indian_id_text(dl_text))

# TEST 4: Passport Back Side (with Address)
passport_back_text = """
REPUBLIC OF INDIA - PASSPORT
Name of Father / Legal Guardian: RAJESH SHARMA
Name of Mother: SUNITA SHARMA
Name of Spouse: PRIYA SHARMA
Address:
FLAT 402 SKYLINE APARTMENTS
SECTOR 21 DWARKA NEW DELHI
PIN: 110075
Old Passport No: Z1234567
File No: DL1061234567815
"""
show("PASSPORT BACK TEST:", parse_indian_id_text(passport_back_text))

# TEST 5: Passport with MRZ
passport_mrz_text = """
REPUBLIC OF INDIA
PASSPORT
P<INDSHARMA<<ROHIT<KUMAR<<<<<<<<<<<<<<<<<<<<<
M1234567<5IND8805128M2805112<<<<<<<<<<<<<<02
"""
show("PASSPORT MRZ TEST:", parse_indian_id_text(passport_mrz_text))

# TEST 6: Voter ID with Age (no DOB)
voter_age_text = """
BHARAT NIRVACHAN AAYOG
ELECTION COMMISSION OF INDIA
EPIC NO: TWB9876543
Name: Sunita Devi
Husband's Name: Ramesh Devi
Age as on 01.01.2023: 29 Years
Gender: Female
"""
show("VOTER ID AGE TEST:", parse_indian_id_text(voter_age_text))

# TEST 7: Delhi DL Format
delhi_dl_text = """
TRANSPORT DEPARTMENT DELHI
DRIVING LICENCE
DL NO: DL-0420110012345
Name of Holder: Vikram Singh
DOB: 12-04-1992
Sex: Male
Address: Pocket B, Phase 2, Mayur Vihar, New Delhi 110091
"""
show("DELHI DL TEST:", parse_indian_id_text(delhi_dl_text))

# TEST 8: Real Maharashtra Voter ID (From User's Photo)
user_voter_text = """
--- FRONT DOCUMENT ---
भारत निवडणूक आयोग
ELECTION COMMISSION OF INDIA
मतदार फोटो ओळख पत्र ELECTOR PHOTO IDENTITY CARD

XLP6993596
EPIC EPIC EPIC EPIC

मतदाराचे नाव     सारंग मेघशाम महल्ले
Elector's Name   Sarang Meghsham
                 Mahalle
वडिलांचे नाव     : मेघशाम महल्ले
Father's Name    Meghsham Mahalle

--- BACK DOCUMENT ---
लिंग / Sex : पुरुष / Male    XLP6993596
जन्म तारीख / Date of Birth : 05/05/1997

पत्ता : 1925, वैशाली नगर वर्धा, म्हसाळा तालुका - वर्धा, जिल्हा - वर्धा
(महाराष्ट्र) - 442001

Address: 1925, Vaishali Nagar Wardha MHSALA, Teh -
Wardha, Dist - Wardha (MH) - 442001

Date : 11/02/2019
मतदार नोंदणी अधिकारी
Electoral Registration Officer
विधानसभा मतदारसंघा करीता - 47 - वर्धा
Assembly Constituency - 47 - Wardha
भाग क्रमांक व नाव - 162 - म्हसाळा
Part No. & Name - 162 - Mhasala
"""
show("USER VOTER ID TEST:", parse_indian_id_text(user_voter_text))

# TEST 9: Real Nepal Passport (From User's Photo)
user_passport_text = """
--- FRONT DOCUMENT ---
नेपाल NEPAL
राहदानी | PASSPORT
प्रकार | TYPE: P
मुलुक सङ्केत | COUNTRY CODE: NPL
राहदानी नं. | PASSPORT NO.: PA1661661
थर | SURNAME: BHAGAT
नाम | GIVEN NAMES: ANUSHKA
राष्ट्रियता | NATIONALITY: NEPALI
व्यक्तिगत नं. | PERSONAL NO.: 16017703306
लिङ्ग | SEX: F
जारी मिति | DATE OF ISSUE: 07 JUN 2023
जन्म मिति | DATE OF BIRTH: 30 OCT 2003
म्याद सकिने मिति | DATE OF EXPIRY: 06 JUN 2033
जन्मस्थान | PLACE OF BIRTH: SAPTARI
जारी गर्ने निकाय | ISSUING AUTHORITY: MOFA, DEPARTMENT OF PASSPORTS

P<NPLBHAGAT<<ANUSHKA<<<<<<<<<<<<<<<<<<<<<<<
PA16616618NPL0310309F330606816017703306<<00
"""
show("USER PASSPORT TEST:", parse_indian_id_text(user_passport_text))

# TEST 10: Real Nepal Passport with Top Emergency Page (From User's Photo)
user_passport_full = """
--- FRONT DOCUMENT ---
पुराणों राहदानी नं. | OLD PASSPORT NO.
जारी मिति र स्थान | DATE AND PLACE OF ISSUE
जरूरी परेमा सम्पर्क गर्ने विवरण / CONTACT DETAILS IN CASE OF EMERGENCY
नाम | NAME: BHAGAT, LOKENDRA KUMAR
ठेगाना | ADDRESS: NARADEVI, KATHMANDU METROPOLITAN CITY 18, KATHMANDU
टेलिफोन नं. | TELEPHONE NO.

नेपाल NEPAL
राहदानी | PASSPORT
प्रकार | TYPE: P
मुलुक सङ्केत | COUNTRY CODE: NPL
राहदानी नं. | PASSPORT NO.: PA1661661
थर | SURNAME: BHAGAT
नाम | GIVEN NAMES: ANUSHKA
व्यक्तिगत नं. | PERSONAL NO.: 16017703306
लिङ्ग | SEX: F
जारी मिति | DATE OF ISSUE: 07 JUN 2023
जन्म मिति | DATE OF BIRTH: 30 OCT 2003
म्याद सकिने मिति | DATE OF EXPIRY: 06 JUN 2033
जन्मस्थान | PLACE OF BIRTH: SAPTARI
जारी गर्ने निकाय | ISSUING AUTHORITY: MOFA, DEPARTMENT OF PASSPORTS

P<NPLBHAGAT<<ANUSHKA<<<<<<<<<<<<<<<<<<<<<<<
PA16616618NPL0310309F330606816017703306<<00
"""
show("USER FULL PASSPORT TEST:", parse_indian_id_text(user_passport_full))



