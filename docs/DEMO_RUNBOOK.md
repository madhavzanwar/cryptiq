# Demo runbook

Operational notes for the live demo, in four parts: **A** backend and overall procedure, **B** frontend (Vercel),
**C** the five likeliest stage failures, **D** the backup-video checklist. Backend deployment (free route):
`docs/DEPLOY_NOTES.md`; optional paid route: `backend/DEPLOY.md`; data pipeline: `backend/README.md`.
Architecture: `docs/ARCHITECTURE.md`. API: `docs/api-contract.md`.

Everything here is a procedure, not a result. Where a figure is needed it says "not measured": fill those blanks
only from real runs before presenting.

> Say it plainly on stage: **risk signal, not an accusation; research dataset, not the live blockchain; testnet attestations, not a legal verdict.**

# Part A. Backend and overall procedure

## 0. What is real today (read this before saying anything on stage)

- The model was trained and evaluated on the **real Elliptic++ Actors data** (results, including the weak spots,
  in `docs/INTEGRATION_NOTES.md` section 12). The numbers on screen come from that run; read them off the
  screen, do not quote others.
- A deployed backend shows the real data only if the private artifacts repo was uploaded (`DEPLOY_NOTES.md` 3.1).
  Otherwise it serves the synthetic fixture and `/api/health` shows `mocks: true`.
- The GSQL queries were **never compiled** on a TigerGraph cluster (the local Community Edition could not start
  in the development sandbox), so TigerGraph results are not claimed anywhere. Replays recorded so far came from
  the NetworkX engine and say `engine: networkx` inside; offline they are shown labelled **Replay**.
- Say on stage: the data is a **research dataset, not the live blockchain**; the output is a **risk signal, not
  an accusation**; wallets outside the dataset show UNKNOWN and are not charged; payments run in **test mode**
  (Dodo test, Bitcoin testnet, Base Sepolia).
- Only say "TigerGraph" when `/api/health` shows `engine: tigergraph` (the UI badge follows the same rule).
- Say Wispr was used only if `WISPR_API_KEY` is set and the response `provider` is `wispr`. Otherwise it is
  Sarvam or the browser's speech recognition.

## 1. Start-up order (about 15 minutes before)

1. **Backend**: open `<backend url>/api/health` (a sleeping free host needs time to wake; wake time not measured).
   Required: `ok: true`, `engineOk: true`, `modelLoaded: true`, `ofacLoaded: true`, `dataSource: "elliptic++"`
   and **no `mocks` key**. If `mocks: true` you are on synthetic data: stop and fix before presenting.
2. **Frontend**: open the Vercel URL; check the credit pill shows a balance.
3. **Demo wallets**: `GET /api/demo-wallets` (held-out test-split wallets with the verdict the system gives).
   `artifacts/demo_wallets.json` is created by `make train` (git-ignored; it must be in the private artifacts repo
   for a deployed Space). Keep one of each: BLOCK, WARN, ALLOW, and one not in the dataset (UNKNOWN).
4. **Dry run** each demo wallet once (cached repeats within 10 minutes cost no credit; first runs cost 1).
5. Smoke test: `cd backend && uv run python -m scripts.smoke --base <backend url>` (needs enough starting
   credits and a high per-IP rate limit, see DEPLOY_NOTES).
6. Confirm Dodo test checkout, a testnet invoice (or demo mode), and one EAS attestation on Base Sepolia work.
7. Browser: Chrome, microphone allowed on the HTTPS site, volume up.

## 2. URLs (fill in)

| What | URL |
|---|---|
| Frontend (Vercel) | _not deployed yet_ (details in Part B) |
| Backend | _not deployed yet_ (a Hugging Face Docker Space needs PRO; see `docs/DEPLOY_NOTES.md` for the free options) |
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

# Part B. Frontend (Vercel)

| Item | Value |
|---|---|
| Public URL | **TBD: fill in after the Vercel deploy** (`https://<project>.vercel.app`) |
| Backend it talks to | `BACKEND_URL` = the deployed FastAPI (free route: Hugging Face Space, see `docs/DEPLOY_NOTES.md`; Fly.io is an optional paid route, `backend/DEPLOY.md`). Must be deployed first |
| Source | `frontend/` (Next.js 16). Vercel project root = `frontend` |
| Mock fallback URL | **TBD** (a second Vercel project or preview with `NEXT_PUBLIC_USE_MOCKS=true`; always shows the **MOCK DATA** ribbon) |

