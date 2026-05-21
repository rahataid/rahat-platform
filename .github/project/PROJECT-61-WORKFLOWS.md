# @rahat2026 — built-in project workflows

Configure at: https://github.com/orgs/rahataid/projects/61/workflows

GitHub does not expose **create** for project workflows via API; add these manually (≈15 minutes).

## 1. New item → Backlog (ban empty “No Status”)

| Setting | Value |
|--------|--------|
| **When** | Item added to project |
| **Then** | Set **Status** → `Backlog` |

If an item already has a status, add a second rule:

| **When** | Item added to project **and** Status is `No Status` |
| **Then** | Set **Status** → `Backlog` |

## 2. Assignee set → leave Backlog only if still “No Status”

| **When** | Item assigned |
| **And** | Status is `No Status` |
| **Then** | Set **Status** → `Backlog` |

## 3. Ready for Development → require sprint (optional)

| **When** | Status set to `Ready for Development` |
| **And** | Sprint is empty |
| **Then** | (Use GitHub’s built-in warning if available) or add comment via Actions |

*Note: “block without sprint” may need a scheduled Action; built-in workflows cannot block transitions.*

## 4. In Development → set Environment DEV

| **When** | Status set to `In Development` |
| **Then** | Set **Environment** → `DEV` |

## 5. In Dev testing → Environment DEV

| **When** | Status set to `In Dev testing` |
| **Then** | Set **Environment** → `DEV` |

## 6. In UAT → Environment STAGE

| **When** | Status set to `In UAT` |
| **Then** | Set **Environment** → `STAGE` |

## 7. Done → set dates (if using Date fields)

| **When** | Status set to `Done` |
| **Then** | Set **End date** → today (if field exists) |

## 8. Archive old Done items (14 days)

| **When** | Status set to `Done` **and** item has been in Done for 14 days |
| **Then** | Archive item (or move to **Archived Tasks** view filter) |

## 9. P0 priority → notify (optional)

| **When** | **Priority** set to `P0` |
| **Then** | Add comment mentioning `@rahataid/leads` (adjust team) |

---

## Views to adjust (same project)

| View | Recommended change |
|------|---------------------|
| **Current Sprint** | Default landing view; filter `Sprint = @current`; board by **Status** |
| **FOR QA** | Delete as separate board OR keep as filter: `Status ∈ {In Dev testing, In UAT}` |
| **In Development** | Remove tab; use Current Sprint + filter |
| **EL** | Add filter `Sprint = @current` on top of `projects:EL`; keep group by Assignee for standup |
| **By Users** | Use only for weekly load review; WIP max 3 in *In Development* per person |

---

## Iterations (sprints)

1. Project **⋯** → **Settings** → enable **Iterations** (2-week cadence).
2. Name iterations `Sprint YYYY-MM-DD`.
3. **Current Sprint** view: filter `iteration:@current`.

---

## Assignee cleanup (manual, one-time)

- Standardize on one account per person (`lishu-rumsan` **or** `rumsan-lishu`, not both).
- Re-assign open cards from the duplicate account.
