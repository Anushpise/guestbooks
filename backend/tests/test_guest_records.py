import sys
import unittest
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.database import init_db, get_all_guest_records, create_guest_record

class TestGuestRecords(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def test_list_records_with_hotel_id(self):
        # Create a sample record for HTL-4541
        sample_data = {
            "roomNumber": "101",
            "stayType": "24 Hours Full Stay",
            "roomRate": 1500,
            "advancePaid": 1500,
            "paymentMode": "Cash",
            "primaryGuest": {
                "name": "Ramesh Kumar",
                "phone": "9876543210",
                "idType": "Aadhaar Card",
                "idNumber": "1234 5678 9012"
            },
            "hotelId": "HTL-4541"
        }
        create_guest_record(sample_data)

        # Test querying records by hotel_id
        records = get_all_guest_records(hotel_id="HTL-4541")
        self.assertIsInstance(records, list)
        self.assertGreaterEqual(len(records), 1)

        # Verify fields in record
        rec = records[0]
        self.assertIn("has_partner_doc", rec)
        self.assertIn("has_doc_front", rec)

    def test_list_records_with_search_and_hotel_id(self):
        records = get_all_guest_records(search="Ramesh", hotel_id="HTL-4541")
        self.assertIsInstance(records, list)

if __name__ == "__main__":
    unittest.main()
