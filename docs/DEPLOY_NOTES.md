# Deploy notes (free path, $0)

**Status: NOTHING IS DEPLOYED. CORRECTION (2026-10-28): the plan below named Hugging Face Docker Spaces as free. That is
wrong. Creating one through the API returned `402 Payment Required: hosting Gradio and Docker Spaces on free cpu-basic
requires a PRO subscription` (only static Spaces are free). Nothing paid was created.**

What WAS done: the container builds, starts and passes the smoke test locally (section 1); the processed data, model and
replays were uploaded to a **private** Hugging Face dataset repo (`madhavzanwar/cryptiq-artifacts`, 28 files, 232.0 MB,
free), so any host that can run the container can fetch them with `ARTIFACTS_REPO` + a read token.

### Free hosting options, checked or measured
| Option | Result |
|---|---|
| Hugging Face Docker Space | **Not free** (402, PRO required) |
| Koyeb free instance | Its FAQ: 512 MB RAM, 0.1 vCPU, **credit card required**. Too small for the full app (about 1.0 GB scorer) |
| Laptop + free `cloudflared` tunnel (3.6) | Free, no card, runs the full real model. Needs the laptop online. Not tested from here (cloudflared cannot be downloaded in the sandbox) |
| Replay-only "lite" server (`DEMO_REPLAY=true`, no data or model loaded) | Measured **267 MB RSS** after serving requests: fits a 512 MB host, but answers only the recorded demo wallets |
| Google Cloud Run / Fly.io | Card required, not checked further |

Recommendation for the demo: laptop + tunnel for the real model, plus the lite replay-only server as a backup if a free
512 MB host is available. Sections 3.1 to 3.5 below were written for a Hugging Face Space and still describe the
variables and the smoke test, but the Space creation step cannot be done on the free plan.

## 1. Measured here (local Docker, synthetic fixture, nothing deployed)

| Check | Result |
|---|---|
| `docker build` of the backend image | PASS, first successful build (36.8 s warm; 1 m 47 s cold) |
| Image size | **952 MB** (was 4.05 GB before two fixes: a CPU-only XGBoost wheel on Linux removed ~470 MB of NVIDIA libraries; `chown -R` after install had duplicated the whole virtualenv into a second layer) |
| Runs as | uid 1000 (`cryptiq`), no tests / `.env` / data / dev tools inside |
| `APP_ENV=prod` start with the fixture mounted read-only | PASS. `/api/health`: `engine=networkx`, `engineOk`, `modelLoaded`, `ofacLoaded: true`, `dataSource: synthetic_fixture`, `mocks: true` |
| Docker `HEALTHCHECK` | `healthy` |
| `scripts/smoke.py` against the container | **11/11 PASS** |
| `/api/check`, 80 calls, synthetic data, NetworkX, cache off | median 8 ms, p95 21 ms (**not** representative of TigerGraph + LLM) |
| Placeholder `SESSION_SECRET` in prod | refuses to start (exit 1) |
| `PORT=7860` (Hugging Face style) | honoured |
| Artifact fetch failure (host unreachable) | logged, app still starts, token not in logs |
| Session cookie | `HttpOnly; Secure; SameSite=lax` |

Not exercised: the `apt-get install ffmpeg` step (the sandbox cannot reach Debian mirrors; the image was built
with `--build-arg INSTALL_FFMPEG=false`, so audio upload conversion is untested in the image), and
`scripts/fetch_artifacts.py` against the real Hugging Face service (host blocked; request handling is tested
with a mocked transport). To build for real: `docker build -t cryptiq-backend backend/`.

## 2. Why not Fly.io

I could not check Fly's current pricing (fly.io is unreachable from the sandbox), so **I give no price**. As far
as I know Fly no longer has a free plan for new accounts and requires a payment card; verify at
https://fly.io/docs/about/pricing/ before relying on this. `backend/fly.toml` and `backend/DEPLOY.md` stay in
the repo as an optional paid route. Nothing was created on Fly.

## 3. Free stack and how to deploy it

All limits below are from my general knowledge and could not be verified from the sandbox: **check each
provider's page before the demo.**

