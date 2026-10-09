"""Offline regression tests for the reference-link auditor."""
from __future__ import annotations

import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError, URLError

from scripts.audit_reference_links import (
    check_url, collect_urls, extract_urls, is_moving_target, normalize_url,
)


class FakeResponse:
    def __init__(self, status: int, url: str) -> None:
        self.status = status
        self.url = url

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def getcode(self):
        return self.status

    def geturl(self):
        return self.url


class ReferenceLinkAuditTests(unittest.TestCase):
    def test_extracts_and_deduplicates_http_urls(self) -> None:
        text = "See https://example.org/docs). and https://example.org/docs, plus http://example.net/x"
        self.assertEqual(extract_urls(text), ["http://example.net/x", "https://example.org/docs"])

    def test_rejects_unsafe_or_non_http_urls(self) -> None:
        self.assertIsNone(normalize_url("javascript:alert(1)"))
        self.assertIsNone(normalize_url("https://user:pass@example.org/path"))
        self.assertIsNone(normalize_url("https:///missing-host"))

    def test_redirect_final_url_is_reported(self) -> None:
        with patch("scripts.audit_reference_links._request", return_value=FakeResponse(200, "https://new.example.org/final")):
            result = check_url("https://old.example.org/start")
        self.assertEqual((result.category, result.status, result.final_url), ("ok", 200, "https://new.example.org/final"))

    def test_head_405_falls_back_to_get(self) -> None:
        error = HTTPError("https://example.org", 405, "Method Not Allowed", {}, io.BytesIO())
        with patch("scripts.audit_reference_links._request", side_effect=[error, FakeResponse(200, "https://example.org/")]) as request:
            result = check_url("https://example.org")
        self.assertEqual(result.category, "ok")
        self.assertEqual(request.call_count, 2)
        self.assertEqual(request.call_args_list[0].args[1], "HEAD")
        self.assertEqual(request.call_args_list[1].args[1], "GET")

    def test_403_and_429_are_inconclusive(self) -> None:
        for status in (403, 429):
            error = HTTPError("https://example.org", status, "blocked", {}, io.BytesIO())
            with self.subTest(status=status), patch("scripts.audit_reference_links._request", side_effect=error):
                self.assertEqual(check_url("https://example.org").category, "inconclusive")

    def test_network_failure_is_inconclusive(self) -> None:
        with patch("scripts.audit_reference_links._request", side_effect=URLError("offline")):
            result = check_url("https://example.org")
        self.assertEqual(result.category, "inconclusive")
        self.assertIsNone(result.status)

    def test_confirmed_404_is_failed(self) -> None:
        error = HTTPError("https://example.org/missing", 404, "Not Found", {}, io.BytesIO())
        with patch("scripts.audit_reference_links._request", side_effect=error):
            result = check_url("https://example.org/missing")
        self.assertEqual((result.category, result.status), ("failed", 404))

    def test_moving_paths_are_flagged(self) -> None:
        self.assertTrue(is_moving_target("https://docs.example.org/next/api/"))
        self.assertTrue(is_moving_target("https://docs.example.org/live/wave/"))
        self.assertFalse(is_moving_target("https://docs.example.org/v2/api/"))

    def test_collects_master_prompts_and_manifest_profiles(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "DEEP_REVIEW_PROMPT_DE.md").write_text("https://de.example.org", encoding="utf-8")
            (root / "DEEP_REVIEW_PROMPT_EN.md").write_text("https://en.example.org", encoding="utf-8")
            folder = root / "prompts" / "standalone"
            folder.mkdir(parents=True)
            (folder / "PROFILE_MANIFEST.json").write_text(json.dumps({"profiles": [{"file": "01-profile.md"}]}), encoding="utf-8")
            (folder / "01-profile.md").write_text("https://profile.example.org", encoding="utf-8")
            urls, files = collect_urls(root)
        self.assertEqual(len(urls), 3)
        self.assertEqual(len(files), 3)
        self.assertIn("https://profile.example.org/", urls)


if __name__ == "__main__":
    unittest.main()
