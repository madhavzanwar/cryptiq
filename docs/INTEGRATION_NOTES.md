# Integration notes

Record of how frontend and backend were brought together on `integration/wire-up`, every decision
taken, and exactly what was and was not verified. Nothing here is an estimate: if it was not run, it
says "not run".

## 1. What was found (Phase 0)

- `main`: one commit (README only). `dev`: same commit. Untouched.
- Backend: nine stacked branches `backend/foundation` ... `backend/hardening-deploy` (linear; each is
  an ancestor of the next, checked with `git merge-base --is-ancestor`), plus `chore/repo-setup`.
- **Frontend: no application exists yet.** The only frontend work is the design system on
  `claude/wonderful-goodall-5nwkvk` (`frontend/DESIGN.md`, `design-preview.html`,
  `public/brand/logo-mark.svg`, `src/styles/tokens.css`, plus two agent-skill folders and
  `skills-lock.json`). There is no Next.js app, `package.json`, API client, `frontend/README.md`,
  `frontend/DECISIONS.md` or Playwright suite. That branch has **unrelated git history** (it was
  started from an empty repo), so it needed `--allow-unrelated-histories`.
- The environment this integration ran in has no `.env` files, no API keys, no Docker daemon, and
  no network access to Hugging Face, Google Drive, TigerGraph, Dodo or a Bitcoin explorer.

## 2. Merge record (Phase 1)

Merge commits only (no squash, no rebase), in this order:

1. `origin/chore/repo-setup` (repo skeleton, rules): clean.
2. `origin/backend/hardening-deploy` (brings in all nine backend branches): clean.
3. `origin/claude/wonderful-goodall-5nwkvk` (frontend design system, `--allow-unrelated-histories`):
   clean. No file overlapped: it only adds `frontend/*`, the two `*skills*` folders and
   `skills-lock.json`.

The conflicts the prompt predicted (`docs/api-contract.md`, `docs/CREDITS.md`, `README.md`,
`.gitignore`, `docs/openapi.json`) **did not occur**, because the frontend branch never created those
files. Resolution of the one real overlap: `backend/CREDITS.md` (staged rows) was appended to
`docs/CREDITS.md` and removed.

After merging: 146 backend tests pass (1 TigerGraph test skipped), ruff and `mypy --strict` clean.

Housekeeping done: removed unused `base58` dependency; declared `scipy` (imported directly by
`processing.py`); `uv.lock` regenerated.

## 3. What this environment could NOT do (needs the owner's laptop)

| Prompt D phase | Status | Why |
|---|---|---|
| 2 Wire the frontend | **blocked** (partly done) | No frontend app exists. Only the framework-agnostic API client layer was written (see section 5). |
| 3 Real data and real model | not run | Hugging Face / Drive unreachable. Loader for the Hugging Face file layout was prepared and tested on synthetic data. |
| 4 TigerGraph | not run | No cluster, no secret, host unreachable. GSQL has still **never been compiled**. |
| 5 Live integrations (LLM, Sarvam, Wispr, Dodo, testnet, EAS) | not run | No keys, hosts unreachable. |
| 6 Benchmark | not run | Needs real data, LLM key. |
| 7 Playwright / Lighthouse E2E | not run | No frontend app. Backend smoke test on the synthetic fixture passed earlier (11/11). |
| 8 Deploy | not run | No Docker daemon (image still **never built**), no Fly/Vercel accounts. |

## 4. Safety checks run

- `main` and `dev` untouched; no force pushes.
- Manual secret scan of the whole diff against `main`: only hit is the deliberately fake Standard
  Webhooks test secret (`whsec_` + base64 of "cryptiq-test-secret-not-real-0001"). `gitleaks` was
  **not run** (not installed in this environment); run it on your laptop before the `dev` -> `main` PR.
- No data, model, `.env` or SQLite file is tracked (`git ls-files` check).

## 5. Work done in parallel (three agents, disjoint files) and how it was integrated

| Agent | Scope | Result | Verification by the integrator |
|---|---|---|---|
| A | Hugging Face file layout (no `wallets_classes.csv`), Git-LFS pointer detection | merged (`integration/data-loader`) | merged tree: 155 tests, ruff, mypy |
| B | Typed TypeScript API client, zod schemas, SSE reader, reportHash verifier, 96 unit tests, in `frontend/src/lib/api/` only (framework-agnostic: no `package.json` created) | merged (`integration/api-client`) | re-run from the merged repo copy in a scratch project: `tsc --noEmit` clean, 96/96 tests |
| C | Read-only adversarial review of the merged backend | findings below | its double-charge claim was reproduced by the regression test; fixes in section 6 |

