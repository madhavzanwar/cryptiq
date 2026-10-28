# Backend decisions log

Every assumption, data finding and deviation from the brief. Newest sections are appended at the
bottom of each heading.

## Environment / process

- **The Elliptic++ CSVs could not be downloaded in the build sandbox.** The data lives on Google
  Drive (blocked by the sandbox network policy) and in the GitHub repo as Git LFS objects (the
  sandbox git proxy does not serve LFS for third-party repos). Consequences:
  - The schema below was verified from the **printed outputs of the dataset's own notebooks**
    (`Actors Dataset/Elliptic++_Actors_Dataset_Statistics.ipynb`), not from the files themselves.
    `scripts/explore_data.py` re-checks it against the real files and fails loudly on mismatch.
  - All code paths were exercised end to end on a **synthetic fixture** (`make fixture`) that
    reproduces the raw CSV format with fake `DEMO-` addresses. Nothing measured on the fixture is
    ever reported as a real metric: processed data and the model card carry
    `source: "synthetic_fixture"`, responses set `isMock: true`, `/api/benchmark` hides fixture
    model metrics.
  - **No real metric, latency or graph count exists yet.** They appear only after the human runs
    `make data && make train` on the real files.
- Python 3.11 target (`requires-python >=3.11`), `uv` for dependency management (`uv.lock` committed).
- `xgboost` (not `xgboost-cpu`): `xgboost-cpu` has no macOS wheels; teammates develop on laptops.
- Schema is created with SQLAlchemy `create_all` at startup (no alembic): tiny, disposable SQLite DB.
- SQLite runs every transaction as `BEGIN IMMEDIATE` (WAL mode). Credit deduction happens in the
  same transaction as the check log row, so two concurrent checks with one credit left serialise and
  exactly one succeeds. Run a single uvicorn worker per SQLite file.
- Rate limits are keyed on client IP, not the session cookie: an anonymous cookie can be dropped to
  reset a per-session limit. Behind a proxy, uvicorn runs with `--proxy-headers`.
- Anonymous sessions are abusable (clear cookies -> 3 new free credits). Accepted for a hackathon
  demo; the per-IP rate limit bounds it. Documented as a limitation.
- Seed-phrase guard uses the real BIP-39 English wordlist (MIT, bitcoin/bips): 12+ consecutive
  BIP-39 words anywhere in a text = secret. The `address` field additionally rejects any 12/15/18/21/24
  lowercase words. Private keys: 64 hex chars (optionally `0x`), WIF-shaped base58 (51 chars starting
  `5`/`9`, 52 starting `K`/`L`/`c`), `xprv`-style extended keys. The error never echoes the input and
  validation errors never echo request bodies.
- Address validation is implemented in-repo (base58check + BIP-173/BIP-350 bech32/bech32m reference
  algorithm) instead of the `bech32` PyPI package, so bech32m (taproot) is handled correctly; tested
  with BIP vectors and well-known addresses.

## Data findings (from the Elliptic++ notebooks; re-verify with `make explore`)

- `wallets_classes.csv`: columns `address, class`; **1 = illicit (14,266), 2 = licit (251,088),
  3 = unknown (557,588)**; 822,942 addresses.
- `wallets_features.csv`: 1,268,260 rows, columns `address`, `Time step` and 55 feature columns
  (the README's "56 features" counts `Time step`). One row per (address, time step) appearance;
  there are exact duplicate rows; within an address the feature values are lifetime aggregates
  (e.g. `first_block_appeared_in`, `last_block_appeared_in`, `num_timesteps_appeared_in` repeat).
  Note the real column name `num_txs_as receiver` contains a space.
- `AddrAddr_edgelist.csv`: columns `input_address, output_address`, 2,868,964 rows, **no time
  column**, directed (input -> output of the same transaction). Contains self-loops (an address
  paying change to itself) and duplicates.
- 49 time steps (about two weeks each).

## Pipeline outputs

- `data/processed/wallets.parquet`: one row per address: `label`, `first_step`, `last_step`,
  `n_appearances` and the 55 features of the address's **latest** appearance (rows are exact
  duplicates per address in the real data, so the choice rarely matters; `latest` is used to be
  deterministic).
- `edges.parquet` (`src`, `dst`): self-loops dropped, duplicates removed, direction kept, edges whose
  endpoint is missing from `wallets_classes.csv` dropped (counts recorded in `manifest.json`).
- `splits.parquet`, `graph_features.parquet`, `manifest.json` (`source` = `elliptic++` or
  `synthetic_fixture`).
- OFAC list: 532 lines on 2026-10-28, 531 pass mainnet checksum validation; the rejected entry is a
  TRON-format address mislisted in the XBT file. Matching is exact on the canonical form.
- Ransomwhere is optional and off by default (CC BY-NC 4.0). OpenSanctions downloads need an
  account/licence acceptance, so the export is downloaded manually to `RANSOMWHERE_PATH` (one
  address per line, or the OpenSanctions CSV with an `address`-like column).

## Split design

- **Time-based split on the first time step a wallet appears in**: train = steps 1-28, validation =
  29-34, test = 35-49. Mirrors the usual Elliptic protocol (train 1-34 / test 35-49) with the last six
  training steps held out to tune thresholds and calibration.
- Known leakage risks, documented rather than hidden:
  - Wallet features are lifetime aggregates, so a train wallet's features can include activity
    after step 28. They describe the wallet itself, never another wallet's label.
  - The edge list has no timestamps, so graph structure (degrees, PageRank, components) is computed
    on the full graph (transductive setting, as in the Elliptic++ paper).
  - Neighbour-label features use **train labels only** and exclude the wallet itself (next section).

## Graph features

