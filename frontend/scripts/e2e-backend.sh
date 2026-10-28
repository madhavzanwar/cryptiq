#!/usr/bin/env bash
# Starts the FastAPI backend on its SYNTHETIC fixture (DEMO-… wallets, isMock: true) for local dev and Playwright.
# Builds the fixture first when it is missing. Every start uses a fresh SQLite file, so sessions, the credit ledger
# and the in-process 10-minute check cache all begin empty (needed for deterministic end-to-end tests).
#   usage: bash scripts/e2e-backend.sh            (port 8000, or BACKEND_PORT=…)
set -euo pipefail
cd "$(dirname "$0")/../../backend"
PORT="${BACKEND_PORT:-8000}"
if [ ! -d data/fixture/processed ]; then
  echo "[e2e-backend] building the synthetic fixture (one time)…" >&2
  make setup
  make fixture
fi
DB="data/fixture/e2e-${PORT}.sqlite"   # one database per port, so two backends never share (or delete) each other's file
rm -f "$DB" "$DB-wal" "$DB-shm"
exec env \
  DATA_DIR=./data/fixture ARTIFACTS_DIR=./data/fixture/artifacts DEMO_MODE=true GRAPH_ENGINE=networkx \
  DATABASE_URL="sqlite:///./$DB" \
  uv run uvicorn app.main:app --host 127.0.0.1 --port "$PORT"