No two agents had overlapping files; the only shared files (`docs/*`, `pyproject.toml`, `uv.lock`) were
edited only by the integrator.

## 6. Review findings

See `backend/DECISIONS.md` -> "Adversarial review of the merged backend": 13 items fixed (with regression
tests) and the list of known issues that were found but not fixed.

Current verification state (synthetic data only): **174 backend tests pass (1 TigerGraph test skipped),
ruff clean, mypy --strict clean; 96 TypeScript client tests pass.**

## 7. Frontend: what exists and what is needed

`frontend/src/lib/api/` is ready to import. The Next.js app itself must still be created (by the
teammate or on request) with:

- `zod` and (dev) `vitest` dependencies; `NEXT_PUBLIC_API_BASE_URL` empty (same origin);
- `next.config` rewrites: `{ source: "/api/:path*", destination: `${process.env.BACKEND_URL}/api/:path*` }`
  so the session cookie is first-party (this is required for payments, see `backend/DEPLOY.md`);
- UI rules from the contract: TigerGraph badge only when `engine === "tigergraph"`; "Replay" label for
  `replay`; "cached, no credit used"; "results truncated" note; 402 opens the credits drawer;
  `secret_input` shows the seed-phrase warning; 503 `voice_unavailable` uses browser speech recognition.

## 8. Second integration round (the partner's push)

- Fetched all branches. The partner's new work is `frontend/design-system` (identical tip `59f2299` to
  `claude/wonderful-goodall-5nwkvk`): logo concepts, motion CSS/JS, nav docs, HTML previews. **Still no
  Next.js app** (`frontend/package.json`, `src/app`, components, mock layer and Playwright config are all
  absent from every branch). Merged with a merge commit; no conflicts (it only adds `frontend/` design files).
- Because there is no app, these Phase 2 items are **not done**: `next.config` rewrites, UI badges and
  labels, Playwright happy path and axe checks, `next build`, frontend lint/typecheck/test. They have
  nothing to attach to; no app was invented.
- Done: `frontend/.env.example` (names only); root README "Run everything"; `backend/.env.example`
  gained `TRUST_FLY_CLIENT_IP`.
- When the app exists, add this rewrite and the UI rules from section 7:

```js
// next.config.js
module.exports = { async rewrites() {
  return [{ source: "/api/:path*", destination: `${process.env.BACKEND_URL}/api/:path*` }];
} };
```

- Expected conflicts when the real app lands: `frontend/src/lib/api/*` (keep the app's client and mocks as
  the base; add only the missing pieces: `credentials: "include"`, the additive response fields, error
  codes with EN/HI messages, cookie-aware SSE via fetch, `reportHash` verification), `README.md`,
  `.gitignore`, `docs/api-contract.md`, `docs/CREDITS.md` (docs keep the union).

## 9. Live run, step 1: real Elliptic++ data (branch `backend/live-run`)

**Status: SUPERSEDED by section 12 (network access was opened; the real data was downloaded and used).**
The text below is the historical record of why it was blocked earlier.

### What blocked it (verified, not assumed)
- `huggingface.co` and `drive.google.com`: the environment's network policy denies the connection (the
  proxy answers HTTP 403 to CONNECT; seen again in this session). `github.com` pages are denied too.
  The Git-LFS route also fails (the proxy serves no LFS objects for third-party repos).
- No computer folder was attached to this session, so the download could not be done on the owner's machine.
- To unblock: in the environment settings (cloud environment menu in the session title bar, then Edit,
  Network access), allow `huggingface.co` (and its CDN, e.g. `cdn-lfs.huggingface.co` and
  `*.hf.co`) or `drive.google.com` and `*.googleusercontent.com`, or choose a broader access level. Or run
  the same commands on a laptop.

### What was prepared so the next run is one command
- `make download` (`scripts/download_data.py`): Hugging Face (`huggingface_hub`) or Google Drive (`gdown`);
  afterwards it verifies: Git-LFS pointers (exit 1), files smaller than 1 MB (exit 1), missing files
  (exit 1), and row counts versus the published figures (a mismatch is printed and exits 2; it is never
  hidden). `make verify-data` checks without downloading. 5 unit tests.
- By default only `wallets_features_classes_combined.csv` and `AddrAddr_edgelist.csv` are fetched: the
  combined file already contains the features and the class, and the pipeline supports it.
- Then, in order: `make explore` (read `artifacts/data_summary.json` before anything else: column names,
  label encoding, time steps, duplicates, hubs), `make data`, then `make train` (which also runs
  `export_demo_wallets`).

