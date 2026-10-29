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

if __name__ == "__main__":
    unittest.main()