| Part | Free choice | Notes |
|---|---|---|
| Backend host | ~~Hugging Face Spaces, Docker SDK, free CPU~~ **not free (402)**; see the options table above | (was: No card. Believed to be 2 vCPU / 16 GB RAM (we measured ~1.05 GB serving). Sleeps after inactivity; **disk is ephemeral**. Public URL `https://<user>-<space>.hf.space` |
| Frontend host | **Vercel Hobby** | Free for non-commercial use. Proxies `/api/*` to the backend (same-origin cookies) |
| Graph DB | TigerGraph Savanna free tier | Size limits unverified; `--max-vertices` subset loader exists. Without it the app runs on NetworkX or replays |
| Explanations | **Templates (no LLM, $0)**, or a free OpenAI-compatible tier | `LLM_PROVIDER=openai_compatible`, `LLM_BASE_URL` of Groq / Google Gemini (OpenAI-compatible endpoint) / OpenRouter, `LLM_MODEL` a free model. Base-URL-with-a-path handling is tested |
| Speech to text | **Browser Web Speech API ($0)**; Sarvam if it still has free credit | `/api/transcribe` answers 503 `voice_unavailable` and the UI falls back |
| Text to speech | Browser speech synthesis | `audioUrl` omitted without Sarvam TTS |
| Payments | Dodo **test mode** | Free; no real money |
| Crypto | Bitcoin testnet / signet | Free test coins; needs a reachable Esplora explorer, else demo mode |
| Attestations | EAS on Base Sepolia | Test ETH from a faucet |

### 3.1 Put the data where the Space can fetch it (PRIVATE, never public)

The Elliptic++ data has no stated licence, so it and the tables derived from it must never go in a public repo
or a public Space.

1. On huggingface.co create a **private dataset repo**, e.g. `yourname/cryptiq-artifacts`.
2. Upload, keeping this layout: `data/processed/*.parquet`, `data/labels/ofac_btc.txt`,
   `artifacts/model.joblib`, `artifacts/model_card.json`, `artifacts/demo_wallets.json`,
   `artifacts/replay/*.json`, `artifacts/tg_load_summary.json` (use `huggingface-cli upload` or the web UI).
   `model.joblib` is a pickle: only ever load it from a repo you control. Train and serve with the same
   `xgboost` version (the lockfile pins it).
3. Create a **fine-grained read-only token** for that repo only.

### 3.2 Create the Space

1. New Space, SDK **Docker**, visibility public (the API must be reachable by the frontend).
2. Settings, **Secrets** (names only here; values come from your own `backend/.env`, typed into the HF page,
   never pasted into chat or committed): `SESSION_SECRET`, `LOG_SALT`, `ADMIN_TOKEN`, `HF_TOKEN`,
   `TG_SECRET`, `LLM_API_KEY`, `SARVAM_API_KEY`, `WISPR_API_KEY`, `DODO_API_KEY`, `DODO_WEBHOOK_SECRET`.
   Generate the first three with `openssl rand -hex 32`.
3. Settings, **Variables**: `APP_ENV=prod`, `ARTIFACTS_REPO=yourname/cryptiq-artifacts`,
   `CORS_ORIGINS=https://<your-vercel-domain>`, `FRONTEND_URL=https://<your-vercel-domain>`,
   `COOKIE_SAMESITE=lax`, `COOKIE_SECURE=true`, `GRAPH_ENGINE=tigergraph` (or `networkx`), `TG_HOST`, `TG_GRAPH`,
   `LLM_PROVIDER`, `LLM_MODEL`, `LLM_BASE_URL`, `SARVAM_STT_MODEL`, `SARVAM_TTS_MODEL`, `DODO_ENV=test_mode`,
   `PACKS_JSON`, `BTC_NETWORK`, `BTC_RECEIVE_ADDRESS`, `BTC_EXPLORER_BASE_URL`, `BTC_SATS_PER_USD`,
   `DATA_DIR=/app/data`, `ARTIFACTS_DIR=/app/artifacts`, `OFAC_LIST_PATH=/app/data/labels/ofac_btc.txt`,
   `RATE_LIMIT_CHECK=300/minute`. Do not set `DEMO_MODE` with real data.
4. Push the code to the Space repo (you need your HF token for git):

```bash
git clone https://huggingface.co/spaces/yourname/cryptiq-api space && cd space
rsync -a --exclude data --exclude artifacts --exclude .venv --exclude tests --exclude '.env*' \
      --exclude __pycache__ ../cryptiq/backend/ .
cp deploy/hf-space/README.md README.md          # the YAML header makes it a Docker Space on port 8000
git add -A && git commit -m "Cryptiq API" && git push
```

5. Wait for the build, then:

```bash
curl https://yourname-cryptiq-api.hf.space/api/health      # engineOk, modelLoaded, ofacLoaded: true,
                                                            # dataSource: elliptic++ and NO "mocks" key
cd backend && uv run python -m scripts.smoke --base https://yourname-cryptiq-api.hf.space --runs 10
```

The smoke script spends 3 starting credits per fresh session, so for a full run set the Space variable
`STARTING_CREDITS=200` temporarily and `RATE_LIMIT_CHECK=1000/minute`, then put them back.

### 3.3 Frontend: URL and CORS notes (same-origin cookies)

The browser must only talk to the **frontend** origin. Next.js forwards `/api/*` to the backend server-side
(the partner's branch `frontend/nextjs-app`, not yet merged into `main`, already has this rewrite in
`next.config.ts`, reading `BACKEND_URL`):

- Vercel project environment variables: `BACKEND_URL=https://yourname-cryptiq-api.hf.space`,
  `NEXT_PUBLIC_API_BASE_URL=` (empty), `NEXT_PUBLIC_USE_MOCKS=false`.
- The session cookie is then first-party to the Vercel domain (`SameSite=Lax; Secure; HttpOnly`). Do **not**
  switch to `SameSite=None` and a cross-site backend: Safari and Chrome with third-party cookies blocked drop
  the cookie, every request becomes a new session with free credits, and a payment would credit a session the
  browser can never reach.
- CORS is not used on this path (the proxy call is server to server), but keep `CORS_ORIGINS` set to the
  frontend origin; the backend never answers `*` with credentials.
- Rate limiting: behind Hugging Face's proxy the backend sees the proxy's address, so **all visitors share one
  per-IP bucket**. Raise `RATE_LIMIT_CHECK` for the demo (the abuse brake is weaker; acceptable for a hackathon).

### 3.4 Webhook

Dodo dashboard (test mode), Webhooks: endpoint `https://yourname-cryptiq-api.hf.space/api/webhooks/dodo`,
event `payment.succeeded`; copy the signing secret into the Space secret `DODO_WEBHOOK_SECRET`. For local
testing: `dodo wh listen http://localhost:8000/api/webhooks/dodo` or a free `cloudflared` tunnel.

### 3.5 Known limits of the free route

- **The credits ledger and invoices live in SQLite on the Space's ephemeral disk.** A restart or rebuild
  resets them (purchased credits are lost). Acceptable for a demo; avoid restarting the Space mid-demo.
- A sleeping free Space takes time to wake and then re-downloads the artifacts (time **not measured**). Open the
  health URL a few minutes before the demo, or ping it periodically with a free uptime monitor.
- Single uvicorn worker (SQLite and the in-process cache).
- **Memory on real data (measured):** scorer only about 1.0 GB; the NetworkX engine about 2.6 GB. Do not use a 2 GB machine with `GRAPH_ENGINE=networkx`.

### 3.6 Zero-cloud fallback: your laptop plus a free tunnel

```bash
cd backend && make run                      # needs data/ and artifacts/ locally
cloudflared tunnel --url http://localhost:8000     # free, no account; prints a random https://*.trycloudflare.com URL
```

Set Vercel's `BACKEND_URL` to that URL and redeploy (the URL changes every run; `cloudflared` was not
available in the sandbox, so this path is untested here). The laptop must stay online during the demo.

## 4. What I still need from you

1. A Hugging Face account (free) and the steps in 3.1 to 3.2, run by you (the token must never be pasted into
   chat). Then tell me the Space URL and I will run the smoke test against it.
2. The real data and trained artifacts (the earlier task), otherwise the Space can only serve the synthetic
   fixture and every response says `isMock: true`.