### Real-volume stress test (SYNTHETIC content at the exact published size)
`scripts/scale_check.py` generates random data with the published counts (822,942 wallets; 1,268,260
feature rows; 2,868,964 edges; 14,266 / 251,088 / 557,588 illicit / licit / unknown; heavy-degree hubs;
self-loops and duplicate edges) in the Hugging Face layout and runs each stage in its own process on this
environment (4 CPUs, 16 GB RAM). **Only time and memory are measurements; model metrics from random data
are meaningless and are not reported.**

| Stage | Wall time | Peak RSS |
|---|---|---|
| explore (read, schema check, summary) | 31.8 s | 3,118 MB |
| build (parquet, splits, graph features incl. PageRank, components) | 39.9 s | 3,305 MB |
| train (baseline + graph model, 4-point grid each) | 53.3 s | 1,070 MB |
| serve (load scorer, then 500 scorings) | load 1.35 s; score median 15.2 ms, p95 19.7 ms | 1,053 MB |

Conclusion for the real run: the pipeline fits comfortably in 16 GB, so **no chunked loading and no
subsampling is needed at this size** (the generated combined CSV is 1.36 GB; the authors' Git-LFS pointer lists about 609 MB for the real
combined file, so the real read will be lighter on I/O; row counts are what matter). A 2 GB Fly machine is consistent with the measured ~1.05
GB serving footprint. These timings are for random data and will differ somewhat on the real data (for
example XGBoost training time depends on the data), so they must be re-measured on the real run.

### Decisions
- **polars is not added.** The project uses pandas + pyarrow; the measurement above shows the pipeline is
  fast enough (explore + build about 72 s at full size), so a new dataframe library would add risk for no
  measured gain. (The task text said polars is "already in the project"; it is not.)
- **shap is not added.** Per-wallet "which features mattered" already uses XGBoost
  `predict(..., pred_contribs=True)`, which computes exact TreeSHAP values; the `shap` package would add a
  dependency for the same numbers.
- The leakage guarantees (a wallet's own label and validation/test labels never influence any feature;
  neighbour-label features use training labels only) are enforced by existing tests that run the SAME
  functions the real pipeline uses: `tests/test_processing.py::test_no_label_leakage` and
  `tests/test_model.py::test_test_wallet_label_does_not_change_its_score`. They run on every `make test`;
  they have not been run on real data because the real data is not available here.

### Still to do on the real data (in order)
1. Unblock the network (or run on a laptop), `make download`, confirm the counts match. Report any mismatch.
2. `make explore`; fix any assumption the synthetic fixture got wrong (label encoding, column names, time
   steps) and add a regression test per fix.
3. `make data`, `make train`; record the real model card here (split sizes, illicit-class precision, recall,
   F1, PR-AUC for baseline vs graph model). If graph features do not help, say so plainly.
4. `artifacts/demo_wallets.json` from the TEST split (one BLOCK, one WARN, one ALLOW, one wallet truly absent
   from the data); verify the live model reproduces each verdict.

## 10. Live run, steps 2 to 4 (TigerGraph, external integrations, replays, benchmark)

**Status when this section was written: NONE of these were run (no network, no keys). Superseded in part by section 13, which has the results of the first live run; rows below that section 13 contradicts are out of date.**

### Preconditions checked (not assumed)
- `backend/.env` does not exist, and no `TG_*`, `LLM_*`, `SARVAM_*`, `WISPR_*`, `DODO_*`, `BTC_*` or
  `ADMIN_TOKEN` variable is set in the environment.
- E1 (real data) is not done (`data/raw` and `data/processed` do not exist), so there is no graph to load,
  no trained model, no demo wallets.
- The network policy denies the hosts these steps need: `tgcloud.io` / `www.tigergraph.com`, `api.sarvam.ai`,
  `platform-api.wisprflow.ai`, `test.dodopayments.com`, `mempool.space`, `huggingface.co` (HTTP 000 / proxy
  403). `api.anthropic.com` answers (404) but there is no key. No `dodo` CLI or `cloudflared` is installed.
- A separate agent for the integration checks was deliberately NOT started: it would have no keys and no
  network, and the only way to "pass" would be to fake results.

