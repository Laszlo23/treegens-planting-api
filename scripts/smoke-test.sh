#!/usr/bin/env bash
# Quick checks that the planting FastAPI service is up. Run from repo root after:
#   docker compose up -d --build
#
# Usage:
#   ./scripts/smoke-test.sh                    # default http://127.0.0.1:8000
#   PLANTING_API_URL=https://api.example.com ./scripts/smoke-test.sh

set -euo pipefail
BASE="${PLANTING_API_URL:-http://127.0.0.1:8000}"
BASE="${BASE%/}"

echo "==> GET $BASE/healthz"
curl -sS -f "$BASE/healthz" && echo "" || {
  echo "FAILED: API not reachable at $BASE"
  exit 1
}

echo "==> GET $BASE/readyz"
curl -sS -f "$BASE/readyz" && echo "" || {
  echo "FAILED: readyz"
  exit 1
}

echo "OK — FastAPI health endpoints responded."
echo "Next: open $BASE/docs or run server/scripts/verify_video_fixture.py with a sample mp4 and INTERNAL_API_KEY."
