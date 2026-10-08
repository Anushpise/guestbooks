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
                hotel_id VARCHAR(100) DEFAULT 'HTL-101',
                partner_document_front TEXT,
                partner_document_back TEXT,
                checkout_signature TEXT
            )
        """)
        for col_def in [
            ("hotel_id", "VARCHAR(100) DEFAULT 'HTL-101'"),
            ("partner_document_front", "TEXT"),
            ("partner_document_back", "TEXT"),
            ("checkout_signature", "TEXT")
        ]:
            try:
                execute_query(conn, db_type, f"ALTER TABLE guest_records ADD COLUMN {col_def[0]} {col_def[1]}")
            except Exception:
                pass

        # PostgreSQL: Hotels Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS hotels (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                owner_name VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(50),
                address TEXT,
                area VARCHAR(255),
                property_type VARCHAR(100),
                subscription_plan VARCHAR(255),
                subscription_amount NUMERIC DEFAULT 499,
                status VARCHAR(50) DEFAULT 'PENDING',
                reg_number VARCHAR(100),
                total_rooms INT DEFAULT 15,
                occupied_rooms INT DEFAULT 0,
                star_rating VARCHAR(50) DEFAULT '3 Star',
                documents_json TEXT,
                registered_at VARCHAR(100),
                approved_at VARCHAR(100),
                rejected_at VARCHAR(100)
            )
        """)

        # PostgreSQL: Users Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(100) PRIMARY KEY,
                email VARCHAR(255),
                username VARCHAR(100),
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                role VARCHAR(50) NOT NULL,
                hotel_id VARCHAR(100),
                station_name VARCHAR(255),
                jurisdiction VARCHAR(255),
                created_at VARCHAR(100)
            )
        """)

        # PostgreSQL: Police Accounts Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS police_accounts (
                id VARCHAR(100) PRIMARY KEY,
                user_id VARCHAR(100),
                station_name VARCHAR(255),
                officer_name VARCHAR(255),
                badge_no VARCHAR(100),
                email VARCHAR(255),
                username VARCHAR(100),
                jurisdiction VARCHAR(255),
                created_at VARCHAR(100)
            )
        """)
        conn.commit()
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
                hotel_id TEXT DEFAULT 'HTL-101',
                partner_document_front TEXT,
                partner_document_back TEXT,
                checkout_signature TEXT
            )
        """)
        for col_def in [
            ("hotel_id", "TEXT DEFAULT 'HTL-101'"),
            ("partner_document_front", "TEXT"),
            ("partner_document_back", "TEXT"),
            ("checkout_signature", "TEXT")
        ]:
            try:
                cursor.execute(f"ALTER TABLE guest_records ADD COLUMN {col_def[0]} {col_def[1]}")
            except Exception:
                pass

        # SQLite: Hotels Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS hotels (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                owner_name TEXT,
                email TEXT,
                phone TEXT,
                address TEXT,
                area TEXT,
                property_type TEXT,
                subscription_plan TEXT,
                subscription_amount REAL DEFAULT 499,
                status TEXT DEFAULT 'PENDING',
                reg_number TEXT,
                total_rooms INTEGER DEFAULT 15,
                occupied_rooms INTEGER DEFAULT 0,
                star_rating TEXT DEFAULT '3 Star',
                documents_json TEXT,
                registered_at TEXT,
                approved_at TEXT,
                rejected_at TEXT
            )
        """)

        # SQLite: Users Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT,
                username TEXT,
                password TEXT NOT NULL,
                name TEXT,
                role TEXT NOT NULL,
                hotel_id TEXT,
                station_name TEXT,
                jurisdiction TEXT,
                created_at TEXT
            )
        """)

        # SQLite: Police Accounts Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS police_accounts (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                station_name TEXT,
                officer_name TEXT,
                badge_no TEXT,
                email TEXT,
                username TEXT,
                jurisdiction TEXT,
                created_at TEXT
            )
        """)
        conn.commit()

    # Seed Default Records if missing
    _seed_default_data(conn, db_type)
    conn.close()
    logger.info("Database initialized with hotels, users, and guest records.")

