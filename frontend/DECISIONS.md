# Frontend decisions

Every non-obvious decision, conflict and assumption for `/frontend`. Newest decisions at the bottom of each section.

## Stack
- **Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4 (Turbopack).** Created with `create-next-app@latest`
  and its bundled docs read before use (`node_modules/next/dist/docs`, see `AGENTS.md`). Versions: next 16.4.3, react 19.3.
- **Cache Components is OFF** (`cacheComponents: false`). Every page is client-side data from the backend; Cache Components would
  add `Activity`-based state preservation and Suspense requirements with no benefit here.
- **Same-origin API.** The browser calls `/api/*` on the frontend origin; `next.config.ts` rewrites it to `BACKEND_URL`
  (`docs/INTEGRATION_NOTES.md` section 7). This keeps the `cryptiq_sid` session cookie first-party (payments need it).
  `compress: false` so server-sent events from `/api/check/stream` are not buffered by the proxy.
- **One switch for mocks:** `NEXT_PUBLIC_USE_MOCKS=true|false`. The teammate's typed client (`src/lib/api`) takes an injectable
  `fetchImpl`; in mock mode `src/lib/api/instance.ts` plugs in `src/lib/mocks/fetch.ts`, a fake backend with the same wire format
  (including SSE and error codes). Nothing in the pages knows which one is active.
- **wagmi 2 / RainbowKit 2** (RainbowKit 2.2 requires wagmi ^2.9, not 3). **zod 3** (the API client is written for v3).
  **`@noble/hashes` 1.x** (dev; the teammate's report-hash tests use the 1.x paths). **Playwright 1.63** to match the preinstalled Chromium.
- **State:** zustand for small UI state (settings, credits, history, toasts), TanStack Query for server data. Persisted stores use
  `skipHydration` and are rehydrated after mount, so the first client render equals the server HTML.
- **Graph:** `react-force-graph-2d` (client only). **QR:** `qrcode.react`. **Charts:** hand-rolled SVG/HTML (no chart library).
- **Fonts via `next/font`:** Inter Tight (500/600), IBM Plex Mono (500), Noto Sans Devanagari (500/600), self-hosted at build.

## Design
- `DESIGN.md` is the visual source of truth; `src/styles/tokens.css` holds the values, `src/styles/theme.css` feeds Tailwind.
  `src/lib/__tests__/theme-sync.test.ts` fails if they drift apart.
- **CTA text is Carbon, not white** on the green (white on `#05c92f` is 2.2:1 and fails WCAG AA); see DESIGN.md "Accessibility override".
- **One saturated green per viewport.** On the landing page it is the docked "Get started" pill; on the check page it is the mic.
- **Verdict colours are muted tints with ink and an icon + word** (sage / butter / rose / grey); never colour alone.
- The reference "Side Dock" navigation replaces the top pill: logo and language toggle stay at the top.

## Content and honesty
- ALLOW wording is "No strong risk signals found in the dataset", never "safe" (tested in `i18n.test.ts`).
- "Risk signal, not an accusation." and the research-dataset line appear on every result, the footer and About.
- Benchmark numbers are only ever rendered from `GET /api/benchmark`. In mock mode they are labelled "SAMPLE ONLY (mock)".
- The TigerGraph badge is shown only when `engine === "tigergraph"` (with an "Example" tag when `isMock`); other engines get a neutral label.
- The browser never sees or stores a seed phrase or private key: `looksLikeSecret` runs on typed input, pasted input and transcripts,
  and the backend independently answers `secret_input`.
- Wispr Flow is only named as active when the API reports `provider: "wispr"`.

## Mock data
- Mock addresses are `DEMO-…` placeholders; `validateAddress` accepts them only when `allowDemo` (mock mode or `health.mocks`).
  The fixture backend uses lowercase ids like `DEMO-w02271`, so the pattern accepts both.
- Mock fixtures cover BLOCK / WARN / ALLOW / UNKNOWN, 20-120 node subgraphs, EN and HI explanations, and a valid `reportHash`.
- Hindi strings are short and simple but **have not been reviewed by a native speaker**. Please review `src/lib/i18n/messages/*.ts`.

## Verification (what was actually run)
- `npm run typecheck`, `npm run lint`: clean. `npm test`: 36 files / 308 tests pass (client, mocks, i18n, token sync, every feature area).
- `npm run build`: passes (13 routes) in mock mode.
- `npm run test:e2e` (mock backend, production build): 21 passed on desktop and phone sizes. `E2E_REAL=1 npm run test:e2e`
  against the real FastAPI backend on its synthetic fixture (through the Next.js `/api` rewrite, real session cookie, real SSE):
  15 passed, mock-only scenarios skipped. A repeat check of the same wallet within 10 minutes is served from the backend cache and is
  free, which the UI labels "Cached, no credit used".
- Not run (needs keys or a laptop): real Elliptic++ data, TigerGraph, Wispr/Sarvam voice, LLM explanations, Dodo and BTC/XMR payments,
  a real wallet signing an EAS attestation (the signing path was exercised with an in-page fake wallet), Lighthouse.

## Known limitations
- The backend this app was tested against runs on a synthetic fixture (`isMock: true`, engine NetworkX); the UI says so with a
  "SYNTHETIC DATA" ribbon. Real data and TigerGraph have not been exercised.
- Voice: with no voice keys the backend answers `503 voice_unavailable` and the UI falls back to the browser's speech recognition,
  which could not be tested in headless Chromium.
- Attesting needs `NEXT_PUBLIC_EAS_SCHEMA_UID` (register the schema once) and Base Sepolia test ETH; without the schema UID the button
  is disabled with a setup message. WalletConnect needs `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`; without it only injected wallets work.
- Hindi strings have not been reviewed by a native speaker.
- The `*.css` Turbopack rule from the scaffold sends `*.module.css` through the Tailwind loader, which breaks CSS-module class hashing.
  The app uses global/Tailwind CSS only, so this is dormant; do not add CSS modules without excluding them from that rule.
- Wallet code is loaded lazily after the first paint (about 122 kB gzip) and the EAS SDK only when someone signs (about 244 kB gzip).
- The root `README.md` still says the Next.js app is not in the repo; update that line when this branch is merged.