### PASS / FAIL table
| Check | Result | Why |
|---|---|---|
| TigerGraph: free-tier limits read (Savanna FAQ) | not tested | docs host unreachable; limits remain unverified |
| TigerGraph: schema + chunked load | not tested | no cluster, no secret, no data |
| TigerGraph: GSQL queries compile / run | not tested | no cluster. The GSQL has still **never been compiled** |
| TigerGraph vs NetworkX agreement (demo + 50 random wallets) | not tested | needs the above |
| TigerGraph latency p50 / p95 over >= 50 calls | not measured | needs the above |
| Hub safety (frontier cap, timeout, `truncated`) on a real cluster | not tested | needs the above. Logic is unit-tested on NetworkX only |
| LLM: 4 verdicts x EN/HI, groundedness validator, template fallback, provider token usage | not tested | no key. Validator and fallback are unit-tested with a fake LLM |
| Sarvam STT (EN, HI), failure paths | not tested | no key, host blocked. Request shape follows the SDK source |
| Sarvam TTS + `/api/audio/{hash}.mp3` | not tested | no key, host blocked |
| Wispr | not tested | no `WISPR_API_KEY`. Nothing in the app claims Wispr was used |
| Dodo test checkout, webhook exactly-once, bad signature rejected | not tested live | no key, host blocked, no CLI. Signature check and idempotency are unit-tested against a reference vector |
| Bitcoin testnet invoice (explorer URL works for the network?) | not tested | no explorer reachable, no wallet. Explorer URL liveness remains unverified |
| `make record-replays` against live TigerGraph | not run | needs TigerGraph + real data |
| Replays offline (`DEMO_REPLAY=true`) | **PASS (mechanism only, synthetic data)** | new test `test_demo_replay_never_touches_the_engine`: the graph engine raises if called, yet the response is served, labelled `engine: "replay"`. Not a Wi-Fi-off test on real data |
| Benchmark N=10 then N=25, token-budget guard on real data | not run | needs E1 + LLM key. The guard and the job are unit-tested with a fake LLM |

### What was built so the real run is mechanical (all unit-tested offline, 192 backend tests pass)
- `--max-vertices N` for `scripts/load_tigergraph.py`: the free-tier subset, exactly as specified: **every
  illicit wallet first, then their 1-hop and 2-hop neighbours, then licit wallets and their neighbours, then
  a seeded random sample** to fill the budget; edges are the induced subgraph. Deterministic (the subset is
  recorded as `budget:<N>:<seed>` and recomputed by `verify_graph`). Per-tier counts and label counts are
  written to `artifacts/tg_load_summary.json`. Because a kept wallet can lose neighbours that were left out, a
  subset deployment must be compared with NetworkX built from the SAME subset (the script does this) and
  responses carry a limitation line.
- `make smoke-queries` (`scripts/smoke_queries.py`): one check per GSQL query on a real illicit wallet.
- `make compare-engines` (`scripts/compare_engines.py`): TigerGraph vs NetworkX on the demo wallets plus 50
  random wallets (counts per hop, nearest-illicit hop, node and link sets when uncapped); truncated results are
  reported as skipped, never as passed; wall-clock p50 / p95 (nearest-rank) over >= 50 real calls, plus the
  engine-reported time; the top-degree wallets with the `truncated` flag, outcome and a hang detector.
  Negative tests prove a corrupted engine is detected.

### Free-tier decision (to make with real numbers)
Not decided: the FAQ could not be read. Procedure for the real run: try `make load-graph` (full graph:
822,942 vertices, 2,868,964 edges before dedupe/self-loop removal); if the cluster refuses it, rerun with
`--max-vertices <N>` for the largest N that loads, then record N, the tier counts and the label counts here.

### What is needed from the owner to continue
1. E1 done (real data processed and the model trained) and `backend/.env` filled in (names in `.env.example`).
2. For each external service, either allow its host in the environment's Network access settings or run on a
   laptop: Savanna (`*.tgcloud.io`), Sarvam, Wispr, Dodo test, an Esplora explorer for the chosen testnet.
3. The Dodo CLI (or a `cloudflared` tunnel) for webhooks; a testnet wallet with test coins.
Then, in this order: `make load-graph install-queries smoke-queries verify-graph compare-engines`, the
integration checks, `make record-replays`, then the benchmark (N=10, then N=25).

## 11. Docker image and deployment (everything free; NOTHING deployed)

**Not deployed.** No account or token exists for any host and the hosting APIs are blocked from the sandbox.
No paid resource was created. Details and the free procedure: `docs/DEPLOY_NOTES.md`; demo procedure:
`docs/DEMO_RUNBOOK.md`.

