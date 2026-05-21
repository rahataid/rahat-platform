# Rahat org project automation (@rahat2026 / #61)

| File | Purpose |
|------|---------|
| [`configure-project-61.sh`](./configure-project-61.sh) | Create **Environment**, **Priority**, **Work type** fields; optional `--fix` No Status → Backlog |
| [`PROJECT-61-WORKFLOWS.md`](./PROJECT-61-WORKFLOWS.md) | Copy-paste rules for built-in project workflows + view tweaks |
| [`../workflows/project-add-to-board.yml`](../workflows/project-add-to-board.yml) | Add new issues to project 61 |
| [`../workflows/project-sync-pull-request.yml`](../workflows/project-sync-pull-request.yml) | Add PRs to project when ready for review |

## One-time setup (org admin)

```bash
gh auth login -s project,read:org,repo
cd .github/project
chmod +x configure-project-61.sh
DRY_RUN=1 ./configure-project-61.sh    # preview
./configure-project-61.sh              # create fields
FIX_NO_STATUS=1 ./configure-project-61.sh   # move No Status → Backlog
```

Then follow **PROJECT-61-WORKFLOWS.md** in the GitHub UI.

## Org secret (required for Actions)

In **rahataid** organization → **Settings** → **Secrets** → **Actions**:

| Secret | Value |
|--------|--------|
| `RAHAT_PROJECT_TOKEN` | PAT (classic) or fine-grained token with `project`, `read:org`, `repo` |

Add the same workflows from this repo to `rahat-ui`, `rahat-project-aa`, `rahat-project-triggers` (copy the two `project-*.yml` files).
