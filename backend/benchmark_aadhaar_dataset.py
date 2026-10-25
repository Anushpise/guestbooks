"""
benchmark_aadhaar_dataset.py

Comprehensive Evaluation, Testing & Diagnostic Harness for Indian ID Card Extraction.
Iterates over the hotel Aadhaar card dataset, tests full extraction accuracy for:
- Document Type
- ID Document Number
- Full Guest Name
- Date of Birth & Calculated Age
- Gender
- Permanent Address
- City & State
- Pincode
- Mobile Number (where present)

Usage:
    python benchmark_aadhaar_dataset.py --sample 15
    python benchmark_aadhaar_dataset.py --file "c:/Users/anshu/private/hotel/hotel adharcards/IMG_20260903_162818.jpg.jpeg"
    python benchmark_aadhaar_dataset.py --pairs-only --sample 10
"""

import os
import sys
import re
import json
import time
import argparse
from pathlib import Path
from collections import defaultdict

# Add backend directory to sys.path
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from app.services.paddle_ocr import get_paddle_engine
from app.services.indian_id_parser import parse_indian_id_text


def find_dataset_dir() -> Path:
    candidates = [
        Path(r"c:\Users\anshu\private\hotel\hotel adharcards"),
        CURRENT_DIR.parent / "hotel adharcards",
        CURRENT_DIR / "hotel adharcards",
    ]
    for c in candidates:
        if c.exists() and c.is_dir():
            return c
    raise FileNotFoundError("Could not locate 'hotel adharcards' directory.")


def group_files_into_pairs(files: list[Path]) -> list[dict]:
    """
    Intelligently groups image files into logical check-in documents:
    1. WhatsApp consecutive images (e.g., at 21.43.31 and 21.43.32) -> 2-sided pair.
    2. Camera photos (e.g. IMG_20260903_162818 and 162839) -> front + back pair.
    3. Standalone single images / e-Aadhaar letters.
    """
    # Sort files
    sorted_files = sorted(files, key=lambda f: f.name)
    
    # Filter only image files
    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    img_files = [f for f in sorted_files if f.suffix.lower() in valid_exts and f.stat().st_size > 1000]

    paired = []
    used = set()

    for i in range(len(img_files)):
        if i in used:
            continue

        f1 = img_files[i]
        n1 = f1.stem

        # Look for sibling in next few images
        partner_idx = None
        for j in range(i + 1, min(len(img_files), i + 4)):
            if j in used:
                continue
            f2 = img_files[j]
            n2 = f2.stem

            # WhatsApp pairing: "WhatsApp Image 2026-10-06 at 21.43.31" vs "21.43.32"
            wa_m1 = re.search(r'(\d{4}-\d{2}-\d{2}\s+at\s+\d{2}\.\d{2}\.)(\d{2})', n1)
            wa_m2 = re.search(r'(\d{4}-\d{2}-\d{2}\s+at\s+\d{2}\.\d{2}\.)(\d{2})', n2)
            if wa_m1 and wa_m2 and wa_m1.group(1) == wa_m2.group(1):
                sec1 = int(wa_m1.group(2))
                sec2 = int(wa_m2.group(2))
                if abs(sec2 - sec1) <= 15:
                    partner_idx = j
                    break

            # Camera pairing: "IMG_20260903_162818" vs "IMG_20260903_162839"
            cam_m1 = re.search(r'IMG_(\d{8})_(\d{6})', n1)
            cam_m2 = re.search(r'IMG_(\d{8})_(\d{6})', n2)
            if cam_m1 and cam_m2 and cam_m1.group(1) == cam_m2.group(1):
                partner_idx = j
                break

        if partner_idx is not None:
            paired.append({
                "type": "pair",
                "label": f"{f1.name} + {img_files[partner_idx].name}",
                "front": f1,
                "back": img_files[partner_idx]
            })
            used.add(i)
            used.add(partner_idx)
        else:
            paired.append({
                "type": "single",
                "label": f1.name,
                "front": f1,
                "back": None
            })
            used.add(i)

    return paired


def evaluate_record(parsed: dict) -> dict:
    """Evaluates field quality scores and validation flags."""
    checks = {}

    # 1. ID Number
    id_num = (parsed.get("idNumber") or "").strip()
    digits = re.sub(r'\D', '', id_num)
    checks["id_number"] = bool(
        (len(digits) == 12 and parsed.get("idType") == "Aadhaar Card") or
        (len(id_num) == 10 and parsed.get("idType") == "PAN Card") or
        (len(id_num) >= 8 and parsed.get("idType") in ("Voter ID", "Passport", "Driving License"))
    )

    # 2. Name
    name = (parsed.get("name") or "").strip()
    checks["name"] = bool(name and len(name.split()) >= 2 and not re.search(r'\b(?:GOVT|INDIA|AADHAAR|TAX|DOB|CARD|MALE|FEMALE)\b', name, re.I))

    # 3. DOB & Age
    dob = (parsed.get("dob") or "").strip()
    age = (parsed.get("age") or "").strip()
    checks["dob"] = bool(re.match(r'^\d{2}/\d{2}/\d{4}$', dob))
    checks["age"] = bool(age and age.isdigit() and 10 <= int(age) <= 110)

    # 4. Gender
    gender = (parsed.get("gender") or "").strip()
    checks["gender"] = gender in ("Male", "Female", "Other")

    # 5. Address
    address = (parsed.get("address") or "").strip()
    checks["address"] = bool(len(address) >= 15 and not address.startswith("PIN Code:"))

    # 6. City
    city = (parsed.get("city") or "").strip()
    checks["city"] = bool(city and len(city) >= 3 and city.upper() not in ("INDIA", "MAHARASHTRA", "DELHI", "STATE"))

    # 7. Pincode
    pincode = (parsed.get("pincode") or "").strip()
    checks["pincode"] = bool(re.match(r'^[1-9]\d{5}$', pincode))

    # 8. Phone (optional bonus)
    phone = (parsed.get("phone") or "").strip()
    checks["phone"] = bool(re.match(r'^[6-9]\d{9}$', phone))

    return checks


