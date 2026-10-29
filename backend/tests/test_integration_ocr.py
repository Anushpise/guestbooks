import sys
import os
import io
import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.api.ocr_routes import router as ocr_router

app = FastAPI()
app.include_router(ocr_router)
client = TestClient(app)

class TestOcrRoutesIntegration(unittest.TestCase):

    @patch("app.api.ocr_routes.extract_id_with_gemini")
    @patch("app.api.ocr_routes.is_gemini_configured")
    def test_scan_with_gemini_primary_success(self, mock_is_configured, mock_gemini_extract):
        mock_is_configured.return_value = True
        mock_gemini_extract.return_value = {
            "idType": "Aadhaar Card",
            "idNumber": "7462 7744 4947",
            "name": "Jagdish Patil",
            "dob": "12/04/1985",
            "age": "41",
            "gender": "Male",
            "address": "S/O Jagdish Patil, AT-SHIRMI PO-KONDHALI TAH-KATOL, Kondhali, DIST: Nagpur, Maharashtra - 441103",
            "city": "Nagpur",
            "pincode": "441103",
            "phone": ""
        }

        fake_file = io.BytesIO(b"\x89PNG\r\n\x1a\nfakeimagebytes")
        response = client.post(
            "/api/ocr/scan",
            files={"front_image": ("front.png", fake_file, "image/png")}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["engine"], "Gemini Multimodal Vision AI")
        self.assertEqual(data["data"]["name"], "Jagdish Patil")
        self.assertEqual(data["data"]["idNumber"], "7462 7744 4947")
        self.assertEqual(data["data"]["city"], "Nagpur")

    @patch("app.api.ocr_routes.extract_id_with_gemini")
    @patch("app.api.ocr_routes.is_gemini_configured")
    @patch("app.api.ocr_routes.get_paddle_engine")
    @patch("app.api.ocr_routes.parse_indian_id_text")
    def test_scan_fallback_to_local_when_gemini_fails(
        self, mock_parser, mock_get_engine, mock_is_configured, mock_gemini_extract
    ):
        mock_is_configured.return_value = True
        mock_gemini_extract.return_value = None  # Gemini fails / times out

        mock_engine = MagicMock()
        mock_engine.extract_text_from_bytes.return_value = "Mocked Paddle OCR Text"
        mock_get_engine.return_value = mock_engine

        mock_parser.return_value = {
            "idType": "Aadhaar Card",
            "idNumber": "5917 8160 4322",
            "name": "Vijay Bhopalkar",
            "dob": "05/08/2005",
            "age": "21",
            "gender": "Male",
            "address": "Indira Gandhi Chowk, Balapur, Chandrapur - 441221",
            "city": "Chandrapur",
            "pincode": "441221",
            "phone": ""
        }

        fake_file = io.BytesIO(b"\x89PNG\r\n\x1a\nfakeimagebytes")
        response = client.post(
            "/api/ocr/scan",
            files={"front_image": ("front.png", fake_file, "image/png")}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("Local", data["engine"])
        self.assertEqual(data["data"]["name"], "Vijay Bhopalkar")
        self.assertEqual(data["data"]["idNumber"], "5917 8160 4322")

    @patch("app.api.ocr_routes.is_gemini_configured")
    @patch("app.api.ocr_routes.get_paddle_engine")
    @patch("app.api.ocr_routes.parse_indian_id_text")
    def test_scan_local_when_gemini_not_configured(
        self, mock_parser, mock_get_engine, mock_is_configured
    ):
        mock_is_configured.return_value = False  # No Gemini Key set

        mock_engine = MagicMock()
        mock_engine.extract_text_from_bytes.return_value = "Mocked Paddle OCR Text"
        mock_get_engine.return_value = mock_engine

        mock_parser.return_value = {
            "idType": "Aadhaar Card",
            "idNumber": "2594 1897 9713",
            "name": "Sandhya Diliprao Barhane",
            "dob": "19/08/1975",
            "age": "51",
            "gender": "Female",
            "address": "Ward NO 4, Wardha - 442001",
            "city": "Wardha",
            "pincode": "442001",
            "phone": ""
        }

        fake_file = io.BytesIO(b"\x89PNG\r\n\x1a\nfakeimagebytes")
        response = client.post(
            "/api/ocr/scan",
            files={"front_image": ("front.png", fake_file, "image/png")}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("Local", data["engine"])
        self.assertEqual(data["data"]["name"], "Sandhya Diliprao Barhane")

    def test_status_endpoint(self):
        response = client.get("/api/ocr/status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("geminiConfigured", data)
        self.assertIn("primaryEngine", data)

    @patch("app.api.ocr_routes.test_gemini_connection")
    def test_gemini_diagnostic_endpoint(self, mock_test_conn):
        mock_test_conn.return_value = {
            "success": True,
            "model": "gemini-1.5-flash",
            "latencySec": 0.35,
            "message": "Gemini API Key is valid and responding successfully!"
        }
        response = client.get("/api/ocr/test-gemini")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["message"], "Gemini API Key is valid and responding successfully!")

if __name__ == '__main__':
    unittest.main()
