import sys
import unittest
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.database import (
    init_db,
    db_get_rooms,
    db_add_room,
    db_update_room_tariff,
    db_update_room_status,
    db_update_room,
    db_delete_room
)

class TestRoomCrud(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def test_room_tariff_and_isolation(self):
        hotel_a = "HTL-TEST-A"
        hotel_b = "HTL-TEST-B"

        # Initialize rooms for both
        rooms_a = db_get_rooms(hotel_a)
        rooms_b = db_get_rooms(hotel_b)
        self.assertGreaterEqual(len(rooms_a), 1)
        self.assertGreaterEqual(len(rooms_b), 1)

        # Update tariff for room 101 in hotel A
        db_update_room_tariff(hotel_a, "101", 3333.0)
        # Verify hotel A updated
        updated_a = db_get_rooms(hotel_a)
        r101_a = next(r for r in updated_a if r["number"] == "101")
        self.assertEqual(r101_a["rate"], 3333.0)

        # Verify hotel B was NOT affected
        updated_b = db_get_rooms(hotel_b)
        r101_b = next(r for r in updated_b if r["number"] == "101")
        self.assertNotEqual(r101_b["rate"], 3333.0)

    def test_room_add_and_delete(self):
        hotel_id = "HTL-TEST-DEL"
        # Add a custom room 999
        room_data = {
            "number": "999",
            "type": "Penthouse",
            "floor": "9th Floor",
            "rate": 9999.0
        }
        res_add = db_add_room(hotel_id, room_data)
        self.assertEqual(res_add["number"], "999")

        rooms = db_get_rooms(hotel_id)
        self.assertTrue(any(r["number"] == "999" for r in rooms))

        # Delete room 999
        res_del = db_delete_room(hotel_id, "999")
        self.assertTrue(res_del["success"])

        # Verify room 999 is gone
        rooms_after = db_get_rooms(hotel_id)
        self.assertFalse(any(r["number"] == "999" for r in rooms_after))

    def test_room_custom_name_edit(self):
        hotel_id = "HTL-TEST-NAME"
        try:
            db_delete_room(hotel_id, "505")
        except Exception:
            pass

        try:
            # 1. Add room with customized name
            room_data = {
                "number": "505",
                "type": "Honeymoon Garden Villa",
                "floor": "Ground Floor",
                "rate": 4500.0
            }
            res_add = db_add_room(hotel_id, room_data)
            self.assertEqual(res_add["type"], "Honeymoon Garden Villa")

            # 2. Update room customized name
            res_update = db_update_room(hotel_id, "505", {"type": "Presidential Poolside Villa", "rate": 5500.0})
            self.assertTrue(res_update["success"])
            self.assertEqual(res_update["type"], "Presidential Poolside Villa")

            # 3. Verify in db_get_rooms
            rooms = db_get_rooms(hotel_id)
            r505 = next(r for r in rooms if r["number"] == "505")
            self.assertEqual(r505["type"], "Presidential Poolside Villa")
            self.assertEqual(r505["rate"], 5500.0)
        finally:
            try:
                db_delete_room(hotel_id, "505")
            except Exception:
                pass

    def test_db_get_rooms_with_null_total_rooms(self):
        """Verify that hotels with NULL total_rooms do not crash db_get_rooms with TypeError: int(None)."""
        from app.db.database import get_db_connection, execute_query, db_delete_hotel
        conn, db_type = get_db_connection()
        test_htl = "HTL-7660-TEST"
        try:
            # Delete any existing
            execute_query(conn, db_type, "DELETE FROM hotels WHERE id = ?", (test_htl,))
            execute_query(conn, db_type, "DELETE FROM rooms WHERE hotel_id = ?", (test_htl,))
            # Insert hotel with total_rooms as NULL
            execute_query(conn, db_type, """
                INSERT INTO hotels (id, name, email, phone, total_rooms, status, registered_at)
                VALUES (?, ?, ?, ?, NULL, 'active', '2026-11-01T00:00:00Z')
            """, (test_htl, "Null Rooms Test Hotel", "test@null.com", "9999999999"))
            conn.commit()
        finally:
            conn.close()

        try:
            # Now fetch rooms - must not raise TypeError/500
            rooms = db_get_rooms(test_htl)
            self.assertIsInstance(rooms, list)
            self.assertEqual(len(rooms), 15)
        finally:
            try:
                db_delete_hotel(test_htl)
            except Exception:
                pass

    def test_twelve_room_layout_and_sync_no_resurrection(self):
        """Verify 12-room hotels use 4-per-floor (101-104, 201-204, 301-304) and db_sync_rooms never resurrects deleted rooms or overwrites rates."""
        from app.db.database import get_db_connection, execute_query, db_delete_hotel, db_sync_rooms
        conn, db_type = get_db_connection()
        test_htl = "HTL-12RM-TEST"
        try:
            execute_query(conn, db_type, "DELETE FROM hotels WHERE id = ?", (test_htl,))
            execute_query(conn, db_type, "DELETE FROM rooms WHERE hotel_id = ?", (test_htl,))
            execute_query(conn, db_type, """
                INSERT INTO hotels (id, name, email, phone, total_rooms, status, registered_at)
                VALUES (?, ?, ?, ?, 12, 'APPROVED', '2026-11-12T00:00:00Z')
            """, (test_htl, "Twelve Room Hotel", "12rm@test.com", "9999999998"))
            conn.commit()
        finally:
            conn.close()

        try:
            rooms = db_get_rooms(test_htl)
            nums = [r["number"] for r in rooms]
            self.assertEqual(nums, ["101", "102", "103", "104", "201", "202", "203", "204", "301", "302", "303", "304"])

            # Customize room 101 and delete room 304
            db_update_room(test_htl, "101", {"type": "NON AC", "rate": 800.0})
            db_delete_room(test_htl, "304")

            # Simulate stale device pushing old cache with 304 and old 101 rate
            stale_cache = [
                {"number": "101", "type": "Executive Deluxe", "floor": "1st Floor", "rate": 1800.0},
                {"number": "304", "type": "Standard Suite", "floor": "3rd Floor", "rate": 1500.0},
                {"number": "105", "type": "Phantom", "floor": "1st Floor", "rate": 1500.0},
            ]
            synced = db_sync_rooms(test_htl, stale_cache)
            synced_nums = [r["number"] for r in synced]
            self.assertNotIn("304", synced_nums)
            self.assertNotIn("105", synced_nums)
            r101 = next(r for r in synced if r["number"] == "101")
            self.assertEqual(r101["type"], "NON AC")
            self.assertEqual(r101["rate"], 800.0)
        finally:
            try:
                db_delete_hotel(test_htl)
            except Exception:
                pass

if __name__ == "__main__":
    unittest.main()
