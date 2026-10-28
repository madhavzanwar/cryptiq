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

## Graph engines

| `GRAPH_ENGINE` | Use |
|---|---|
| `tigergraph` | primary. Needs `TG_HOST`, `TG_GRAPH`, `TG_SECRET` (or `TG_USERNAME`/`TG_PASSWORD`) |
| `networkx` | in-memory graph from `data/processed` (tests, offline dev, labelled fallback; ~2 GB RAM for the full graph) |

Responses always say which engine answered (`engine`). Replay (pre-recorded real responses for the
demo wallets) is a separate safety net; see "Demo safety".

### Loading TigerGraph (Savanna free tier)

1. Create a free workspace at https://tgcloud.io , create a database, then create a GSQL secret
   (Admin -> Users / Secrets, or `CREATE SECRET` in the GSQL shell). Put the host and secret in `.env`.
2. `make data` (processed Parquet must exist), then:

```bash
make load-graph        # creates the schema if missing, upserts in 50k chunks, resumable
make install-queries   # khop_exposure, wallet_summary, graph_stats
make verify-graph      # counts per label vs Parquet; exits 1 on mismatch
make test-tg           # NetworkX vs TigerGraph parity on 5 random wallets
```
