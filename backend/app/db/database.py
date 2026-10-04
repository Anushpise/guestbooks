"""
database.py - PostgreSQL & SQLite Dual Support Database for Guestbooks
Manages guest registrations, uploaded documents (front/back), and digital signatures.
Supports PostgreSQL (via DATABASE_URL environment variable) and fallback SQLite.
"""

import os
import json
import sqlite3
from datetime import datetime
import logging

logger = logging.getLogger("guestbooks_db")

DATABASE_URL = os.getenv("DATABASE_URL")

USE_POSTGRES = False
if DATABASE_URL and (DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://")):
    try:
        import psycopg2
        import psycopg2.extras
        USE_POSTGRES = True
        logger.info("Using PostgreSQL database.")
    except ImportError:
        logger.warning("DATABASE_URL found but psycopg2 is not installed. Falling back to SQLite.")

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "guestbooks.db")

def get_db_connection():
    if USE_POSTGRES:
        try:
            conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
            return conn, "postgres"
        except Exception as e:
            if "does not exist" in str(e):
                try:
                    default_url = DATABASE_URL.rsplit('/', 1)[0] + '/postgres'
                    dbname = DATABASE_URL.rsplit('/', 1)[1]
                    tmp_conn = psycopg2.connect(default_url)
                    tmp_conn.autocommit = True
                    tmp_cursor = tmp_conn.cursor()
                    tmp_cursor.execute(f'CREATE DATABASE "{dbname}";')
                    tmp_conn.close()
                    conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
                    return conn, "postgres"
                except Exception as inner_e:
                    logger.error(f"Error auto-creating database: {inner_e}")
                    raise e
            raise e
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn, "sqlite"

def execute_query(conn, db_type, query, params=()):
    """Executes query handling placeholder differences ('?' for SQLite vs '%s' for Postgres)."""
    cursor = conn.cursor()
    if db_type == "postgres":
        pg_query = query.replace("?", "%s")
        cursor.execute(pg_query, params)
    else:
        cursor.execute(query, params)
    return cursor

def init_db():
    """Initializes the database tables if they do not exist."""
    conn, db_type = get_db_connection()
    cursor = conn.cursor()
    
    if db_type == "postgres":
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS guest_records (
                id SERIAL PRIMARY KEY,
                reg_no VARCHAR(100) UNIQUE NOT NULL,
                created_at VARCHAR(100) NOT NULL,
                room_number VARCHAR(50) NOT NULL,
                stay_type VARCHAR(100),
                room_rate NUMERIC,
                advance_paid NUMERIC,
                payment_mode VARCHAR(50),
                guest_name VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                id_type VARCHAR(50),
                id_number VARCHAR(100),
                dob VARCHAR(50),
                age INT,
                gender VARCHAR(20),
                address TEXT,
                city VARCHAR(100),
                pincode VARCHAR(20),
                coming_from VARCHAR(100),
                going_to VARCHAR(100),
                purpose VARCHAR(255),
                vehicle_no VARCHAR(50),
                accompanying_guest_json TEXT,
                document_front TEXT,
                document_back TEXT,
                signature TEXT,
                status VARCHAR(50) DEFAULT 'CHECKED_IN',
                checked_out_at VARCHAR(100),
                hotel_id VARCHAR(100) DEFAULT 'HTL-101'
            )
        """)
        try:
            execute_query(conn, db_type, "ALTER TABLE guest_records ADD COLUMN hotel_id VARCHAR(100) DEFAULT 'HTL-101'")
        except Exception:
            pass
        conn.commit()
        conn.close()
        logger.info("PostgreSQL database initialized successfully.")
    else:
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
                checked_out_at TEXT,
                hotel_id TEXT DEFAULT 'HTL-101'
            )
        """)
        try:
            cursor.execute("ALTER TABLE guest_records ADD COLUMN hotel_id TEXT DEFAULT 'HTL-101'")
        except Exception:
            pass
        conn.commit()
        conn.close()
        logger.info(f"SQLite database initialized successfully at {DB_PATH}")

