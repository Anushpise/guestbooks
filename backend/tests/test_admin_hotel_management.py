import sys
import unittest
import uuid
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.database import (
    init_db,
    db_register_hotel,
    db_get_hotel,
    db_update_hotel_status,
    db_login_user,
    db_update_hotel,
    db_delete_hotel,
    db_purge_hotel_data,
    create_guest_record,
    db_get_rooms
)

class TestAdminHotelManagement(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def test_hotel_deactivation_blocks_login(self):
        uid = uuid.uuid4().hex[:6]
        email = f"deact_{uid}@example.com"
        hotel_data = {
            "hotelName": f"Test Deactivation Lodge {uid}",
            "ownerName": "Suresh Kumar",
            "email": email,
            "phone": "9876543210",
            "password": "Password@123",
            "address": "123 Main Road",
            "propertyType": "Lodge"
        }
        hotel = db_register_hotel(hotel_data)
        hotel_id = hotel["id"]

        # Approve hotel first
        db_update_hotel_status(hotel_id, "APPROVED")

        # Test login succeeds
        login_res = db_login_user(email, "Password@123")
        self.assertTrue(login_res["success"], "Approved hotel should log in successfully")

        # Deactivate hotel
        db_update_hotel_status(hotel_id, "DEACTIVATED")
        deact_hotel = db_get_hotel(hotel_id)
        self.assertEqual(deact_hotel["status"], "DEACTIVATED")

        # Test login is now rejected
        blocked_login = db_login_user(email, "Password@123")
        self.assertFalse(blocked_login["success"], "Deactivated hotel must be blocked from logging in")
        self.assertIn("DEACTIVATED", blocked_login["message"].upper())

        # Reactivate hotel
        db_update_hotel_status(hotel_id, "APPROVED")
        react_login = db_login_user(email, "Password@123")
        self.assertTrue(react_login["success"], "Reactivated hotel should log in successfully")

    def test_hotel_edit_credentials_and_password(self):
        uid = uuid.uuid4().hex[:6]
        old_email = f"edit_{uid}@example.com"
        new_email = f"new_email_{uid}@example.com"
        hotel_data = {
            "hotelName": "Old Name Hotel",
            "ownerName": "Ramesh Gupta",
            "email": old_email,
            "phone": "9998887771",
            "password": "OldPassword@123",
            "address": "Old Address Road",
            "propertyType": "Hotel"
        }
        hotel = db_register_hotel(hotel_data)
        hotel_id = hotel["id"]
        db_update_hotel_status(hotel_id, "APPROVED")

        # Verify old password works
        old_login = db_login_user(old_email, "OldPassword@123")
        self.assertTrue(old_login["success"])

        # Update hotel details and password
        update_data = {
            "name": "New Renovated Palace",
            "email": new_email,
            "phone": "8887776662",
            "password": "NewSecretPassword@456",
            "address": "New VIP Enclave"
        }
        updated_hotel = db_update_hotel(hotel_id, update_data)
        self.assertEqual(updated_hotel["name"], "New Renovated Palace")
        self.assertEqual(updated_hotel["email"], new_email)
        self.assertEqual(updated_hotel["phone"], "8887776662")

        # Old password should no longer work
        failed_login = db_login_user(new_email, "OldPassword@123")
        self.assertFalse(failed_login["success"])

        # New password should work
        new_login = db_login_user(new_email, "NewSecretPassword@456")
        self.assertTrue(new_login["success"])

    def test_hotel_date_range_data_purge(self):
        uid = uuid.uuid4().hex[:6]
        hotel_id = f"HTL-PURGE-{uid}"
        # Create a sample guest check-in
        guest_payload = {
            "hotelId": hotel_id,
            "roomNumber": "101",
            "stayType": "24 Hours Full Stay",
            "primaryGuest": {
                "name": "Arun Kumar",
                "phone": "9876501234",
                "idType": "Aadhaar Card",
                "idNumber": "1234 5678 9012"
            },
            "documentFront": "data:image/jpeg;base64,mockFrontImage",
            "documentBack": "data:image/jpeg;base64,mockBackImage"
        }
        rec = create_guest_record(guest_payload)
        self.assertIsNotNone(rec.get("id"))

        # Test photo purge only
        photo_purge_res = db_purge_hotel_data(hotel_id, photos_only=True)
        self.assertTrue(photo_purge_res["success"])

        # Test full deletion purge
        full_purge_res = db_purge_hotel_data(hotel_id, photos_only=False)
        self.assertTrue(full_purge_res["success"])

    def test_hotel_cascade_delete(self):
        uid = uuid.uuid4().hex[:6]
        wipe_email = f"wipe_{uid}@example.com"
        hotel_data = {
            "hotelName": f"Hotel To Delete {uid}",
            "ownerName": "Vikas Sharma",
            "email": wipe_email,
            "phone": "9123456789",
            "password": "WipePassword@999",
            "address": "Temporary Lane",
            "propertyType": "Lodge"
        }
        hotel = db_register_hotel(hotel_data)
        hotel_id = hotel["id"]
        db_update_hotel_status(hotel_id, "APPROVED")

        # Add a guest check-in for this hotel
        create_guest_record({
            "hotelId": hotel_id,
            "roomNumber": "101",
            "primaryGuest": {"name": "Guest To Delete", "phone": "9000000001"}
        })

        # Initialize rooms
        rooms = db_get_rooms(hotel_id)
        self.assertGreaterEqual(len(rooms), 1)

        # Execute full cascade deletion
        delete_res = db_delete_hotel(hotel_id)
        self.assertTrue(delete_res["success"])
        self.assertTrue(delete_res["deleted"])

        # Verify hotel is gone
        self.assertIsNone(db_get_hotel(hotel_id))

        # Verify user account cannot log in
        login_after_del = db_login_user(wipe_email, "WipePassword@999")
        self.assertFalse(login_after_del["success"])

    def test_api_endpoints_hotel_management(self):
        from fastapi.testclient import TestClient
        from app.main import app

        client = TestClient(app)
        uid = uuid.uuid4().hex[:6]
        api_email = f"api_test_{uid}@example.com"

        # 1. Register a hotel via API
        reg_res = client.post("/api/auth/register-hotel", json={
            "hotelName": f"API Test Hotel {uid}",
            "ownerName": "API Owner",
            "email": api_email,
            "phone": "9988776655",
            "password": "ApiSecret@123",
            "address": "API Enclave"
        })
        self.assertEqual(reg_res.status_code, 200)
        hotel_id = reg_res.json()["hotel"]["id"]

        # 2. Update hotel status to DEACTIVATED
        stat_res = client.post("/api/auth/hotel-status", json={
            "hotelId": hotel_id,
            "status": "DEACTIVATED"
        })
        self.assertEqual(stat_res.status_code, 200)
        self.assertEqual(stat_res.json()["hotel"]["status"], "DEACTIVATED")

        # 3. Update hotel details and password via PUT /api/auth/hotels/{id}
        put_res = client.put(f"/api/auth/hotels/{hotel_id}", json={
            "name": f"API Updated Hotel Name {uid}",
            "phone": "9999999999",
            "password": "UpdatedApiPassword@999"
        })
        self.assertEqual(put_res.status_code, 200)
        self.assertEqual(put_res.json()["hotel"]["name"], f"API Updated Hotel Name {uid}")

        # 4. Purge data via POST /api/auth/hotels/{id}/purge-data
        purge_res = client.post(f"/api/auth/hotels/{hotel_id}/purge-data", json={
            "photosOnly": True
        })
        self.assertEqual(purge_res.status_code, 200)
        self.assertTrue(purge_res.json()["success"])

        # 5. Delete hotel via DELETE /api/auth/hotels/{id}
        del_res = client.delete(f"/api/auth/hotels/{hotel_id}")
        self.assertEqual(del_res.status_code, 200)
        self.assertTrue(del_res.json()["success"])

if __name__ == '__main__':
    unittest.main()
