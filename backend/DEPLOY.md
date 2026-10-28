# Deploying the Cryptiq backend (Fly.io)

Chosen host: **Fly.io**. It runs the existing Dockerfile (with ffmpeg), gives automatic HTTPS (the
frontend's microphone needs a secure origin), and has persistent volumes for the git-ignored
`data/` and `artifacts/`. Check Fly's current pricing: a 1 GB machine plus a 1 GB volume may exceed
any free allowance. Memory: with the full Elliptic++ table loaded, the scorer needs roughly
300-400 MB (the 64 float32 feature columns for 823k wallets are about 210 MB). 512 MB machines are
tight, so `fly.toml` uses 1 GB. The NetworkX fallback engine needs about 2 GB more; in production use
TigerGraph (`GRAPH_ENGINE=tigergraph`) plus replays.

> The Docker image was written but **not built in the development sandbox** (no Docker daemon).
> Build it locally first: `docker build -t cryptiq-backend backend/ && docker run --env-file backend/.env -p 8000:8000 cryptiq-backend`.

## 1. One-time setup

```bash
cd backend
fly auth login
fly launch --no-deploy --copy-config      # pick an app name, then edit `app` in fly.toml
fly volumes create cryptiq_data --size 1 --region bom
```

## 2. Secrets (never in git, never in fly.toml)

```bash
fly secrets set SESSION_SECRET=$(openssl rand -hex 32) LOG_SALT=$(openssl rand -hex 16) \
  ADMIN_TOKEN=$(openssl rand -hex 16) \
  CORS_ORIGINS=https://<your-frontend-domain> FRONTEND_URL=https://<your-frontend-domain> \
  GRAPH_ENGINE=tigergraph TG_HOST=https://<cluster>.i.tgcloud.io TG_GRAPH=Cryptiq TG_SECRET=<gsql-secret> \
  LLM_PROVIDER=anthropic LLM_MODEL=<model-id> LLM_API_KEY=<key> \
  SARVAM_API_KEY=<key> SARVAM_STT_MODEL=saaras:v3 SARVAM_TTS_MODEL=bulbul:v3 \
  DODO_API_KEY=<test key> DODO_WEBHOOK_SECRET=<whsec_...> PACKS_JSON='[...]' \
  BTC_NETWORK=testnet BTC_RECEIVE_ADDRESS=<tb1...> BTC_SATS_PER_USD=1000 \
  BTC_EXPLORER_BASE_URL=https://mempool.space/testnet4/api BTC_CONFIRMATIONS=0
```

`APP_ENV=prod` makes the app **refuse to start** with placeholder secrets, `SameSite=None`
without `Secure`, or an empty CORS list. Cross-site cookies need `COOKIE_SAMESITE=none` and
`COOKIE_SECURE=true` (already in `fly.toml`) when the frontend and backend are on different sites.

## 3. Ship the artifacts (one-off copy; they are not in git or in the image)

Build them locally (`make data && make train && make record-replays`), then copy the needed files to
the volume:

```bash
tar czf /tmp/cryptiq-data.tgz data/processed data/labels artifacts/model.joblib artifacts/model_card.json \
    artifacts/demo_wallets.json artifacts/replay artifacts/tg_load_summary.json
fly deploy                                    # first deploy creates the machine with the volume
fly ssh console -C "chown -R cryptiq /data"   # volumes mount as root; the app runs as user cryptiq
fly ssh sftp shell                            # then: put /tmp/cryptiq-data.tgz /data/cryptiq-data.tgz
fly ssh console -C "sh -c 'cd /data && tar xzf cryptiq-data.tgz && rm cryptiq-data.tgz && chown -R cryptiq /data'"
fly machine restart                           # reload the model and tables
```

## 4. Check it

```bash
curl https://<app>.fly.dev/api/health          # engineOk, modelLoaded, dataSource=elliptic++
cd backend && uv run python -m scripts.smoke --base https://<app>.fly.dev
```

## 5. Webhooks and frontend

- Dodo dashboard (test mode) -> Webhooks -> endpoint `https://<app>.fly.dev/api/webhooks/dodo`,
  event `payment.succeeded`; copy the signing secret into `DODO_WEBHOOK_SECRET`.
- Frontend: `NEXT_PUBLIC_API_BASE=https://<app>.fly.dev`, and send requests with credentials.

## Notes

- One machine, one uvicorn worker (SQLite + in-process cache). Don't scale horizontally without
  moving to Postgres and a shared cache.
- Health check: `GET /api/health`. Logs: `fly logs` (addresses only appear as salted hashes).
- Uvicorn runs with `--proxy-headers`, so rate limits see the real client IP behind Fly's proxy.