### Measured here (local Docker 29.9, synthetic fixture)
| Item | Result |
|---|---|
| Image build | first successful build ever; 36.8 s warm, 1 m 47 s cold |
| Image size | 952 MB, down from 4.05 GB |
| `APP_ENV=prod` container + `scripts/smoke.py` | 11/11 PASS; Docker HEALTHCHECK `healthy` |
| `/api/health` in the container | `engine=networkx`, `engineOk`, `modelLoaded`, `ofacLoaded: true`, `dataSource: synthetic_fixture`, `mocks: true` |
| `/api/check` latency (80 calls, synthetic, NetworkX) | median 8 ms, p95 21 ms (not representative of TigerGraph + LLM) |

### Problems found by actually building, and fixes
1. **Image 4.05 GB.** (a) XGBoost's default Linux wheel pulled ~470 MB of NVIDIA CUDA libraries a CPU host never
   uses: now `xgboost-cpu` on Linux via an environment marker (same module; venv 1,201 MB to 524 MB).
   (b) `chown -R /app` after installing copied the whole virtualenv into a second layer: the user is now
   created first and files are copied with `--chown`.
2. **`libgomp1` is not needed:** measured, the XGBoost wheel imports in `python:3.11-slim` without it. Removed.
3. **Healthcheck depended on `curl`** (an apt package): replaced with a Python one-liner.
4. **Hard-coded port 8000:** the image now listens on `$PORT` (free hosts such as Hugging Face Spaces choose it).
5. **No way to get the git-ignored data into a free host without a volume:** `scripts/fetch_artifacts.py`
   (+ `docker-entrypoint.sh`) downloads `data/` and `artifacts/` from a PRIVATE Hugging Face repo at start-up
   (allowlisted paths, path-traversal safe, size cap, token never logged). 9 tests with a mocked transport; not
   exercised against the real service.
6. **Base image / apt:** `BASE_IMAGE` and `INSTALL_FFMPEG` build arguments. In the sandbox Docker Hub returned
   429 (anonymous rate limit) so the base came from `mirror.gcr.io`, and Debian mirrors were unreachable, so the
   `ffmpeg` apt step was **not** exercised.
7. Free LLM tiers (Groq / Gemini / OpenRouter use an OpenAI-compatible base URL with a path): a regression test
   confirms `.../openai/v1` + `/chat/completions` is joined correctly.

### Not done (needs you)
Create the Hugging Face Space and private artifact repo (steps in `docs/DEPLOY_NOTES.md` 3.1 to 3.2), set the
Dodo webhook URL, then run `scripts/smoke.py` against the deployed URL. The deployed smoke test, the webhook
setting and the cost confirmation are therefore **not done**; the cost of this route is $0 by design.

## 12. Real Elliptic++ data, real model (run on this environment: 4 CPUs, 16 GB RAM)

Network access was opened; everything below was **run for real**, no mocks.

### Download and verification (`make download`)
Source: Hugging Face mirror `AI4FinTech/ellipticpp`. Files: `wallets_features_classes_combined.csv`
(609,000,048 bytes, 1,268,260 rows) and `AddrAddr_edgelist.csv` (200,631,481 bytes, 2,868,964 rows). No Git-LFS
pointers; **both row counts match the published figures exactly**; the byte sizes match the sizes in the
authors' own LFS pointers. No mismatch to report.

### `make explore` findings (23.1 s, 2,439 MB peak): every assumption held, nothing needed fixing
| Item | Real value |
|---|---|
| Label encoding | 1 = illicit 14,266; 2 = licit 251,088; 3 = unknown 557,588 (822,942 unique addresses, one class each) |
| Feature rows / columns | 1,268,260 rows; `address`, `Time step`, 55 features; time steps 1 to 49 |
| Duplicates | 347,569 exact duplicate feature rows; max 1,471 rows for one address |
| Features constant within an address | yes (0 rows differ), so "latest appearance" is exact |
| Edges | no time column; 45,981 self-loops; 84,620 duplicate edges; 6,326 reciprocal edges |
| Degree | max 37,841; median 2; p99 74; 256 wallets above degree 1,000 |
| Integrity | every edge endpoint exists in the class table |

### `make data` (34.1 s, 3,337 MB peak)
Edges after removing self-loops and duplicates: 2,775,637. Graph: **2 weakly connected components**, the largest
holds 822,935 of 822,942 wallets. Time-based split (first time step 1-28 / 29-34 / 35-49):

| Split | Wallets | Illicit | Licit | Unknown |
|---|---|---|---|---|
| train | 458,733 | 7,230 | 142,300 | 309,203 |
| val | 72,107 | 2,147 | 21,226 | 48,734 |
| test | 292,102 | 4,889 | 87,562 | 199,651 |

OFAC list: 532 lines, 531 pass checksum validation.

