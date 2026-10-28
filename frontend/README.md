# Cryptiq frontend

Voice-first wallet safety checker. Say or paste a Bitcoin wallet, get **ALLOW / WARN / BLOCK**, see why on a graph, keep proof
on-chain. A risk signal, not an accusation; it runs on a research dataset (Elliptic++), not the live blockchain.

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · TanStack Query · zustand · wagmi/RainbowKit (Base Sepolia only).
Design system: [`DESIGN.md`](DESIGN.md) · motion: [`MOTION.md`](MOTION.md) · decisions: [`DECISIONS.md`](DECISIONS.md) ·
API contract: [`../docs/api-contract.md`](../docs/api-contract.md).

## Run it

```bash
cd frontend
npm ci
cp .env.example .env.local      # then edit (names only are committed; never commit .env.local)
npm run dev                     # http://localhost:3000
```

### Mock backend (no network, no backend needed)

```bash
NEXT_PUBLIC_USE_MOCKS=true npm run dev
```

The built-in mock backend (`src/lib/mocks`) implements every endpoint of the contract, including streaming progress and the
error codes. Demo wallets: `DEMO-ILLICIT-01` (BLOCK), `DEMO-BORDERLINE-03` (WARN), `DEMO-LICIT-02` (ALLOW), `DEMO-NOTFOUND-04` (UNKNOWN).
Everything it returns is marked `isMock` and the UI shows a "MOCK DATA" ribbon. A new mock session starts with 3 credits.

### Real backend

```bash
# terminal 1: backend on its synthetic fixture (see ../backend/README.md)
cd backend && make setup && make fixture && make run-fixture      # http://localhost:8000

# terminal 2: frontend, same-origin proxy to the backend
cd frontend && NEXT_PUBLIC_USE_MOCKS=false BACKEND_URL=http://localhost:8000 npm run dev
```

The browser only talks to the frontend origin; `next.config.ts` rewrites `/api/*` to `BACKEND_URL`, so the `cryptiq_sid` session
cookie stays first-party. Switching between mock and real is **one environment variable** (`NEXT_PUBLIC_USE_MOCKS`), no code change.
On the synthetic fixture the API reports `isMock: true` and the UI shows a "SYNTHETIC DATA" ribbon.

## Environment variables (names only; see `.env.example`)

| Variable | Meaning |
|---|---|
| `NEXT_PUBLIC_USE_MOCKS` | `true` = built-in mock backend, `false` = real backend |
| `BACKEND_URL` | server-side only: where `/api/*` is proxied (default `http://localhost:8000`) |
| `NEXT_PUBLIC_API_BASE_URL` | leave empty for same-origin; set only to call a backend on another origin |
| `NEXT_PUBLIC_VOICE_MODE` | `auto` (backend STT with browser fallback) or `browser` (Web Speech API only) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | free Reown id; without it only injected wallets are offered |
| `NEXT_PUBLIC_EAS_SCHEMA_UID` | EAS schema UID on Base Sepolia (register once; attest is disabled without it) |
| `NEXT_PUBLIC_EAS_CONTRACT`, `NEXT_PUBLIC_CHAIN_ID` | Base Sepolia EAS contract and chain id (defaults provided) |
| `NEXT_PUBLIC_DODO_TEST_HINT` | optional helper text next to the Dodo test checkout |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server / production build / serve the build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript) |
| `npm test` | Vitest unit and component tests |
| `npm run test:e2e` | Playwright against a production build with the mock backend (`E2E_REAL=1` uses the real backend) |
| `npm run format` | Prettier |

## Folder map

```
src/app/            routes: /, /check, /benchmark, /credits (+success, cancelled), /history, /about, /settings, /demo, /r/[id], /privacy
src/components/     ui/ (design-system kit) layout/ landing/ check/ graph/ web3/ credits/ benchmark/ pages/
src/lib/api/        typed client for docs/api-contract.md (zod-validated, SSE reader, error messages EN/HI, reportHash)
src/lib/mocks/      the mock backend (fixtures, fetch implementation, state)
src/lib/i18n/       EN/HI dictionaries by namespace (messages/*.ts) and the useT() hook
src/lib/stores/     settings, credits, history, toasts, ui (zustand)
src/lib/address/    address format check and the seed-phrase / private-key guard
src/lib/motion/     scroll-story engine and reveal helpers
src/styles/         tokens.css (source of truth), theme.css (Tailwind), motion.css, nav.css, logo.css
public/brand/       logo mark (animated + static) and concept logos
tests/e2e/          Playwright specs
```

## Deploy

Vercel project root `frontend/`; set `BACKEND_URL` to the deployed backend (see `../backend/DEPLOY.md`), `NEXT_PUBLIC_USE_MOCKS=false`,
and the wallet/EAS variables. Payments need the same-origin rewrite (do not set `NEXT_PUBLIC_API_BASE_URL`).