def create_guest_record(data: dict) -> dict:
    """
    Inserts a new guest check-in record in strict sequence.
    Generates a sequential reg_no (e.g. REG-0001, REG-0002).
    """
    conn, db_type = get_db_connection()

    cursor = execute_query(conn, db_type, "SELECT COALESCE(MAX(id), 0) + 1 FROM guest_records")
    row = cursor.fetchone()
    next_id = row[0] if isinstance(row, (tuple, list)) else list(row.values())[0]
    
    reg_no = f"REG-{next_id:04d}"
    created_at = datetime.now().isoformat()

    primary = data.get("primaryGuest", {})
    accompanying = data.get("accompanyingGuest")
    accompanying_json = json.dumps(accompanying) if accompanying else None
    hotel_id = str(data.get("hotelId") or data.get("hotel_id") or "HTL-101")

    query = """
        INSERT INTO guest_records (
            id, reg_no, created_at, room_number, stay_type,
            room_rate, advance_paid, payment_mode, guest_name,
            phone, id_type, id_number, dob, age, gender,
            address, city, pincode, coming_from, going_to,
            purpose, vehicle_no, accompanying_guest_json,
            document_front, document_back, signature, status, hotel_id
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, 'CHECKED_IN', ?
        )
    """
    params = (
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
        data.get("signature", ""),
        hotel_id
    )

    execute_query(conn, db_type, query, params)
    conn.commit()

    c2 = execute_query(conn, db_type, "SELECT * FROM guest_records WHERE id = ?", (next_id,))
    row = c2.fetchone()
    record = dict(row)
    conn.close()
    return record

def get_all_guest_records(search=None, hotel_id=None, limit=100, offset=0) -> list:
    """Returns all guest check-in records in sequence, optionally filtered by hotel_id and search query."""
    conn, db_type = get_db_connection()
    like_op = "ILIKE" if db_type == "postgres" else "LIKE"

    conditions = []
    params = []

    if hotel_id and hotel_id != "ALL":
        conditions.append("(hotel_id = ? OR hotel_id IS NULL)")
        params.append(hotel_id)

    if search:
        q_param = f"%{search}%"
        conditions.append(f"(guest_name {like_op} ? OR phone {like_op} ? OR id_number {like_op} ? OR reg_no {like_op} ? OR room_number {like_op} ?)")
        params.extend([q_param, q_param, q_param, q_param, q_param])

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    query = f"""
        SELECT id, reg_no, created_at, room_number, stay_type, room_rate, advance_paid,
               payment_mode, guest_name, phone, id_type, id_number, address, city, pincode,
               status, checked_out_at, hotel_id,
               document_front, document_back, signature,
               (CASE WHEN document_front IS NOT NULL AND document_front != '' THEN 1 ELSE 0 END) as has_doc_front,
               (CASE WHEN document_back IS NOT NULL AND document_back != '' THEN 1 ELSE 0 END) as has_doc_back,
               (CASE WHEN signature IS NOT NULL AND signature != '' THEN 1 ELSE 0 END) as has_signature
        FROM guest_records
        {where_clause}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])

    cursor = execute_query(conn, db_type, query, tuple(params))
    rows = cursor.fetchall()
    records = [dict(r) for r in rows]
    conn.close()
    return records

def get_guest_record_by_id(record_id: int) -> dict:
    """Returns single complete guest record including documents and signature."""
    conn, db_type = get_db_connection()
    cursor = execute_query(conn, db_type, "SELECT * FROM guest_records WHERE id = ?", (record_id,))
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
    conn, db_type = get_db_connection()
    now = datetime.now().isoformat()
    if str(room_or_id).isdigit() and len(str(room_or_id)) > 3:
        cursor = execute_query(conn, db_type, "UPDATE guest_records SET status = 'CHECKED_OUT', checked_out_at = ? WHERE id = ?", (now, int(room_or_id)))
    else:
        cursor = execute_query(conn, db_type, "UPDATE guest_records SET status = 'CHECKED_OUT', checked_out_at = ? WHERE room_number = ? AND status = 'CHECKED_IN'", (now, str(room_or_id)))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0