### Vercel setup (the owner does this once)

1. vercel.com -> Add New -> Project -> import `madhavzanwar/cryptiq`, **Root Directory = `frontend`**, framework Next.js (auto).
2. Environment variables (Production and Preview; values are never committed, names are in `frontend/.env.example`):

   | Name | Value |
   |---|---|
   | `BACKEND_URL` | the backend URL, e.g. `https://<user>-<space>.hf.space` (no trailing slash) |
   | `NEXT_PUBLIC_USE_MOCKS` | `false` |
   | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | from cloud.reown.com (add the Vercel domain to its allowed domains) |
   | `NEXT_PUBLIC_EAS_SCHEMA_UID` | the schema UID registered on https://base-sepolia.easscan.org/schema/create |
   | `NEXT_PUBLIC_API_BASE_URL` | **leave empty** (keeps `/api/*` same-origin so the session cookie is first-party) |

3. Deploy. The rewrite `/api/* -> BACKEND_URL/api/*` is in `frontend/next.config.ts` and is evaluated at build time, so **redeploy after changing `BACKEND_URL`**.
4. Smoke test from any laptop: `curl -s https://<frontend>/api/health` must return `{"ok":true,...}` (that request went through the Vercel rewrite).
5. Cookie check: open the site, open DevTools -> Application -> Cookies: `cryptiq_sid` must be listed **for the frontend domain** (httpOnly). If it is missing, credits will not persist: check `NEXT_PUBLIC_API_BASE_URL` is empty.
6. Microphone: the mic only works over **HTTPS** (Vercel is HTTPS). On a phone, the browser will ask for permission the first time.

Local run (laptop, no cloud): `cd backend && make fixture && make run-fixture`, then
`cd frontend && NEXT_PUBLIC_USE_MOCKS=false BACKEND_URL=http://localhost:8000 npm run dev`. The ribbon reads **SYNTHETIC DATA** (the fixture backend).

### Pre-demo checklist (30 minutes before)

- [ ] `/api/health` through the frontend URL is `ok: true`; note `voiceProvider` (say "Wispr" only if it reads `wispr`) and `engine` (say "TigerGraph" only if it reads `tigergraph`).
- [ ] Open `/check`, run one BLOCK and one ALLOW wallet, confirm the credit pill drops once per **new** check and not on a repeat ("Cached, no credit used").
- [ ] Open `/demo` once **while online** (so Replay works offline later); click the **Cached replay** switch once to see it.
- [ ] Wallet on Base Sepolia has test ETH; one attestation done and its easscan link open in a tab; **Verify** shows Match.
- [ ] Phone: voice works in English and Hindi; the page loads on mobile data.
- [ ] Browser zoom 100%, notifications off, mic permission already granted for the site, a private window ready (a new session = 3 free credits).
- [ ] The backup video (below) is on the laptop **and** on a phone, offline.

# Part C. The five likeliest stage failures and the exact recovery

| # | What fails | What you see | Do exactly this |
|---|---|---|---|
| 1 | **Wi-Fi / venue network down** | Checks spin, errors say "Could not reach Cryptiq" | Open `/demo` (it was opened once online), switch **Cached replay** on. Bundled real-shaped responses play with a **Replay** label; say "this is a recorded replay". Keys: `1`-`4` pick a wallet, `S` shows the script. If the page was never opened: play the backup video |
| 2 | **Microphone blocked / no mic** | Mic shows "The microphone is blocked" or "No microphone found" | Click the lock icon in the address bar -> allow Microphone and press the mic again. Otherwise **paste the address** (or tap a demo chip / key `1`-`4` in `/demo`); the field and the confirm step always work |
| 3 | **TigerGraph slow or down** | Check takes seconds, or the card shows the tag **Offline engine** instead of the TigerGraph badge | The backend falls back to NetworkX automatically; the UI never claims TigerGraph when the fallback answered. Say so honestly. If it is still slow: `/demo` -> **Cached replay**. (TigerGraph badge with milliseconds appears only when `engine` is `tigergraph`) |
| 4 | **Sarvam (or Wispr) voice fails** | Message "Server voice is not available, so we switched to your browser's speech recognition" and the chip reads **Voice: browser** | Hold the mic again: Chrome's speech recognition takes over (needs internet). Check the "We heard" box, then **Confirm and check**. No internet either -> paste the address |
| 5 | **Payment page fails** (Dodo or crypto invoice) | Alert "Payments are not available right now" on `/credits` | Don't retry on stage. Open a **new private window**: every new session starts with **3 free credits**. On the mock fallback site use **Simulate payment** (clearly labelled mock). Or show the QR / test-card step from the backup video |

