"""
database.py - SQLite Sequential Database for Hotel PMS
Manages guest registrations, uploaded documents (front/back), and digital signatures.
Provides strictly sequential registration numbers (REG-0001, REG-0002, etc.).
"""

import sqlite3
import os
import json
from datetime import datetime
import logging

logger = logging.getLogger("hotel_db")

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "hotel_pms.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the SQLite tables if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS guest_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reg_no TEXT UNIQUE NOT NULL,
            created_at TEXT NOT NULL,
            room_number TEXT NOT NULL,
            stay_type TEXT,
            room_rate REAL,
            advance_paid REAL,
            payment_mode TEXT,
            guest_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            id_type TEXT,
            id_number TEXT,
            dob TEXT,
            age INTEGER,
            gender TEXT,
            address TEXT,
            city TEXT,
            pincode TEXT,
            coming_from TEXT,
            going_to TEXT,
            purpose TEXT,
            vehicle_no TEXT,
            accompanying_guest_json TEXT,
            document_front TEXT,
            document_back TEXT,
            signature TEXT,
            status TEXT DEFAULT 'CHECKED_IN',
            checked_out_at TEXT
        )
    """)
    conn.commit()
    conn.close()
    logger.info(f"Database initialized successfully at {DB_PATH}")

def create_guest_record(data: dict) -> dict:
    """
    Inserts a new guest check-in record in strict sequence.
    Generates a sequential reg_no (e.g. REG-0001, REG-0002).
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Determine next sequential ID
    cursor.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM guest_records")
    next_id = cursor.fetchone()[0]
    reg_no = f"REG-{next_id:04d}"
    created_at = datetime.now().isoformat()

    primary = data.get("primaryGuest", {})
    accompanying = data.get("accompanyingGuest")
    accompanying_json = json.dumps(accompanying) if accompanying else None

    cursor.execute("""
        INSERT INTO guest_records (
            id, reg_no, created_at, room_number, stay_type,
            room_rate, advance_paid, payment_mode, guest_name,
            phone, id_type, id_number, dob, age, gender,
            address, city, pincode, coming_from, going_to,
            purpose, vehicle_no, accompanying_guest_json,
            document_front, document_back, signature, status
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, 'CHECKED_IN'
        )
    """, (
        next_id,
        reg_no,
        created_at,
        str(data.get("roomNumber", "")),
        data.get("stayType", "24 Hours Full Stay"),
        float(data.get("roomRate", 0.0)),
        float(data.get("advancePaid", 0.0)),
        data.get("paymentMode", "Cash"),
        primary.get("name", "Unknown Guest"),
        primary.get("phone", ""),
        primary.get("idType", ""),
        primary.get("idNumber", ""),
        primary.get("dob", ""),
        int(primary.get("age", 0)) if primary.get("age") else None,
        primary.get("gender", ""),
        primary.get("address", ""),
        primary.get("city", ""),
        primary.get("pincode", ""),
        data.get("comingFrom", ""),
        data.get("goingTo", ""),
        data.get("purpose", ""),
        data.get("vehicleNo", ""),
        accompanying_json,
        data.get("documentFront", ""),
        data.get("documentBack", ""),
        data.get("signature", "")
    ))
    conn.commit()

    cursor.execute("SELECT * FROM guest_records WHERE id = ?", (next_id,))
    row = cursor.fetchone()
    record = dict(row)
    conn.close()
    return record

def get_all_guest_records(search=None, limit=100, offset=0) -> list:
    """Returns all guest check-in records in sequence."""
    conn = get_db_connection()
    cursor = conn.cursor()
    if search:
        query = f"%{search}%"
        cursor.execute("""
            SELECT id, reg_no, created_at, room_number, stay_type, room_rate, advance_paid,
                   payment_mode, guest_name, phone, id_type, id_number, address, city, pincode,
                   status, checked_out_at,
                   (CASE WHEN document_front IS NOT NULL AND document_front != '' THEN 1 ELSE 0 END) as has_doc_front,
                   (CASE WHEN document_back IS NOT NULL AND document_back != '' THEN 1 ELSE 0 END) as has_doc_back,
                   (CASE WHEN signature IS NOT NULL AND signature != '' THEN 1 ELSE 0 END) as has_signature
            FROM guest_records
            WHERE guest_name LIKE ? OR phone LIKE ? OR id_number LIKE ? OR reg_no LIKE ? OR room_number LIKE ?
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        """, (query, query, query, query, query, limit, offset))
    else:
        cursor.execute("""
            SELECT id, reg_no, created_at, room_number, stay_type, room_rate, advance_paid,
                   payment_mode, guest_name, phone, id_type, id_number, address, city, pincode,
                   status, checked_out_at,
                   (CASE WHEN document_front IS NOT NULL AND document_front != '' THEN 1 ELSE 0 END) as has_doc_front,
                   (CASE WHEN document_back IS NOT NULL AND document_back != '' THEN 1 ELSE 0 END) as has_doc_back,
                   (CASE WHEN signature IS NOT NULL AND signature != '' THEN 1 ELSE 0 END) as has_signature
            FROM guest_records
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        """, (limit, offset))

    rows = cursor.fetchall()
    records = [dict(r) for r in rows]
    conn.close()
    return records

def get_guest_record_by_id(record_id: int) -> dict:
    """Returns single complete guest record including documents and signature."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM guest_records WHERE id = ?", (record_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    record = dict(row)
    if record.get("accompanying_guest_json"):
        try:
            record["accompanying_guest"] = json.loads(record["accompanying_guest_json"])
        except:
            record["accompanying_guest"] = None
    return record

def checkout_guest_in_db(room_or_id: str) -> bool:
    """Marks a guest record as checked out."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    if str(room_or_id).isdigit() and len(str(room_or_id)) > 3:
        # Probable ID
        cursor.execute("UPDATE guest_records SET status = 'CHECKED_OUT', checked_out_at = ? WHERE id = ?", (now, int(room_or_id)))
    else:
        cursor.execute("UPDATE guest_records SET status = 'CHECKED_OUT', checked_out_at = ? WHERE room_number = ? AND status = 'CHECKED_IN'", (now, str(room_or_id)))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0
