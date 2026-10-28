# Cryptiq backend

FastAPI service that turns a Bitcoin address into a risk signal (ALLOW / WARN / BLOCK / UNKNOWN)
from the Elliptic++ research graph. It is a **risk signal, not an accusation**, and the data is a
**research dataset, not the live blockchain**.

See `DECISIONS.md` for every assumption and `../docs/api-contract.md` for the API.

## Quick start (local)

```bash
cd backend
make setup                 # uv sync
cp .env.example .env       # then fill values
make run                   # http://localhost:8000/api/health , docs at /api/docs
make test lint
```

## Data pipeline

The Elliptic++ files are **not** in git (no stated licence). Download them yourself from the
Google Drive folder linked in https://github.com/git-disl/EllipticPlusPlus (folder "Actors Dataset")
and put these three files in `backend/data/raw/`:

```
data/raw/wallets_features.csv
data/raw/wallets_classes.csv
data/raw/AddrAddr_edgelist.csv
```

| Command | What it does |
|---|---|
| `make explore` | checks the schema and writes `artifacts/data_summary.json` (columns, label encoding, duplicates, self-loops, degree stats) |
| `make data` | `explore` + builds `data/processed/*.parquet` (wallets, edges, time-based splits, graph features) + downloads the OFAC list |
| `make fixture` | builds a **synthetic** fake dataset with `DEMO-` addresses under `data/fixture/` for offline work (set `DATA_DIR=./data/fixture`, `DEMO_MODE=true`) |

All scripts are idempotent (re-running overwrites outputs).