def run_benchmark(sample_size: int = 20, pairs_only: bool = False, specific_file: str = None):
    dataset_dir = find_dataset_dir()
    print(f"[*] Dataset Directory: {dataset_dir}")

    engine = get_paddle_engine()

    if specific_file:
        p = Path(specific_file)
        if not p.is_absolute():
            p = dataset_dir / specific_file
        if not p.exists():
            print(f"[ERROR] Specified file not found: {p}")
            return
        records = [{"type": "single", "label": p.name, "front": p, "back": None}]
    else:
        all_files = list(dataset_dir.iterdir())
        all_pairs = group_files_into_pairs(all_files)
        
        if pairs_only:
            records = [r for r in all_pairs if r["type"] == "pair"]
        else:
            # Prioritize pairs first, then singles
            pairs = [r for r in all_pairs if r["type"] == "pair"]
            singles = [r for r in all_pairs if r["type"] == "single"]
            records = pairs + singles

        if sample_size and sample_size > 0:
            records = records[:sample_size]

    total = len(records)
    print(f"[*] Commencing benchmark on {total} document sample(s)...\n" + "=" * 80)

    results = []
    field_totals = defaultdict(int)

    for idx, rec in enumerate(records, 1):
        t0 = time.time()
        front_path = rec["front"]
        back_path = rec["back"]

        # Run OCR
        try:
            with open(front_path, "rb") as f:
                f_bytes = f.read()
            f_text = engine.extract_text_from_bytes(f_bytes)
        except Exception as e:
            f_text = ""
            print(f"[-] OCR failed on {front_path.name}: {e}")

        b_text = ""
        if back_path:
            try:
                with open(back_path, "rb") as f:
                    b_bytes = f.read()
                b_text = engine.extract_text_from_bytes(b_bytes)
            except Exception as e:
                print(f"[-] OCR failed on {back_path.name}: {e}")

        # Combine text
        combined = ""
        if f_text:
            combined += "--- FRONT DOCUMENT ---\n" + f_text
        if b_text:
            combined += "\n--- BACK DOCUMENT ---\n" + b_text

        # Parse fields
        parsed = parse_indian_id_text(combined)
        duration = time.time() - t0

        checks = evaluate_record(parsed)
        for k, v in checks.items():
            if v:
                field_totals[k] += 1

        results.append({
            "idx": idx,
            "label": rec["label"],
            "parsed": parsed,
            "checks": checks,
            "duration": duration,
        })

        # Single line summary
        def mark(c): return "PASS" if c else "FAIL"
        print(f"[{idx:02d}/{total:02d}] {rec['label'][:42]:<42} | "
              f"ID: {mark(checks['id_number'])} | "
              f"Name: {mark(checks['name']):<4} ({parsed.get('name', '')[:14]:<14}) | "
              f"Age: {mark(checks['age'])} ({parsed.get('age', '-'):<2}) | "
              f"Addr: {mark(checks['address'])} | "
              f"City: {mark(checks['city']):<4} | "
              f"{duration:.2f}s")

    print("\n" + "=" * 80)
    print(f" BENCHMARK ACCURACY SUMMARY (Total Documents Tested: {total})")
    print("=" * 80)
    for field in ["id_number", "name", "dob", "age", "gender", "address", "city", "pincode", "phone"]:
        passed = field_totals[field]
        pct = (passed / total) * 100 if total > 0 else 0
        bar = "#" * int(pct // 5) + "-" * (20 - int(pct // 5))
        print(f"  {field.capitalize():<12} : {passed:3d}/{total:3d} ({pct:5.1f}%) [{bar}]")
    print("=" * 80)

    # Save detailed JSON report
    report_file = CURRENT_DIR / "benchmark_report.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"[+] Full Diagnostic Log exported to: {report_file}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Benchmark Aadhaar OCR Extraction")
    parser.add_argument("--sample", type=int, default=10, help="Number of documents to test")
    parser.add_argument("--pairs-only", action="store_true", help="Only test 2-sided document pairs")
    parser.add_argument("--file", type=str, default=None, help="Test a single specific file")
    args = parser.parse_args()

    run_benchmark(sample_size=args.sample, pairs_only=args.pairs_only, specific_file=args.file)

