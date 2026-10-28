# Contributing to Kavach (repo: cryptiq)

Two people, one repo, four days. These rules keep `main` safe and avoid merge conflicts.

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

## Flow

1. Start from fresh `dev` on a new branch (`frontend/<topic>`, `backend/<topic>`, ...).
2. Commit small and often; push your branch.
3. Before the PR: `git fetch origin && git merge origin/dev`, fix conflicts, run lint/tests.
4. Open the PR into `dev` (never into `main`) and fill in the template.
5. When `dev` is demo-ready and both agree, open a PR `dev -> main`.

Cheat sheet: [docs/GIT_CHEATSHEET.md](docs/GIT_CHEATSHEET.md)
