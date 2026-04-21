#!/usr/bin/env python3
"""POST a local video to /internal/verify-video."""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import httpx


def main() -> int:
    p = argparse.ArgumentParser(description="Test /internal/verify-video with a file.")
    p.add_argument("video_path", type=Path, help="Path to video (e.g. mp4).")
    p.add_argument(
        "--base-url",
        default=os.environ.get("PLANTING_API_URL", "http://127.0.0.1:8000"),
    )
    p.add_argument("--key", default=os.environ.get("INTERNAL_API_KEY", ""))
    p.add_argument("--lat", type=float, default=-6.2)
    p.add_argument("--lon", type=float, default=106.8)
    p.add_argument("--timeout", type=float, default=180.0)
    args = p.parse_args()

    if not args.key.strip():
        print("error: set INTERNAL_API_KEY or --key", file=sys.stderr)
        return 2
    path = args.video_path.expanduser().resolve()
    if not path.is_file():
        print(f"error: not a file: {path}", file=sys.stderr)
        return 2

    captured = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    url = f"{args.base_url.rstrip('/')}/internal/verify-video"
    mime = "video/mp4"
    suf = path.suffix.lower()
    if suf == ".mov":
        mime = "video/quicktime"
    elif suf == ".webm":
        mime = "video/webm"

    with open(path, "rb") as f:
        files = {"video": (path.name, f, mime)}
        data = {
            "captured_at": captured,
            "latitude": str(args.lat),
            "longitude": str(args.lon),
        }
        with httpx.Client(timeout=args.timeout) as client:
            r = client.post(
                url,
                headers={"X-Internal-Key": args.key},
                files=files,
                data=data,
            )

    print(f"HTTP {r.status_code} {url}")
    try:
        out = r.json()
        print(json.dumps(out, indent=2)[:8000])
        if r.status_code >= 400:
            return 1
        v = out.get("verification") or {}
        print(f"\naggregate_pass: {v.get('aggregate_pass')}")
        return 0
    except Exception as e:
        print(r.text[:2000], file=sys.stderr)
        print(f"error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