### `make train` (29.4 s, 1,026 MB peak): real model card, test split, illicit class (4,889 illicit of 92,451 labelled)
Serving model (chosen on VALIDATION PR-AUC only): `with_graph_features` (val PR-AUC 0.7382 vs baseline 0.6172).
Serving thresholds chosen on validation: WARN 10, BLOCK 71.

| | Baseline (55 features) | With graph features (64) |
|---|---|---|
| PR-AUC (threshold-free) | 0.3394 | **0.4342** |
| At the model's WARN threshold (baseline 21, graph 10): precision / recall / F1 | 0.2352 / 0.4772 / **0.3151** | 0.1325 / 0.6889 / 0.2223 |
| Confusion at WARN (tp / fp / fn / tn) | 2,333 / 7,588 / 2,556 / 79,974 | 3,368 / 22,049 / 1,521 / 65,513 |
| At the model's BLOCK threshold (baseline 73, graph 71): precision / recall / F1 | 0.6848 / 0.0951 / 0.1670 | 0.4930 / 0.4377 / **0.4637** |
| Confusion at BLOCK | 465 / 214 / 4,424 / 87,348 | 2,140 / 2,201 / 2,749 / 85,361 |

### What these numbers say, plainly (nothing was tuned on the test split)
1. **Graph features do NOT win on every measure.** They improve ranking quality (test PR-AUC 0.4342 vs 0.3394)
   and are far better at the BLOCK level (F1 0.4637 vs 0.1670; recall 0.4377 vs 0.0951), but at the WARN
   threshold the graph model has the **lower** F1 (0.2223 vs 0.3151). `graphFeaturesImprovedTestF1` is `false`
   by the defined metric (F1 at the WARN threshold). The benchmark page must show F1 and PR-AUC side by side
   (`prAuc` was added to the API for this).
2. **Temporal drift breaks the validation-chosen WARN threshold.** Validation PR-AUC falls to test PR-AUC
   (baseline 0.6172 to 0.3394; graph 0.7382 to 0.4342), and the graph model's WARN threshold of 10 (the policy
   floor) flags **22,049 of 87,562 licit test wallets (25.2%)**, against 7,588 (8.7%) for the baseline. At BLOCK
   the licit false-positive rate is 2.5% (graph) vs 0.2% (baseline). This is consistent with the published
   concern that graph models degrade under temporal distribution shift. Not fixed: any change chosen by looking
   at the test split would be test-set tuning. Options for the owner to decide: raise the WARN floor as a policy
   choice, show WARN as "weak signal", or re-split in time and re-validate.
