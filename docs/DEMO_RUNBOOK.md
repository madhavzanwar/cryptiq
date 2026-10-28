# Demo runbook

Everything here is a procedure, not a result. **No number below was measured on real data**; where a figure is
needed it says "not measured". Fill the "measured" blanks from real runs before presenting.

## 0. What is real today (read this before saying anything on stage)

- Verified only on a **synthetic** dataset (fake `DEMO-` wallets). No run on real Elliptic++ data exists yet.
- The GSQL queries were **never compiled** on a TigerGraph cluster; TigerGraph results are therefore not yet
  claimed anywhere.
- Say on stage: the data is a **research dataset, not the live blockchain**; the output is a **risk signal, not
  an accusation**; wallets outside the dataset show UNKNOWN and are not charged; payments run in **test mode**
  (Dodo test, Bitcoin testnet, Base Sepolia).
- Only say "TigerGraph" when `/api/health` shows `engine: tigergraph` (the UI badge follows the same rule).
- Say Wispr was used only if `WISPR_API_KEY` is set and the response `provider` is `wispr`. Otherwise it is
  Sarvam or the browser's speech recognition.

## 1. Start-up order (about 15 minutes before)

1. **Backend**: open `https://<space>.hf.space/api/health` (wakes a sleeping Space; wake time not measured).
   Required: `ok: true`, `engineOk: true`, `modelLoaded: true`, `ofacLoaded: true`, `dataSource: "elliptic++"`
   and **no `mocks` key**. If `mocks: true` you are on synthetic data: stop and fix before presenting.
2. **Frontend**: open the Vercel URL; check the credit pill shows a balance.
3. **Demo wallets**: `GET /api/demo-wallets` (held-out test-split wallets with the verdict the system gives).
   `artifacts/demo_wallets.json` is not generated yet; `make train` creates it. Keep one of each: BLOCK, WARN,
   ALLOW, and one not in the dataset (UNKNOWN).
4. **Dry run** each demo wallet once (cached repeats within 10 minutes cost no credit; first runs cost 1).
5. Smoke test: `cd backend && uv run python -m scripts.smoke --base <backend url>` (needs enough starting
   credits and a high per-IP rate limit, see DEPLOY_NOTES).
6. Confirm Dodo test checkout, a testnet invoice (or demo mode), and one EAS attestation on Base Sepolia work.
7. Browser: Chrome, microphone allowed on the HTTPS site, volume up.

## 2. URLs (fill in)

| What | URL |
|---|---|
| Frontend (Vercel) | _not deployed yet_ |
| Backend (HF Space) | _not deployed yet_ |
| Health | `<backend>/api/health` |
| Demo wallets | `<backend>/api/demo-wallets` |
| Dodo webhook | `<backend>/api/webhooks/dodo` |
| easscan (Base Sepolia) | https://base-sepolia.easscan.org |

## 3. Keys needed and what happens without each

| Key (env name) | Free? | If missing |
|---|---|---|
| `SESSION_SECRET`, `LOG_SALT`, `ADMIN_TOKEN` | yes (`openssl rand -hex 32`) | prod refuses to start |
| `ARTIFACTS_REPO` + `HF_TOKEN` | yes | Space starts but `modelLoaded: false` |
| `TG_HOST`, `TG_SECRET` | Savanna free tier | use `GRAPH_ENGINE=networkx` or replays; badge hidden |
| `LLM_*` | free tiers exist, or none | template explanations (grounded, simpler wording) |
| `SARVAM_*` | free credit may exist | browser speech recognition |
| `WISPR_API_KEY` | exclusive access | Sarvam / browser; nothing claims Wispr |
| `DODO_API_KEY`, `DODO_WEBHOOK_SECRET`, `PACKS_JSON` | test mode is free | card payments off; use demo-mode crypto |
| `BTC_*` | testnet is free | invoice returns 503 `crypto_unavailable`; use demo mode |
| Frontend: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `NEXT_PUBLIC_EAS_SCHEMA_UID` | free | only injected wallets; attest disabled |

## 4. If something fails

| Failure | What you see | What to do |
|---|---|---|
| **TigerGraph down / slow** | `engine` is not `tigergraph`, or 503 `graph_unavailable` | Automatic: with `REPLAY_FALLBACK=true` (default) recorded real responses are served, labelled **Replay**. Force it: set `DEMO_REPLAY=true`. Say "recorded real response". Replays exist only after `make record-replays` on a live engine |
| **LLM down / over free quota** | nothing visible | Automatic: after the 8 s deadline the grounded **template** explanation is used (English and Hindi) |
| **Sarvam down** | mic upload returns 503 `voice_unavailable` | UI falls back to the browser's speech recognition. If that fails too: paste the address |
| **Spoken address wrong** | confirmation step shows the transcript | Edit or paste; addresses are checksum-validated |
| **Wi-Fi / venue network down** | everything fails | Run the backend locally (`make run`) with `DEMO_REPLAY=true`, point the frontend at it (`BACKEND_URL=http://localhost:8000`) or use the frontend's built-in mocks (`NEXT_PUBLIC_USE_MOCKS=true`; the UI marks mock data). Say so |
| **Explorer down / testnet slow** | invoice stays `waiting` | Demo mode: create the invoice, then `curl -X POST <backend>/api/admin/crypto-invoice/<id>/mark-paid -H "x-admin-token: $ADMIN_TOKEN"`. Say "demo mode, confirmation simulated" |
| **Dodo checkout/webhook fails** | credits do not appear after paying | Use the demo-mode crypto flow above to add credits; show the Dodo test checkout page only |
| **Out of credits (402)** | credits drawer opens | That is the designed buy flow; cached repeats are free |
| **Space restarted** | credits reset to the starting grant | Known limit of the free route (ephemeral SQLite); do not restart mid-demo |
| **Rate limited (429)** | "try again" | Raise `RATE_LIMIT_CHECK` (all visitors share one IP bucket behind the host proxy) |

## 5. Three-minute script (fill the measured blanks; never improvise numbers)

1. **0:00** One sentence: "Say a wallet. See if it is safe to pay. See why. Keep proof on-chain."
2. **0:20** Speak or paste the BLOCK demo wallet. Show the verdict, risk score, evidence graph. Mention hop
   counts from the card (read them off the screen).
3. **1:00** Toggle Hindi; press Listen. Point at "risk signal, not an accusation".
4. **1:20** Paste the WARN wallet, then the not-in-dataset wallet: UNKNOWN, **no credit charged**.
5. **1:50** Credit meter, the buy flow (test mode), cached repeat is free.
6. **2:20** Attest on Base Sepolia; open easscan; show the `reportHash`.
7. **2:40** Benchmark page: show only what the page displays. Measured result: _not measured yet_. If the graph
   method is not better on a metric, say so.
8. **2:55** Honest limits (section 0).

Numbers to fill from real runs only: model F1 baseline _not measured_ / with graph _not measured_;
`/api/check` p50 / p95 _not measured_ (synthetic local run: median 8 ms, p95 21 ms, **not representative**);
TigerGraph query p50 / p95 _not measured_; benchmark table _not measured_.

## 6. Backup video (checklist, record only real runs)

Health page showing the real data source; BLOCK, WARN, ALLOW and UNKNOWN checks; Hindi explanation with audio;
credit meter dropping; the Dodo test checkout; the easscan attestation; the graph. Do not edit or splice results.
