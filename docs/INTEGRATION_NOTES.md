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
