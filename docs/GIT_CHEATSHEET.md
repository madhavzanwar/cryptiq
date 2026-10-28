# Git cheat sheet (Kavach / cryptiq)

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

## If you get a merge conflict

1. Don't panic. Nothing is lost.
2. Run `git status` and look at the files listed under "both modified".
3. Open each file and find the `<<<<<<<`, `=======` and `>>>>>>>` markers.
4. Keep both sides' intent: combine the changes, then delete the markers.
5. `git add <file>`, then `git commit` to finish the merge, then `git push`.
6. Since frontend and backend live in separate folders, a conflict usually means someone edited a file outside their folder. Tell your teammate in chat.
7. Stuck? `git merge --abort` puts your branch back to how it was before the merge.

## Never
- Commit or push to `main` directly.
- `git push --force` on `main` or `dev`.
- `git rebase` a shared branch.
- Commit `.env` or any key / seed phrase.