def _seed_default_data(conn, db_type):
    """Seeds default admin, initial hotel, and police station if not present."""
    # Seed default Admin
    c = execute_query(conn, db_type, "SELECT COUNT(*) FROM users WHERE email = ?", ("admin@guestbooks.com",))
    if c.fetchone()[0] == 0:
        execute_query(conn, db_type, """
            INSERT INTO users (id, email, username, password, name, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            "USR-ADMIN-1",
            "admin@guestbooks.com",
            "admin",
            "admin123",
            "Super System Administrator",
            "ADMIN",
            "2026-09-01T09:00:00.000Z"
        ))

    # Seed default Hotel
    c = execute_query(conn, db_type, "SELECT COUNT(*) FROM hotels WHERE id = ?", ("HTL-101",))
    if c.fetchone()[0] == 0:
        docs = json.dumps([
            {"name": "Trade_License_2026.pdf", "size": "1.2 MB", "type": "PDF"},
            {"name": "Owner_Aadhaar_Scan.pdf", "size": "850 KB", "type": "PDF"}
        ])
        execute_query(conn, db_type, """
            INSERT INTO hotels (
                id, name, owner_name, email, phone, address, area,
                property_type, subscription_plan, subscription_amount, status,
                reg_number, total_rooms, occupied_rooms, star_rating, documents_json,
                registered_at, approved_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "HTL-101",
            "Guestbooks Hotel Management & Lodge",
            "NexOpps Hospitality",
            "hotel@guestbooks.com",
            "9876543210",
            "102 MG Road, Sector 14, Metro City",
            "Metro Division Sector 4",
            "Boutique Hotel & Lodge",
            "Guestbooks Standard Plan (₹499/month)",
            499.0,
            "APPROVED",
            "HTL-MH-2026-9041",
            15,
            0,
            "3 Star",
            docs,
            "2026-09-01T10:00:00.000Z",
            "2026-09-01T11:30:00.000Z"
        ))

    # Seed default Hotel user
    c = execute_query(conn, db_type, "SELECT COUNT(*) FROM users WHERE email = ?", ("hotel@guestbooks.com",))
    if c.fetchone()[0] == 0:
        execute_query(conn, db_type, """
            INSERT INTO users (id, email, username, password, name, role, hotel_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "USR-HOTEL-1",
            "hotel@guestbooks.com",
            "hotel",
            "hotel123",
            "Guestbooks Hotel Management & Lodge",
            "HOTEL",
            "HTL-101",
            "2026-09-01T10:00:00.000Z"
        ))

    # Seed default Police user & police account
    c = execute_query(conn, db_type, "SELECT COUNT(*) FROM users WHERE email = ?", ("police@station.gov.in",))
    if c.fetchone()[0] == 0:
        execute_query(conn, db_type, """
            INSERT INTO users (id, email, username, password, name, role, station_name, jurisdiction, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "USR-POLICE-1",
            "police@station.gov.in",
            "police",
            "police123",
            "Inspector V. K. Sharma",
            "POLICE",
            "Central City Police Station",
            "Metro Division 4",
            "2026-09-01T09:00:00.000Z"
        ))
        execute_query(conn, db_type, """
            INSERT INTO police_accounts (id, user_id, station_name, officer_name, badge_no, email, username, jurisdiction, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "POL-101",
            "USR-POLICE-1",
            "Central City Police Station",
            "Inspector V. K. Sharma",
            "POL-INSP-8891",
            "police@station.gov.in",
            "police",
            "Metro Division 4",
            "2026-09-01T09:00:00.000Z"
        ))
    conn.commit()

def create_guest_record(data: dict) -> dict:
    """
    Inserts a new guest check-in record in strict sequence.
    Generates a sequential reg_no (e.g. REG-0001, REG-0002).
    """
    conn, db_type = get_db_connection()

    cursor = execute_query(conn, db_type, "SELECT COALESCE(MAX(id), 0) + 1 FROM guest_records")
    row = cursor.fetchone()
    next_id = int(row[0]) if row is not None else 1
    
    reg_no = f"REG-{next_id:04d}"
    created_at = datetime.now().isoformat()

    primary = data.get("primaryGuest", {})
    accompanying = data.get("accompanyingGuest")
    accompanying_json = json.dumps(accompanying) if accompanying else None
    hotel_id = str(data.get("hotelId") or data.get("hotel_id") or "HTL-101")

    # Extract partner document images reliably
    partner_front = ""
    partner_back = ""
    if isinstance(accompanying, dict):
        partner_front = accompanying.get("documentFront") or accompanying.get("document_front") or ""
        partner_back = accompanying.get("documentBack") or accompanying.get("document_back") or ""
    if not partner_front:
        partner_front = data.get("partnerDocumentFront") or data.get("partner_document_front") or ""
    if not partner_back:
        partner_back = data.get("partnerDocumentBack") or data.get("partner_document_back") or ""

    query = """
        INSERT INTO guest_records (
            id, reg_no, created_at, room_number, stay_type,
            room_rate, advance_paid, payment_mode, guest_name,
            phone, id_type, id_number, dob, age, gender,
            address, city, pincode, coming_from, going_to,
            purpose, vehicle_no, accompanying_guest_json,
            document_front, document_back, signature, status, hotel_id,
            partner_document_front, partner_document_back
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, 'CHECKED_IN', ?,
            ?, ?
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
        hotel_id,
        partner_front,
        partner_back
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
               accompanying_guest_json, partner_document_front, partner_document_back, checkout_signature,
               (CASE WHEN document_front IS NOT NULL AND document_front != '' THEN 1 ELSE 0 END) as has_doc_front,
               (CASE WHEN document_back IS NOT NULL AND document_back != '' THEN 1 ELSE 0 END) as has_doc_back,
               (CASE WHEN signature IS NOT NULL AND signature != '' THEN 1 ELSE 0 END) as has_signature,
               (CASE WHEN (partner_document_front IS NOT NULL AND partner_document_front != '') OR (accompanying_guest_json LIKE '%documentFront%') THEN 1 ELSE 0 END) as has_partner_doc,
               (CASE WHEN checkout_signature IS NOT NULL AND checkout_signature != '' THEN 1 ELSE 0 END) as has_checkout_signature
        FROM guest_records
        {where_clause}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])

    cursor = execute_query(conn, db_type, query, tuple(params))
    rows = cursor.fetchall()
    records = []
    for r in rows:
        rec = dict(r)
        if rec.get("accompanying_guest_json"):
            try:
                rec["accompanying_guest"] = json.loads(rec["accompanying_guest_json"])
            except Exception:
                rec["accompanying_guest"] = None
        if rec.get("accompanying_guest") and isinstance(rec["accompanying_guest"], dict):
            if not rec.get("partner_document_front"):
                rec["partner_document_front"] = rec["accompanying_guest"].get("documentFront") or rec["accompanying_guest"].get("document_front")
            if not rec.get("partner_document_back"):
                rec["partner_document_back"] = rec["accompanying_guest"].get("documentBack") or rec["accompanying_guest"].get("document_back")
        records.append(rec)
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
        except Exception:
            record["accompanying_guest"] = None
    if record.get("accompanying_guest") and isinstance(record["accompanying_guest"], dict):
        if not record.get("partner_document_front"):
            record["partner_document_front"] = record["accompanying_guest"].get("documentFront") or record["accompanying_guest"].get("document_front")
        if not record.get("partner_document_back"):
            record["partner_document_back"] = record["accompanying_guest"].get("documentBack") or record["accompanying_guest"].get("document_back")
    return record

