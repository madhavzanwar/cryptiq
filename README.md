# Kavach (repo: cryptiq)

Say a wallet address. See if it is safe to pay. See why. Keep proof on-chain.

## Folder map

```
frontend/   UI (frontend person only)
backend/    API / services / on-chain (backend person only)
docs/       shared docs, credits, git cheat sheet (tiny PRs only)
.github/    CODEOWNERS, PR template
```

## Branch rules

| Branch | Purpose | Who merges into it |
|--------|---------|--------------------|
| `main` | Demo-ready only. No direct pushes. | Only `dev`, by pull request, when both teammates agree. |
| `dev` | Integration. | Only pull requests from `frontend/*`, `backend/*`, `chore/*`, `docs/*` branches. |
| `frontend/<topic>` | Frontend work. Edits ONLY `/frontend`. | Frontend person |
| `backend/<topic>` | Backend work. Edits ONLY `/backend`. | Backend person |
| `chore/<topic>`, `docs/<topic>` | Root files, tooling, `/docs`. Tiny PRs; tell your teammate in chat first. | Either |

- Frontend person edits ONLY `/frontend`. Backend person edits ONLY `/backend`. `/docs` and root files: tiny PRs, tell the teammate in chat first.
- Branch names: `frontend/<topic>`, `backend/<topic>`, `chore/<topic>`, `docs/<topic>`.
- Always start work with: `git fetch --all --prune && git switch dev && git pull --ff-only && git switch -c <your-branch>`.
- Commit small and often. Message style: `feat(frontend): add verdict card`, `fix(frontend): ...`, `chore: ...`.
- Before opening a PR: `git fetch origin && git merge origin/dev` into your own branch (never rebase shared branches), fix conflicts locally, run the project's lint/tests.
- Never force-push shared branches. Never commit secrets (`.env`, API keys, private keys, seed phrases). Commit `.env.example` with fake placeholder values only.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/GIT_CHEATSHEET.md](docs/GIT_CHEATSHEET.md).

## How to start work

```bash
# first time
git clone https://github.com/madhavzanwar/cryptiq.git && cd cryptiq
git fetch --all --prune && git switch dev

# start a task (frontend example)
git switch dev && git pull --ff-only
git switch -c frontend/check-page

# save work
git add -A && git commit -m "feat(frontend): ..."
git push -u origin frontend/check-page      # first push
git push                                     # later pushes

# bring in teammate's merged work
git fetch origin && git merge origin/dev     # (merge, do not rebase)

# open PR: frontend/check-page -> dev   (never -> main)
```
