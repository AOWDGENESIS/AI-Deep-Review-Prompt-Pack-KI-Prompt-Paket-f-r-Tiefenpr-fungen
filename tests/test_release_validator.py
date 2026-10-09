"""Regression tests for release-manifest validation."""
from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SOURCE_ROOT = Path(__file__).resolve().parents[1]
VALIDATOR = Path("scripts/validate_release.py")
MANIFEST = Path("RELEASE_MANIFEST.sha256")


class ReleaseValidatorRegressionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory(prefix="release-validator-test-")
        self.root = Path(self.temp.name) / "package"
        shutil.copytree(
            SOURCE_ROOT,
            self.root,
            ignore=shutil.ignore_patterns(".git", "__pycache__", ".pytest_cache"),
        )

    def tearDown(self) -> None:
        self.temp.cleanup()

    def run_validator(self) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(self.root / VALIDATOR)],
            cwd=self.root,
            text=True,
            capture_output=True,
            check=False,
            timeout=30,
        )

    def test_clean_package_passes(self) -> None:
        result = self.run_validator()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("SHA-256 coverage=", result.stdout)

    def test_missing_manifest_entry_fails(self) -> None:
        path = self.root / MANIFEST
        lines = path.read_text(encoding="utf-8").splitlines()
        path.write_text("\n".join(lines[:-1]) + "\n", encoding="utf-8")
        result = self.run_validator()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("package files missing from SHA-256 manifest", result.stdout)

    def test_duplicate_manifest_entry_fails(self) -> None:
        path = self.root / MANIFEST
        lines = path.read_text(encoding="utf-8").splitlines()
        path.write_text("\n".join(lines + [lines[0]]) + "\n", encoding="utf-8")
        result = self.run_validator()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("duplicate manifest path", result.stdout)

    def test_malformed_manifest_line_fails(self) -> None:
        path = self.root / MANIFEST
        path.write_text(path.read_text(encoding="utf-8") + "not-a-valid-entry\n", encoding="utf-8")
        result = self.run_validator()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("invalid SHA-256 manifest syntax", result.stdout)

    def test_unsafe_manifest_path_fails(self) -> None:
        path = self.root / MANIFEST
        lines = path.read_text(encoding="utf-8").splitlines()
        lines[0] = lines[0].split("  ", 1)[0] + "  ../outside.txt"
        path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        result = self.run_validator()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("unsafe manifest path", result.stdout)

    def test_modified_file_fails_checksum(self) -> None:
        target = self.root / "README.md"
        target.write_text(target.read_text(encoding="utf-8") + "\nTampered.\n", encoding="utf-8")
        result = self.run_validator()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("manifest checksum mismatch: README.md", result.stdout)

    def test_unmanifested_file_fails(self) -> None:
        (self.root / "unexpected.txt").write_text("unexpected payload\n", encoding="utf-8")
        result = self.run_validator()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("package files missing from SHA-256 manifest: unexpected.txt", result.stdout)


if __name__ == "__main__":
    unittest.main()
