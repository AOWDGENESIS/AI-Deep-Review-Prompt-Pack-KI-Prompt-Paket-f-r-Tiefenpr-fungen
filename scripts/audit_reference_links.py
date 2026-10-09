#!/usr/bin/env python3
"""Audit reference URLs in the prompt pack without interpreting remote page content."""
from __future__ import annotations
import argparse, concurrent.futures, json, re, sys, time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, urlunsplit
from urllib.request import Request, urlopen

URL_PATTERN = re.compile(r"""https?://[^\s<>"']+""", re.IGNORECASE)
TRAILING_PUNCTUATION = ".,;:!?)]}"
MOVING_SEGMENTS = ("/next/", "/live/", "/current/", "/latest/")
DEFAULT_TIMEOUT = 8
USER_AGENT = "AI-Deep-Review-Prompt-Pack-ReferenceAudit/1.0"

@dataclass(frozen=True)
class LinkResult:
    url: str
    final_url: str
    status: int | None
    category: str
    moving_target: bool
    detail: str

def normalize_url(candidate: str) -> str | None:
    value = candidate.rstrip(TRAILING_PUNCTUATION)
    try:
        parsed = urlsplit(value)
    except ValueError:
        return None
    if parsed.scheme.lower() not in {"http", "https"} or not parsed.hostname:
        return None
    if parsed.username is not None or parsed.password is not None:
        return None
    return urlunsplit((parsed.scheme.lower(), parsed.netloc, parsed.path or "/", parsed.query, ""))

def extract_urls(text: str) -> list[str]:
    found = {url for match in URL_PATTERN.findall(text) if (url := normalize_url(match))}
    return sorted(found, key=str.casefold)

def source_files(root: Path) -> list[Path]:
    files = [root / "DEEP_REVIEW_PROMPT_DE.md", root / "DEEP_REVIEW_PROMPT_EN.md"]
    manifest = root / "prompts" / "standalone" / "PROFILE_MANIFEST.json"
    data = json.loads(manifest.read_text(encoding="utf-8"))
    profiles = data.get("profiles", [])
    if not isinstance(profiles, list):
        raise ValueError("PROFILE_MANIFEST.json field 'profiles' must be a list")
    for profile in profiles:
        name = profile.get("file") if isinstance(profile, dict) else None
        if not isinstance(name, str) or Path(name).name != name:
            raise ValueError(f"Unsafe profile filename in PROFILE_MANIFEST.json: {name!r}")
        files.append(root / "prompts" / "standalone" / name)
    missing = [str(path.relative_to(root)) for path in files if not path.is_file()]
    if missing:
        raise FileNotFoundError("Missing reference source files: " + ", ".join(missing))
    return files

def is_moving_target(url: str) -> bool:
    return any(segment in urlsplit(url).path.lower() for segment in MOVING_SEGMENTS)

def _request(url: str, method: str, timeout: float):
    request = Request(url, method=method, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
    return urlopen(request, timeout=timeout)

def check_url(url: str, timeout: float = DEFAULT_TIMEOUT) -> LinkResult:
    started = time.monotonic()
    final_url, status, detail = url, None, ""
    try:
        try:
            response = _request(url, "HEAD", timeout)
        except HTTPError as error:
            if error.code not in {405, 501}:
                raise
            response = _request(url, "GET", timeout)
        with response:
            status, final_url = response.getcode(), response.geturl()
    except HTTPError as error:
        status, final_url = error.code, error.geturl() or url
        detail = str(error.reason or error)
    except (URLError, TimeoutError, OSError, ValueError) as error:
        detail = f"{type(error).__name__}: {error}"
    if status is None:
        category = "inconclusive"
    elif status in {403, 429}:
        category = "inconclusive"
        detail = detail or "Access denied or rate limited; not classified as dead"
    elif 200 <= status < 400:
        category = "ok"
        detail = detail or "HTTP response accepted"
    else:
        category = "failed"
        detail = detail or "HTTP response indicates a likely broken reference"
    if not detail:
        detail = "checked in {:.2f}s".format(time.monotonic() - started)
    moving = is_moving_target(url) or is_moving_target(final_url)
    return LinkResult(url, final_url, status, category, moving, detail)

def collect_urls(root: Path) -> tuple[list[str], list[str]]:
    files = source_files(root)
    urls: set[str] = set()
    for path in files:
        urls.update(extract_urls(path.read_text(encoding="utf-8")))
    return sorted(urls, key=str.casefold), [str(path.relative_to(root)) for path in files]

def audit(urls: Iterable[str], timeout: float, workers: int) -> list[LinkResult]:
    ordered = sorted(set(urls), key=str.casefold)
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        futures = [executor.submit(check_url, url, timeout) for url in ordered]
        return [future.result() for future in futures]

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="Repository root")
    parser.add_argument("--output", type=Path, help="Write JSON report to this path")
    parser.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT)
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--strict", action="store_true", help="Return exit code 1 for confirmed HTTP failures")
    args = parser.parse_args(argv)
    if args.timeout <= 0 or not 1 <= args.workers <= 32:
        parser.error("--timeout must be positive and --workers must be between 1 and 32")
    root = args.root.resolve()
    try:
        urls, files = collect_urls(root)
        results = audit(urls, args.timeout, args.workers)
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 2
    report = {
        "schema_version": 1, "sources": files, "unique_url_count": len(urls),
        "summary": {category: sum(item.category == category for item in results)
                    for category in ("ok", "failed", "inconclusive")},
        "results": [asdict(item) for item in results],
    }
    rendered = json.dumps(report, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
    print("Reference URL audit: {} unique URLs from {} source files".format(len(urls), len(files)))
    print("OK={ok} FAILED={failed} INCONCLUSIVE={inconclusive}".format(**report["summary"]))
    for item in results:
        status = str(item.status) if item.status is not None else "NO-HTTP"
        print("[{}] {}{} {}".format(item.category.upper(), status,
              " MOVING-TARGET" if item.moving_target else "", item.url))
        if item.final_url != item.url:
            print("  final: " + item.final_url)
        if item.category != "ok":
            print("  detail: " + item.detail)
    if args.output:
        print("JSON report: " + str(args.output))
    return 1 if args.strict and report["summary"]["failed"] else 0

if __name__ == "__main__":
    raise SystemExit(main())