Also keep in mind: a repeat of the *same* wallet within 10 minutes is served from cache and is free ("Cached, no credit used"); the demo wallets to use are listed by `/api/demo-wallets` (on the fixture: BLOCK `DEMO-w02271`, ALLOW `DEMO-w01391`, UNKNOWN `DEMO-notindataset`).

# Part D. Backup-video checklist

Record only real runs, no editing or splicing of results. Record **one clean take** (about 3 minutes) of the real flow so the demo survives any failure. Record at 1920x1080, 30 fps, system audio off, your voice on (or captions).
Use a **fresh private window** (3 credits). After each step, check the expected result before moving on; redo the take if any step does not match.

| # | Do | Expected result |
|---|---|---|
| 1 | Open the public URL in a private window | Landing hero "Say a wallet. Get a verdict."; credit pill shows **3**; no console errors |
| 2 | Scroll the landing story slowly to the end | Device frame rises, cards swap, rolling wallet list, statement, cards, loops back to the hero |
| 3 | Click **Get started** | `/check` opens; mic button, address box, demo chips, Voice chip visible |
| 4 | Hold the mic and say (English) the BLOCK demo address | "Transcribing...", then a **We heard:** box with the detected address; provider chip says the real provider |
| 5 | Press **Confirm and check** | 5 progress steps, then **BLOCK** card with score, hops chip, reasons, graph; pill **3 -> 2**; toast "1 credit used. 2 left." |
| 6 | Point at the TigerGraph badge / engine tag, open **View GSQL** if shown | "Graph query answered by TigerGraph in N ms" only if the engine is TigerGraph; otherwise the **Offline engine** tag |
| 7 | Scroll to the graph; switch hop depth 1/2/3; press **Highlight path**; click a node | Shapes + colours (diamond = illicit), path in black, node drawer opens, Esc closes it |
| 8 | Read the explanation; press **Listen**; switch to the **हिन्दी** tab | English then Hindi text based only on the evidence; audio plays (or browser voice) |
| 9 | Toggle the UI language to **हिं** | All labels switch to Hindi; reload keeps Hindi; toggle back to **EN** |
| 10 | Check the clean (ALLOW) wallet, then the **same wallet again** | ALLOW card ("No strong risk signals found in the dataset"); second time shows **Cached, no credit used**, pill unchanged |
| 11 | Check the not-in-dataset wallet | **UNKNOWN** card: "Not in our dataset does not mean safe"; no attest offered; pill unchanged |
| 12 | Open **Benchmark** from the side dock | Numbers exactly as the API returns with "Measured at ... on N wallets", or the empty state **Not measured yet**; never invented values |
| 13 | Click the credit pill | Credits drawer with packs, "Test mode, no real charge"; card tab -> Dodo test checkout -> success page with the new balance; or the crypto tab shows the QR and `bitcoin:` / `monero:` link for Cake Wallet |
| 14 | Back on a BLOCK result: **Connect wallet**, then **Create attestation**, sign | Steps tick (Connect -> Switch to Base Sepolia -> Sign -> Done); success card with the attestation UID and an easscan link; text says **testnet, not a legal verdict** |
| 15 | Open the easscan link, return, press **Verify** | easscan shows the attestation; Verify shows **Match** |
| 16 | Open **About** -> honest limits | Research dataset, risk signal not an accusation, UNKNOWN is not safe, testnet only; credits list matches `docs/CREDITS.md` |

Export as MP4, keep a copy offline on the laptop and the phone, and note the take date here: `__ / __ / ____`.