3. **Data age.** Wallets in this dataset were active roughly 2016 to 2018 (inferred from block heights in the
   dataset's own notebooks; not confirmed from the paper), so almost any wallet a user checks today will be
   UNKNOWN. Live value is mostly the OFAC list plus dataset hits. State this on stage.
4. Explanation wording: a model attribution such as "known-licit wallets two steps away raised the risk" is
   faithful to the model but reads as contradictory; kept as is and listed as a known issue.

### Leakage, verified on the REAL graph (`tests/test_leakage_real.py`, skipped when the data is absent)
(a) Setting every validation and test label to "illicit" changes no feature of any wallet. (b) Flipping the
labels of 200 independent training wallets (pairwise at least 3 hops apart) leaves their own features
unchanged, while other wallets' features do change (so the check is not vacuous). **Mutation-tested:** injecting
an own-label leak, and injecting a val/test-label leak, each makes the test fail; both were reverted.

### Demo wallets (`artifacts/demo_wallets.json`, local only, test split, real addresses)
3 BLOCK (dataset label illicit), 3 ALLOW (licit), 1 WARN (borderline; unlabelled in the dataset), 1 UNKNOWN
(`bc1p0xlx...` has 0 occurrences in both raw files, grep-verified). All 8 checksum-valid. The live API
(NetworkX engine, real data) reproduced every expected verdict (smoke test 11/11 PASS). The addresses are real
public Bitcoin addresses carrying a research-dataset label; present them as "labelled illicit in the Elliptic++
research dataset", never as an accusation.

### Serving measurements on the real data
| Item | Result |
|---|---|
| Scorer only (what a TigerGraph-backed deployment needs): load / peak RSS | 1.1 s / 1,006 MB; score median 14.4 ms, p95 20.3 ms |
| Full API with the NetworkX engine (graph in memory): startup / RSS | 28 s / 2,605 MB |
| `/api/check`, 80 calls, NetworkX engine, templates (no LLM), cache off | median 36 ms, p95 60 ms |

Sizing: a 2 GB machine is enough only for a TigerGraph-backed (or replay-only) deployment; the NetworkX engine
needs about 2.6 GB. TigerGraph query time, LLM time and anything over the network were **not measured**.

### Still not done at this point
TigerGraph (no cluster or secret), live LLM / Sarvam / Wispr / Dodo / testnet calls (no keys), benchmark (needs an
LLM key), replays against a live engine, deployment.


## 13. First live run (network open; keys: Groq only; TigerGraph not available)

Everything below was measured on this environment (4 CPUs, 16 GB RAM) on 2026-10-28. Nothing is estimated. Secrets were
supplied through the environment and are not in the repository.

### PASS / FAIL table

| Check | Result | Measured detail |
|---|---|---|
| Esplora explorer client vs real networks | **PASS** | `find_payment` run against live data: mempool.space signet (tip 328,405) and testnet4 (tip 157,927) matched a real recent tx by txid with 4 confirmations; a wrong amount returned no match. Blockstream testnet (tip 5,222,301) also parsed, but the picked address had several txs of the same amount (298 sats) and the newest was returned: the design relies on the random 1..999 sat offset plus the `created_at` filter, not on the amount alone |
| Docker build with ffmpeg (`INSTALL_FFMPEG=true`) | **PASS** | built in 1 m 10 s; image **1.58 GB** (952 MB without ffmpeg). Sandbox-only change: apt switched to HTTPS because the sandbox proxy rejects plain HTTP (405); the repository Dockerfile is unchanged |
| Audio conversion inside the image | **PASS** | the app's own `to_wav_16k_mono`: 3 s WebM/Opus (28,789 B) to 16 kHz mono WAV (96,078 B); `max_seconds=1` gives `audio_too_long`; garbage gives `audio_unreadable` |
| Replays recorded on real data | **PASS (engine: networkx)** | 8 wallets x EN/HI = 16 files (BLOCK x3, ALLOW x3, WARN, UNKNOWN). Recorded from the NetworkX engine, NOT TigerGraph; each file says `engine: networkx`. Template explanations (no LLM at the time) |
| Offline replay (`DEMO_REPLAY=true`, engine host unreachable, data dir empty, model not loaded) | **PASS** | 16/16 `/api/check` answers served with `engine: "replay"`; the `ms` shown is the recorded time (first call 653.68 ms), not a live one |
| LLM through `openai_compatible` + provider-reported usage | **PASS** | Groq, model `qwen/qwen3.8-27b`, JSON mode on. Four verdicts, one call each (EN and HI together): BLOCK 526 in / 328 out tokens, 1,283 ms; ALLOW 530 / 312, 2,308 ms; WARN 514 / 255, 1,183 ms; UNKNOWN 436 / 213, 1,262 ms. Tokens are provider-reported |
| Groundedness validator | **PASS** | UNKNOWN: the Hindi text was rejected twice (`missing insufficient-evidence statement`), so only Hindi fell back to the template while English came from the LLM. An earlier run rejected an ALLOW text that mentioned sanctions without an OFAC hit |
| Template fallback | **PASS** | dead endpoint: template for both languages, 2.3 s total. Free-tier HTTP 429 (several calls inside one minute) also fell back to templates, never an error |
| Free-tier limit that matters | measured | Groq response headers reported 1,000 requests and 8,000 tokens as the limits (window not read). One check spends about 0.5 to 0.9 k tokens, so a burst of checks hits 429 and gets templates |
| Weak local model, for the record | measured | Qwen2.5-1.5B Q4 on CPU: output was not JSON (8/8 attempts unparseable) until `LLM_JSON_MODE=true`; its Hindi looped to the token limit; 15 to 48 s per call, far above the 8 s deadline, so it fell back to templates in production settings |
| Benchmark N=10, local Qwen2.5-1.5B Q4 (CPU) | measured, **not a quality result** | `raw_dump`: 9,251 mean input tokens, median 60,617 ms, 50.0 % accurate (it answered illicit for 10/10 wallets, so 50 % is the sample's base rate); `graph_evidence`: 198.9 tokens, median 6,607 ms, 20.0 % accurate; unparseable 0 in both. Same model, same wallets. Only the token and latency gap is informative |
| Benchmark N=10 and N=25, Gemini `gemini-3.1-flash-lite` (via the OpenAI-compatible endpoint, JSON mode) | **measured** | see the table below. 0 failed, 0 unparseable calls in both runs. Provider-reported input tokens; real data, NetworkX engine, same 25 wallets (12 illicit, 13 licit, test split, seed 1234) for both methods |
| Benchmark N=25 on the local 1.5B model | not measured | that run was killed at 24 % by a stray `pkill`; superseded by the Gemini run |
| Benchmark on Groq free tier | not run | 8,000 tokens per minute is below the raw dumps (mean 10,931, max 19,264 tokens at N=25); Gemini was used instead |
| TigerGraph Community Edition (local Docker, v4.2.5) | **FAIL (environment)** | schema created on the engine; data upsert failed with `SYS-0001` because GSE could not start: `System hard limit of file descriptors is 20000. The expected is no less than 65535`. The sandbox cannot raise it, and it was not bypassed. GSQL queries therefore remain **never compiled**; no TigerGraph counts, comparison or latency |
| TigerGraph Savanna | not tested | needs an account (credits only, no free instance per its FAQ) |
| Sarvam STT / TTS (`saaras:v4`, `bulbul:v4-flash`) | **PASS** | first call: SDK `text_to_speech.convert` (hi-IN) returned a valid 22,050 Hz mono WAV (2.00 s, 88,244 B); `speech_to_text.transcribe` of that file returned the identical sentence. The app's own `TTS.synthesize` produced MP3s (en 98,220 B, hi 96,966 B) and `sarvam_transcribe` recovered the text (en exact; hi exact); a bad key gives `UpstreamError(sarvam, http 403)`. Quirk: Hindi audio sent with `language_code=en-IN` comes back translated to English, and English audio sent as `hi-IN` comes back in Devanagari transliteration. Free-credit balance and rate limits not read |
| Wispr | not tested | host reachable, no key. Nothing in the app claims Wispr |
| Dodo test checkout, webhook exactly-once, bad signature | not tested live | host reachable (403 on `/`), no key. Signature and idempotency remain unit-tested only |
| Bitcoin testnet invoice end to end | not tested | explorer proven above; no receive address or test coins |
| Base Sepolia / EAS | not tested | RPC and easscan reachable; no wallet or schema |

### Code changes made because of this run
- `LLM_JSON_MODE` (default off): sends `response_format=json_object` to OpenAI-style providers. Needed for weak models;
  unit-tested (`test_json_mode_is_opt_in_and_sent_only_when_enabled`).
- `scripts/check_llm.py` (`make`-less, run with `uv run python -m scripts.check_llm [--deadline 8] [--pause 30]`): the live
  LLM proof above; writes `artifacts/llm_check.json` (git-ignored).

### Still open
TigerGraph (needs Savanna or a machine where the Community Edition can start), Sarvam, Dodo, Wispr, testnet invoice,
Base Sepolia attestation, a provider with a large enough token limit for the benchmark, benchmark N=25, deployment.


### Benchmark results (real, `artifacts/benchmark_results.json`, measured 2026-10-28)
Question: does a compact graph summary (`graph_evidence`) give the LLM what it needs, at a fraction of the input, compared with
dumping the raw features and up to 300 labelled edges (`raw_dump`)? The wallet's own label, the model score and the verdict are
hidden from both methods. Predicted illicit = WARN or BLOCK; truth = dataset label.

| N | Method | Mean input tokens | Median latency | Accuracy | Confusion (illicit as positive) |
|---|---|---|---|---|---|
| 10 | raw_dump | 9,032.7 | 3,614 ms | 100.0 % | not computed |
| 10 | graph_evidence | 186.9 | 2,647 ms | 90.0 % | not computed |
| 25 | raw_dump | 10,931.0 | 2,215 ms | 96.0 % | TP 12, FN 0, FP 1, TN 12 |
| 25 | graph_evidence | 187.2 | 2,211 ms | 72.0 % | TP 12, FN 0, FP 7, TN 6 |

What this does and does not support:
- **Supported:** `graph_evidence` used about 58 times fewer input tokens (187.2 vs 10,931.0 mean at N=25) and found every illicit
  wallet (0 false negatives in both methods). Latency is about equal (median 2,211 vs 2,215 ms), so the saving is cost and context
  size, not speed.
- **Not supported:** that the compact method is as accurate. At N=25 it flagged 7 of 13 licit wallets (accuracy 72 % vs 96 %).
  The raw dump includes the wallet's own 182 features, which the compact summary does not, so this compares two different
  information sets, not "graph vs no graph".
- One model, one seed, 25 wallets: the accuracy gap has wide uncertainty and was not tested for significance.
- The earlier local 1.5B model result (N=10: 50 % vs 20 %) is not comparable and should not be quoted.
- Code change from this run: the benchmark now retries transient upstream errors (4 attempts, backoff) and records a call that
  still fails as `failed` instead of aborting (a Gemini 503 had crashed the first attempt).
