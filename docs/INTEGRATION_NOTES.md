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

**Status: NOT DONE. The real data could not be downloaded from this environment.** No real metric,
split size, model card or demo-wallet verdict exists yet; nothing below is a result on real data.

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

**Status: NONE of these were run. Nothing below is a result; every row says "not tested" for a stated reason.**

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