def checkout_guest_in_db(room_or_id: str, checkout_signature: str = None) -> bool:
    """Marks a guest record as checked out, saving checkout signature if provided."""
    conn, db_type = get_db_connection()
    now = datetime.now().isoformat()
    if str(room_or_id).isdigit() and len(str(room_or_id)) > 3:
        query = "UPDATE guest_records SET status = 'CHECKED_OUT', checked_out_at = ?, checkout_signature = ? WHERE id = ?"
        params = (now, checkout_signature, int(room_or_id))
    else:
        query = "UPDATE guest_records SET status = 'CHECKED_OUT', checked_out_at = ?, checkout_signature = ? WHERE room_number = ? AND status = 'CHECKED_IN'"
        params = (now, checkout_signature, str(room_or_id))
    cursor = execute_query(conn, db_type, query, params)
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0

# ══════════════════════════════════════════════════════════════════════════
# HOTELS & MULTI-TENANT AUTH DATABASE OPERATIONS (Central Multi-PC Shared DB)
# ══════════════════════════════════════════════════════════════════════════

def _format_hotel_dict(row_dict: dict, guest_count: int = 0) -> dict:
    docs = []
    if row_dict.get("documents_json"):
        try:
            docs = json.loads(row_dict["documents_json"])
        except Exception:
            docs = []
    return {
        "id": row_dict.get("id"),
        "name": row_dict.get("name"),
        "hotelName": row_dict.get("name"),
        "ownerName": row_dict.get("owner_name") or "",
        "owner_name": row_dict.get("owner_name") or "",
        "email": row_dict.get("email") or "",
        "phone": row_dict.get("phone") or "",
        "address": row_dict.get("address") or "",
        "area": row_dict.get("area") or "Metro Division Sector 4",
        "propertyType": row_dict.get("property_type") or "Hotel / Lodge Stay",
        "property_type": row_dict.get("property_type") or "Hotel / Lodge Stay",
        "subscriptionPlan": row_dict.get("subscription_plan") or "Guestbooks Standard Plan (₹499/month)",
        "subscriptionAmount": float(row_dict.get("subscription_amount") or 499),
        "status": row_dict.get("status") or "PENDING",
        "regNumber": row_dict.get("reg_number") or f"REG-{row_dict.get('id', '')}",
        "totalRooms": int(row_dict.get("total_rooms") or 15),
        "occupiedRooms": int(row_dict.get("occupied_rooms") or 0),
        "starRating": row_dict.get("star_rating") or "3 Star",
        "documents": docs,
        "registeredAt": row_dict.get("registered_at") or "",
        "registered_at": row_dict.get("registered_at") or "",
        "approvedAt": row_dict.get("approved_at") or None,
        "approved_at": row_dict.get("approved_at") or None,
        "rejectedAt": row_dict.get("rejected_at") or None,
        "rejected_at": row_dict.get("rejected_at") or None,
        "guestCount": guest_count
    }

