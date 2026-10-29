import sys
import os
import json
import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.gemini_extractor import (
    extract_id_with_gemini,
    format_gemini_prompt,
    parse_gemini_response,
    is_gemini_configured,
    get_candidate_models,
)

class TestGeminiExtractor(unittest.TestCase):

    def test_is_gemini_configured_false_when_no_key(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(is_gemini_configured())

    def test_is_gemini_configured_true_when_key_set(self):
        with patch.dict(os.environ, {"GEMINI_API_KEY": "AIzaSyFakeKey123"}):
            self.assertTrue(is_gemini_configured())

    def test_format_gemini_prompt(self):
        prompt = format_gemini_prompt()
        self.assertIn("idType", prompt)
        self.assertIn("idNumber", prompt)
        self.assertIn("name", prompt)
        self.assertIn("dob", prompt)
        self.assertIn("gender", prompt)
        self.assertIn("address", prompt)
        self.assertIn("city", prompt)
        self.assertIn("pincode", prompt)

    def test_parse_gemini_response_clean_json(self):
        sample_response_text = json.dumps({
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
        })
        parsed = parse_gemini_response(sample_response_text)
        self.assertEqual(parsed["name"], "Jagdish Patil")
        self.assertEqual(parsed["idNumber"], "7462 7744 4947")
        self.assertEqual(parsed["city"], "Nagpur")
        self.assertEqual(parsed["pincode"], "441103")
        self.assertEqual(parsed["age"], "41")

    def test_parse_gemini_response_with_markdown_fences(self):
        sample_text = "```json\n" + json.dumps({
            "idType": "Aadhaar Card",
            "idNumber": "5459 7034 8836",
            "name": "Shamal Premanand Bhongade",
            "dob": "21/07/2002",
            "age": "24",
            "gender": "Female",
            "address": "Ralegaon, Ta. Ralegaon, Ralegaon, PO: Ralegaon, DIST: Yavatmal, Maharashtra - 445402",
            "city": "Yavatmal",
            "pincode": "445402",
            "phone": ""
        }) + "\n```"
        parsed = parse_gemini_response(sample_text)
        self.assertEqual(parsed["name"], "Shamal Premanand Bhongade")
        self.assertEqual(parsed["idNumber"], "5459 7034 8836")
        self.assertEqual(parsed["city"], "Yavatmal")

    @patch("app.services.gemini_extractor.httpx.Client")
    def test_extract_id_with_gemini_success(self, mock_client_cls):
        mock_client = MagicMock()
        mock_client_cls.return_value.__enter__.return_value = mock_client
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": json.dumps({
                                    "idType": "Aadhaar Card",
                                    "idNumber": "2594 1897 9713",
                                    "name": "Sandhya Diliprao Barhane",
                                    "dob": "19/08/1975",
                                    "age": "51",
                                    "gender": "Female",
                                    "address": "Ward NO 4, Vidhya Lay Out, Near Mude Town Wardha, Wardha, Maharashtra - 442001",
                                    "city": "Wardha",
                                    "pincode": "442001",
                                    "phone": "9673138677"
                                })
                            }
                        ]
                    }
                }
            ]
        }
        mock_client.post.return_value = mock_resp

        with patch.dict(os.environ, {"GEMINI_API_KEY": "AIzaSyFakeKey123"}):
            fake_img = b"\x89PNG\r\n\x1a\nfakeimagebytes"
            res = extract_id_with_gemini(front_bytes=fake_img, back_bytes=None)

            self.assertIsNotNone(res)
            self.assertEqual(res["name"], "Sandhya Diliprao Barhane")
            self.assertEqual(res["idNumber"], "2594 1897 9713")
            self.assertEqual(res["dob"], "19/08/1975")
            self.assertEqual(res["age"], "51")
            self.assertEqual(res["city"], "Wardha")

    @patch("app.services.gemini_extractor.httpx.Client")
    def test_extract_id_with_gemini_timeout_returns_none(self, mock_client_cls):
        import httpx
        mock_client = MagicMock()
        mock_client_cls.return_value.__enter__.return_value = mock_client
        mock_client.post.side_effect = httpx.TimeoutException("Connection timed out")

        with patch.dict(os.environ, {"GEMINI_API_KEY": "AIzaSyFakeKey123"}):
            fake_img = b"\x89PNG\r\n\x1a\nfakeimagebytes"
            res = extract_id_with_gemini(front_bytes=fake_img, back_bytes=None)
            self.assertIsNone(res)

    def test_extract_id_with_gemini_returns_none_if_no_key(self):
        with patch.dict(os.environ, {}, clear=True):
            fake_img = b"\x89PNG\r\n\x1a\nfakeimagebytes"
            self.assertIsNone(extract_id_with_gemini(front_bytes=fake_img))

    def test_get_candidate_models_filters_deprecated_models(self):
        with patch.dict(os.environ, {"GEMINI_MODEL": "gemini-2.0-flash"}):
            models = get_candidate_models()
            self.assertNotIn("gemini-2.0-flash", models)
            self.assertIn("gemini-2.5-flash", models)
            self.assertIn("gemini-1.5-flash", models)

if __name__ == '__main__':
    unittest.main()