- Computed offline with scipy sparse matrices (`app/services/datasets/processing.py`) and upserted
  into TigerGraph as vertex attributes (`pagerank`, `comp_id`, `comp_size`, `in_deg`, `out_deg`).
  Reason: the GSQL algorithm library may not be installable on the free tier, and computing once
  offline guarantees the model and TigerGraph use identical numbers.
- PageRank: directed, alpha 0.85, uniform teleport, dangling mass redistributed uniformly.
- Components: weakly connected (undirected view).
- Neighbour-label features: `nb1_illicit_train`, `nb1_licit_train` (distinct hop-1 neighbours),
  `walk2_illicit_train`, `walk2_licit_train` (2-step walks ending at a train-labelled wallet, minus
  walks that return to the wallet itself), `hops_to_illicit_train` in {1, 2, 3 = "3+ or none"}.
  2-step **walk** counts are used instead of distinct hop-2 node counts because distinct counts need
  A·A, which explodes around hubs (max degree is in the tens of thousands). `hops_to_illicit_train`
  is still exact: if no neighbour is a train-illicit wallet but a 2-walk reaches one, it is exactly
  2 hops away.
- The **displayed evidence** (per-hop counts, nearest illicit, subgraph) comes from the graph engine
  and uses the dataset labels of all wallets: that is the dataset's own labelling shown as evidence.
  The **model features** use the precomputed train-label-only features, so served scores match the
  measured test metrics.

## Model

- Two XGBoost models on labelled wallets only (illicit = 1, licit = 0): `baseline` (55 wallet
  features) and `with_graph_features` (+ 9 graph features). `scale_pos_weight` = neg/pos on train.
- Tiny grid (max_depth 4/6 x n_estimators 200/400) picked by **validation** PR-AUC. The serving model
  is the one with the better validation PR-AUC, **never** chosen on test.
- Monotone constraints on `nb1_illicit_train` (+), `walk2_illicit_train` (+), `hops_to_illicit_train`
  (-): more flagged neighbours can never lower the risk. Tested.
- Isotonic calibration fitted on validation; `riskScore = round(100 * p_calibrated)`.
- Thresholds per model chosen on validation: BLOCK = lowest score with precision >= 0.90, WARN =
  lowest score with precision >= 0.50 (below BLOCK), with floors WARN >= 10, BLOCK >= 50 (a calibrated
  probability under 50% never blocks). Calibration and thresholds share the validation split (small
  optimism, documented; the test split is untouched).
- Reported metrics (`model_card.json`, test split, illicit class): precision / recall / F1 where
  "predicted illicit" = score >= WARN (verdict WARN or BLOCK), the same mapping as the benchmark;
  also F1 at the BLOCK threshold, PR-AUC and confusion counts. `graphFeaturesImprovedTestF1` records
  plainly whether graph features helped; nothing is re-tuned after looking at test.
- Metrics measured on the synthetic fixture are never shown (`illicitF1Test: null`, `/api/benchmark`
  omits them); only `dataSource: "elliptic++"` cards surface numbers.
- Policy: an OFAC hit forces BLOCK, **including for addresses outside the dataset**. Such a response
  keeps `status: "not_in_dataset"`, `riskScore: null`, `labelHits.ofac: true` and is not charged.
- Demo wallets come only from the test split. `expected` is the verdict the trained system actually
  gives; wallets are picked where it agrees with the dataset label so the demo is predictable (a demo
  choice, not a metric).
- `model.joblib` is a local trusted artifact produced by `scripts/train.py`; never load one from an
  untrusted source (pickle).

## TigerGraph

- pyTigerGraph **2.0.5** (installed version; connection args read from its source):
  `TigerGraphConnection(host, graphname, gsqlSecret=...)` then `getToken(secret)` for Savanna/Cloud,
  or `username`/`password`. pyTigerGraph sets **no HTTP timeout** unless a `GSQL-TIMEOUT` header is
  set, so the engine sets the header (server-side abort) **and** enforces a client-side deadline
  (`TG_QUERY_TIMEOUT_S`, default 8 s) by running each call in a worker thread.
- Schema (`app/services/graph/gsql/schema.gsql`): `Wallet(PRIMARY_ID address, label, pagerank,
  comp_id, comp_size, in_deg, out_deg)`, directed `SENT_TO`, graph `Cryptiq`. The 55 wallet
  feature columns stay in Parquet (keeps the load small).
- Queries: `khop_exposure` (undirected BFS with a per-hop frontier `LIMIT` hub guard, per-hop label
  counts, nearest illicit hop, capped subgraph ordered by hop then illicit/unknown/licit, edges
  among the capped nodes in their original direction), `wallet_summary`, `graph_stats` (verification).
  **The GSQL was written from the GSQL v2 documentation but could not be compiled in the build
  sandbox (no cluster).** `make install-queries` will report any syntax error; the parser of the
  query output is unit-tested against the documented JSON shape.
- Graph features (PageRank, WCC) are computed offline (see "Graph features") and upserted as
  attributes; the GSQL algorithm library is not required.
- **Free-tier limits: not verified** (no account available in the build sandbox). The full graph is
  ~823k vertices / ~2.87M edges with 7 small attributes. If the cluster refuses it, run
  `make load-graph ARGS="--subset labelled-2hop"` (wallets within 2 hops of any labelled wallet) and
  record the exact counts from `artifacts/tg_load_summary.json` here; responses then carry a
  limitation line about the subset.
- Hub safety: per-hop frontier cap `MAX_FRONTIER` (5000) and the query timeout. On truncation the
  response sets `truncated: true` and adds a limitation line.

## Contract additions

See `docs/api-contract.md` -> "Backend additions".