def db_register_hotel(data: dict) -> dict:
    """
    Registers a new hotel in the central SQLite/Postgres DB.
    Also creates a corresponding user account for login.
    Initial status is set to PENDING for Super Admin approval.
    """
    import random
    conn, db_type = get_db_connection()

    clean_email = (data.get("email") or "").strip().lower()
    clean_name = data.get("hotelName") or data.get("name") or "Unnamed Hotel"

    # Check if email is already in use
    c = execute_query(conn, db_type, "SELECT id FROM users WHERE LOWER(email) = ?", (clean_email,))
    if c.fetchone():
        conn.close()
        raise ValueError("An account with this email address already exists.")

    hotel_id = f"HTL-{random.randint(1000, 9999)}"
    user_id = f"USR-{hotel_id}"

    # Verify ID collision
    while True:
        c = execute_query(conn, db_type, "SELECT id FROM hotels WHERE id = ?", (hotel_id,))
        if not c.fetchone():
            break
        hotel_id = f"HTL-{random.randint(1000, 9999)}"
        user_id = f"USR-{hotel_id}"

    reg_number = data.get("regNumber") or f"REG-{random.randint(100000, 999999)}"
    now_iso = datetime.now().isoformat()
    docs = data.get("documents") or []
    if isinstance(docs, str):
        docs_json = docs
    else:
        docs_json = json.dumps(docs)

    # Insert into hotels table
    execute_query(conn, db_type, """
        INSERT INTO hotels (
            id, name, owner_name, email, phone, address, area,
            property_type, subscription_plan, subscription_amount,
            status, reg_number, total_rooms, occupied_rooms,
            star_rating, documents_json, registered_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        hotel_id,
        clean_name,
        data.get("ownerName") or "",
        clean_email,
        data.get("phone") or "",
        data.get("address") or "",
        data.get("area") or "Metro Division Sector 4",
        data.get("propertyType") or "Hotel / Lodge Stay",
        data.get("subscriptionPlan") or "Guestbooks Standard Plan (₹499/month)",
        float(data.get("subscriptionAmount") or 499),
        "PENDING",
        reg_number,
        int(data.get("totalRooms") or 15),
        0,
        data.get("starRating") or "3 Star",
        docs_json,
        now_iso
    ))

    # Insert into users table
    execute_query(conn, db_type, """
        INSERT INTO users (
            id, email, username, password, name, role, hotel_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        clean_email,
        clean_email.split('@')[0],
        data.get("password") or "password123",
        clean_name,
        "HOTEL",
        hotel_id,
        now_iso
    ))

    conn.commit()
    conn.close()

    hotel_dict = {
        "id": hotel_id,
        "name": clean_name,
        "hotelName": clean_name,
        "ownerName": data.get("ownerName") or "",
        "email": clean_email,
        "phone": data.get("phone") or "",
        "address": data.get("address") or "",
        "area": data.get("area") or "Metro Division Sector 4",
        "propertyType": data.get("propertyType") or "Hotel / Lodge Stay",
        "subscriptionPlan": data.get("subscriptionPlan") or "Guestbooks Standard Plan (₹499/month)",
        "subscriptionAmount": float(data.get("subscriptionAmount") or 499),
        "status": "PENDING",
        "regNumber": reg_number,
        "totalRooms": int(data.get("totalRooms") or 15),
        "documents": docs,
        "registeredAt": now_iso
    }
    logger.info(f"Successfully registered new hotel in central DB: {hotel_id} - {clean_name}")
    return hotel_dict

