import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.indian_id_parser import parse_indian_id_text

def test_vijay_bhopalkar():
    t1 = """
Unique Identification Authority of India
Enrollment No. : 2722/23658/103441 /P
To,
Vijay Bhopalkar
Indira Gandhi Chowk,
Vtc: Devpayli,
Po: Balapur,
District: Chandrapur,
Maharashtra, PIN Code: 441221,
Kf897138046fi
Ant Stu, Ay Gea, Ae Bht, Ora Pare Ate

5917 8160 4322
Government of India
विजय भोपालकर
| Vijay Bhopalkar
तारीख / DOB : 05/08/2005
पुरुष / Male
5917 8160 4322
"""
    r1 = parse_indian_id_text(t1)
    print("Vijay Bhopalkar:", {k: v for k, v in r1.items() if k != 'rawText'})
    assert r1['name'] == 'Vijay Bhopalkar', f"Name mismatch: {r1['name']}"
    assert r1['idNumber'] == '5917 8160 4322', f"ID mismatch: {r1['idNumber']}"
    assert r1['dob'] == '05/08/2005', f"DOB mismatch: {r1['dob']}"
    assert r1['age'] == '21', f"Age mismatch: {r1['age']}"
    assert r1['gender'] == 'Male', f"Gender mismatch: {r1['gender']}"
    assert '441221' in r1['address'], f"Address missing pincode: {r1['address']}"
    assert 'Kf897138046fi' not in r1['address'], f"Garbage in address: {r1['address']}"
    assert r1['city'] == 'Chandrapur', f"City mismatch: {r1['city']}"
    assert r1['pincode'] == '441221', f"Pincode mismatch: {r1['pincode']}"
    print("TEST 1: PASS")

def test_shamal_bhongade():
    t2 = """
--- FRONT DOCUMENT ---
Government of India
भारत सरकार
शामल प्रेमानंद भोंगाडे
Shamal Premanand Bhongade
जन्म तारीख / DOB : 21/07/2002
महिला / FEMALE
आधार हा ओळखीचा पुरावा आहे
SRE eRe er so
5459 7034 8836

--- BACK DOCUMENT ---
Unique Identification Authority of India
Ralegaon, Ta. Ralegaon, Ralegaon, PO: Ralegaon,
DIST: Yavatmal,
Maharashtra - 445402
5459 7034 8836
VID : 9147 2258 9004 8656
1947 | help@uidai.gov.in
"""
    r2 = parse_indian_id_text(t2)
    print("Shamal Bhongade:", {k: v for k, v in r2.items() if k != 'rawText'})
    assert r2['name'] == 'Shamal Premanand Bhongade', f"Name mismatch: {r2['name']}"
    assert r2['idNumber'] == '5459 7034 8836', f"ID mismatch: {r2['idNumber']}"
    assert r2['dob'] == '21/07/2002', f"DOB mismatch: {r2['dob']}"
    assert r2['gender'] == 'Female', f"Gender mismatch: {r2['gender']}"
    assert 'SRE eRe er so' not in r2['address'], f"Front noise in address: {r2['address']}"
    assert 'Ralegaon' in r2['address'], f"Address missing Ralegaon: {r2['address']}"
    assert r2['city'] == 'Yavatmal', f"City mismatch: {r2['city']}"
    assert r2['pincode'] == '445402', f"Pincode mismatch: {r2['pincode']}"
    print("TEST 2: PASS")

def test_sandhya_barhane():
    t3 = """
--- FRONT DOCUMENT ---
SIXT GAIL
Government of India
Enrollment No: 2006/32207/0472
Diliprao Barhane
2594 1897 9713
Sandhya Diliprao Barhane
DOB : 19/08/1975
Female

--- BACK DOCUMENT ---
Unique Identification Authority of India
Address:
Ward NO 4, Vidhya Lay Out, Near Mude Town Wardha,
Wardha, Maharashtra - 442001
2594 1897 9713
VID : 9199 6968 4475 3493
"""
    r3 = parse_indian_id_text(t3)
    print("Sandhya Barhane:", {k: v for k, v in r3.items() if k != 'rawText'})
    assert r3['name'] == 'Sandhya Diliprao Barhane', f"Name mismatch: {r3['name']}"
    assert r3['idNumber'] == '2594 1897 9713', f"ID mismatch: {r3['idNumber']}"
    assert r3['dob'] == '19/08/1975', f"DOB mismatch: {r3['dob']}"
    assert r3['age'] == '51', f"Age mismatch: {r3['age']}"
    assert r3['gender'] == 'Female', f"Gender mismatch: {r3['gender']}"
    assert 'Ward NO 4' in r3['address'] or 'Vidhya' in r3['address'], f"Address mismatch: {r3['address']}"
    assert r3['city'] == 'Wardha', f"City mismatch: {r3['city']}"
    assert r3['pincode'] == '442001', f"Pincode mismatch: {r3['pincode']}"
    print("TEST 3: PASS")

if __name__ == '__main__':
    test_vijay_bhopalkar()
    test_shamal_bhongade()
    test_sandhya_barhane()
    print("\nALL PRECISION TESTS PASSED PERFECTLY!")
