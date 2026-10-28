# Cryptiq API client

Framework-agnostic, typed client for `docs/api-contract.md`. Plain `.ts`, no React or Next.js imports.

```ts
import { createApiClient, streamCheck, messageFor, verifyReportHash } from "@/lib/api";

const api = createApiClient({ baseUrl: "" }); // "" = same origin, `/api/*` proxied by Next.js rewrites
const res = await api.check(address, "hi"); // zod-validated CheckResponse, cookies sent (credentials: "include")
await streamCheck({ baseUrl: "" }, address, "en", { onStep: (s) => ui(s.label) }, abort.signal);
try { await api.check(a, "en"); } catch (e) { const { message, action } = messageFor(e, "hi"); }
verifyReportHash(res, (s) => ethers.keccak256(ethers.toUtf8Bytes(s))); // you pass the keccak
```

- Failures throw `ApiError` (`status`, `code`, optional `body` = the CheckResponse of a 503 `status: "error"`).
- `messageFor(error, lang)` returns EN/HI text and an `action` hint (`open-credits`, `seed-phrase-warning`, ...).
- `res.audioUrl` is a path on the backend origin: use `buildUrl(baseUrl, res.audioUrl)`.

## npm dependencies the app needs

- `zod` (runtime, v3)
- `vitest` (dev) to run `__tests__/`
- `@noble/hashes` (dev, keccak for the test vectors); at runtime use `ethers` or any keccak256 and pass it in

`tsconfig`: `strict`, `moduleResolution: "bundler"`, `lib` with `DOM` and `ES2022`. Run tests: `npx vitest run src/lib/api`.