def db_get_all_hotels() -> list:
    """
    Returns all hotels from central database with guest counts, ordered by registration time.
    """
    conn, db_type = get_db_connection()
    cursor = execute_query(conn, db_type, """
        SELECT h.*, 
               (SELECT COUNT(*) FROM guest_records WHERE hotel_id = h.id) as guest_count
        FROM hotels h
        ORDER BY registered_at DESC
    """)
    rows = cursor.fetchall()
    result = []
    for r in rows:
        r_dict = dict(r)
        g_count = r_dict.get("guest_count", 0)
        result.append(_format_hotel_dict(r_dict, guest_count=g_count))
    conn.close()
    return result

def db_get_hotel(hotel_id: str) -> dict:
    """Fetches a single hotel by ID."""
    conn, db_type = get_db_connection()
    cursor = execute_query(conn, db_type, """
        SELECT h.*, 
               (SELECT COUNT(*) FROM guest_records WHERE hotel_id = h.id) as guest_count
        FROM hotels h
        WHERE h.id = ?
    """, (hotel_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    r_dict = dict(row)
    return _format_hotel_dict(r_dict, guest_count=r_dict.get("guest_count", 0))

def db_update_hotel_status(hotel_id: str, status: str) -> dict:
    """Updates hotel status to APPROVED or REJECTED."""
    conn, db_type = get_db_connection()
    now_iso = datetime.now().isoformat()
    if status == "APPROVED":
        execute_query(conn, db_type, """
            UPDATE hotels SET status = 'APPROVED', approved_at = ? WHERE id = ?
        """, (now_iso, hotel_id))
    elif status == "REJECTED":
        execute_query(conn, db_type, """
            UPDATE hotels SET status = 'REJECTED', rejected_at = ? WHERE id = ?
        """, (now_iso, hotel_id))
    else:
        execute_query(conn, db_type, """
            UPDATE hotels SET status = ? WHERE id = ?
        """, (status, hotel_id))
    conn.commit()
    conn.close()
    return db_get_hotel(hotel_id)

def db_login_user(credential: str, password: str) -> dict:
    """
    Authenticates user credentials against the database.
    Checks password and enforces hotel approval check for HOTEL role.
    """
    conn, db_type = get_db_connection()
    clean_cred = (credential or "").strip().lower()

    cursor = execute_query(conn, db_type, """
        SELECT * FROM users
        WHERE LOWER(email) = ? OR LOWER(username) = ?
    """, (clean_cred, clean_cred))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return {"success": False, "message": "Invalid credentials. User account not found."}

    user = dict(row)
    if user.get("password") != password:
        conn.close()
        return {"success": False, "message": "Incorrect password provided."}

    # If user is a hotel manager, verify approval status
    if user.get("role") == "HOTEL":
        h_id = user.get("hotel_id")
        h_cur = execute_query(conn, db_type, "SELECT status, name FROM hotels WHERE id = ?", (h_id,))
        h_row = h_cur.fetchone()
        if h_row:
            h_status = h_row[0]
            if h_status == "PENDING":
                conn.close()
                return {
                    "success": False,
                    "message": "Your Hotel Registration is currently PENDING Super Admin approval & document verification."
                }
            if h_status == "REJECTED":
                conn.close()
                return {
                    "success": False,
                    "message": "Your Hotel Registration was rejected by Admin. Please contact support."
                }

    conn.close()
    # Format returned user session
    return {
        "success": True,
        "user": {
            "id": user.get("id"),
            "email": user.get("email"),
            "username": user.get("username"),
            "name": user.get("name"),
            "role": user.get("role"),
            "hotelId": user.get("hotel_id"),
            "hotel_id": user.get("hotel_id"),
            "stationName": user.get("station_name"),
            "jurisdiction": user.get("jurisdiction")
        }
    }

def db_get_all_police() -> list:
    """Returns all police station accounts from DB."""
    conn, db_type = get_db_connection()
    cursor = execute_query(conn, db_type, "SELECT * FROM police_accounts ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        result.append({
            "id": d.get("id"),
            "userId": d.get("user_id"),
            "stationName": d.get("station_name"),
            "officerName": d.get("officer_name"),
            "badgeNo": d.get("badge_no"),
            "email": d.get("email"),
            "username": d.get("username"),
            "jurisdiction": d.get("jurisdiction"),
            "createdAt": d.get("created_at")
        })
    return result

def db_create_police_account(data: dict) -> dict:
    """Creates a new police station account in the DB."""
    import random
    conn, db_type = get_db_connection()
    clean_email = (data.get("email") or "").strip().lower()
    clean_username = (data.get("username") or "").strip().lower()

    # Check collision
    c = execute_query(conn, db_type, """
        SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?
    """, (clean_email, clean_username))
    if c.fetchone():
        conn.close()
        raise ValueError("Police username or email already exists.")

    user_id = f"USR-POL-{random.randint(100, 999)}"
    pol_id = f"POL-{random.randint(100, 999)}"
    now_iso = datetime.now().isoformat()
    badge = data.get("badgeNo") or f"POL-INSP-{random.randint(1000, 9999)}"

    execute_query(conn, db_type, """
        INSERT INTO users (
            id, email, username, password, name, role, station_name, jurisdiction, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        clean_email,
        clean_username,
        data.get("password") or "police123",
        data.get("officerName") or "Police Officer",
        "POLICE",
        data.get("stationName") or "Police Station",
        data.get("jurisdiction") or "Metro Jurisdiction Zone",
        now_iso
    ))

    execute_query(conn, db_type, """
        INSERT INTO police_accounts (
            id, user_id, station_name, officer_name, badge_no, email, username, jurisdiction, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        pol_id,
        user_id,
        data.get("stationName") or "Police Station",
        data.get("officerName") or "Police Officer",
        badge,
        clean_email,
        clean_username,
        data.get("jurisdiction") or "Metro Jurisdiction Zone",
        now_iso
    ))

    conn.commit()
    conn.close()

    return {
        "id": pol_id,
        "userId": user_id,
        "stationName": data.get("stationName"),
        "officerName": data.get("officerName"),
        "badgeNo": badge,
        "email": clean_email,
        "username": clean_username,
        "jurisdiction": data.get("jurisdiction") or "Metro Jurisdiction Zone",
        "createdAt": now_iso
    }

def db_get_stats() -> dict:
    """Returns real-time system stats across all hotels, rooms and guests."""
    conn, db_type = get_db_connection()
    c = execute_query(conn, db_type, "SELECT COUNT(*) FROM hotels")
    total_hotels = c.fetchone()[0]

    c = execute_query(conn, db_type, "SELECT COUNT(*) FROM hotels WHERE status = 'PENDING'")
    pending_hotels = c.fetchone()[0]

    c = execute_query(conn, db_type, "SELECT COUNT(*) FROM guest_records")
    total_guests = c.fetchone()[0]

    c = execute_query(conn, db_type, "SELECT COUNT(*) FROM guest_records WHERE status = 'CHECKED_IN'")
    active_stays = c.fetchone()[0]

    conn.close()
    return {
        "totalHotels": total_hotels,
        "pendingHotels": pending_hotels,
        "totalGuests": total_guests,
        "activeStays": active_stays
    }


