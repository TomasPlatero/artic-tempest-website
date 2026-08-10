---
name: atlassian-workflow
description: "Trigger: implement, fix, change, feature, bug, refactor, código nuevo, arreglar, cambio, nueva funcionalidad. Jira task tracking + Confluence architectural decision documentation for the Artic Tempest project."
license: Apache-2.0
metadata:
  author: tomasplatero
  version: "1.0"
---

## Activation Contract

Load BEFORE any implementation, fix, or change in this repository. Load on any mention of "task", "issue", "Jira", "ATW", "tarea", "cambio", "feature", "bug", or "documentar decisión".

This skill enforces the Atlassian workflow contract: every change gets a Jira issue, work is tracked through the standard workflow, and architectural decisions are documented in Confluence.

## Hard Rules

1. ⛔ **Never start implementation without a Jira issue.** Create the issue in project ATW FIRST, then begin work. No issue = no code.
2. ⛔ **Issue type must match the scope.** Feature/mejora → `Función` (10004). Bug → `Error` (10005). Chore/refactor/docs → `Tarea` (10003). Never use the wrong type — it corrupts the board view and velocity tracking.
3. ⛔ **Branch naming: `ATW-XX/short-description`.** Create the branch immediately after the Jira issue, BEFORE any file edits. This links commits to the Jira issue automatically via the GitHub↔Jira integration. Examples: `ATW-42/fix-metamask-sentry-noise`, `ATW-7/add-drag-and-drop-roster`. Use kebab-case, keep it under 40 chars after the slash.
4. ⛔ **Move to In Progress before writing code.** Transition the issue from `To Do` → `In Progress` (transition `21`) before the first file edit. If you forget, do it immediately when you realize.
5. ⛔ **Move to Done after completing work.** Transition from `In Progress` → `Listo` (transition `41`) only after `npm run lint`, `npm run type-check`, and `npx -y react-doctor@latest . --verbose` pass cleanly. A failing pipeline means the issue stays in progress.
6. **Every architectural decision goes to Confluence.** Database schema changes, new patterns, API design decisions, service boundaries, auth flows — document them in the **Artic Tempest Wiki** space (key: `ATW`, id: `262146`).
7. **Issue summary format:** `[area]: brief description`. Examples: `[auth]: fix session expiry on token refresh`, `[roster]: add drag-and-drop rank reordering`, `[api]: migrate recruitment endpoints to server actions`.
8. **Use cloudId `946f239f-045d-4774-b05f-aafe1c030b74`** for all Jira and Confluence API calls.

## Project Context

| Field | Value |
|---|---|
| Jira project | ATW (id: 10000) |
| Cloud site ID | `946f239f-045d-4774-b05f-aafe1c030b74` |
| Confluence space | Artic Tempest Wiki (key: ATW, id: 262146) |

| Issue Type | ID | Use for |
|---|---|---|
| Función (Feature) | 10004 | New features, enhancements, capabilities |
| Error (Bug) | 10005 | Bugs, regressions, broken behavior |
| Tarea (Task) | 10003 | Chores, refactors, docs, config, maintenance |

## Decision Gates

| Trigger | Action |
|---|---|
| New change requested | Gate 1: Create Jira issue with correct type |
| Issue created | Gate 1.5: Create branch `ATW-XX/short-description` |
| Starting implementation | Gate 2: Checkout branch + transition to In Progress |
| Implementation complete + checks pass | Gate 3: Transition to Done |
| Architectural decision made | Gate 4: Document in Confluence |
| Change scope expands | Update issue summary/description; do NOT create a second issue |

## Execution Steps

### Gate 1 — Create Jira Issue

Before touching any file, create the issue via `atlassian_rovo_createJiraIssue`:

```
cloudId: "946f239f-045d-4774-b05f-aafe1c030b74"
projectKey: "ATW"
issueTypeName: "Error" | "Función" | "Tarea"
summary: "[area]: brief description in the same language as the task context"
description: "## Context\n...\n\n## Acceptance Criteria\n- [ ] ..."
```

**Note:** the tool uses `projectKey` (not `projectId`), `issueTypeName` (not `issueTypeId`), and the names are in Spanish: `"Error"`, `"Función"`, `"Tarea"`.

The description MUST include a `## Context` section (why this change) and an `## Acceptance Criteria` checklist.

After creation, report the issue key (e.g. `ATW-42`) to the user.

### Gate 1.5 — Create Branch

Immediately after issue creation, create a branch named after the issue:

```bash
git checkout -b ATW-XX/short-description
```

- Use kebab-case for the description
- Keep the full branch name under 60 chars
- This triggers automatic commit↔issue linking in the GitHub↔Jira integration

### Gate 2 — Transition to In Progress

Before the first `edit` or `write`:

1. Transition via `atlassian_rovo_transitionJiraIssue` with transition `{"id": "21"}` ("En curso")
2. Example: `{ cloudId, issueIdOrKey: "ATW-42", transition: { id: "21" } }`

If the agent forgets this step (starts editing before transitioning), transition immediately upon realizing and note it was a late transition.

### Gate 3 — Transition to Done

After all checks pass cleanly:

1. Run `npm run lint && npm run type-check`
2. Run `npx -y react-doctor@latest . --verbose`
3. All three must pass with zero issues
4. Transition to `Listo` via `atlassian_rovo_transitionJiraIssue` with transition `{"id": "41"}`
5. Add a closing comment via `atlassian_rovo_addCommentToJiraIssue` using `commentBody` (not `comment`) summarizing:
   - Files changed and line count
   - Key decisions made during implementation
   - Link to Confluence doc if one was created

**Note:** transition parameter is an object `{ id: "41" }`, not a plain string. Comment uses `commentBody`, not `comment`.

### Gate 4 — Document Architectural Decisions in Confluence

When a significant design decision is made during implementation:

1. Create a page in the **Artic Tempest Wiki** space (space key: `ATW`, id: `262146`) via `atlassian_rovo_createConfluencePage`
2. Title format: `[ADR] <decision title>` (ADR = Architecture Decision Record)
3. Page structure:
   - **Status:** Proposed / Accepted / Deprecated
   - **Context:** What problem does this solve?
   - **Decision:** What was decided and why?
   - **Consequences:** What are the trade-offs? What becomes easier/harder?
   - **Alternatives considered:** What other options were evaluated?
4. Link the Confluence page in the Jira issue's closing comment

Not every change needs an ADR. Trigger when: new pattern introduced, DB schema change, auth/permission model change, API contract decision, new external dependency, or a significant refactor approach.

## Output Contract

**Issue created:** issue key + URL + type + summary.
**Work started:** transition confirmation (To Do → In Progress).
**Work completed:** transition confirmation (In Progress → Done) + closing comment with summary + Confluence link if applicable.
**ADR created:** Confluence page URL + status + linked Jira issue.

## Tool Mapping

| Action | MCP Tool |
|---|---|
| Create issue | `atlassian_rovo_createJiraIssue` (uses `projectKey`, `issueTypeName`) |
| Get transitions | `atlassian_rovo_getTransitionsForJiraIssue` (uses `issueIdOrKey`) |
| Transition issue | `atlassian_rovo_transitionJiraIssue` (transition is `{ id: "21" }`) |
| Add comment | `atlassian_rovo_addCommentToJiraIssue` (uses `commentBody`) |
| Search issues | `atlassian_rovo_searchJiraIssuesUsingJql` |
| Get issue details | `atlassian_rovo_getJiraIssue` |
| Create Confluence page | `atlassian_rovo_createConfluencePage` |
| Get Confluence spaces | `atlassian_rovo_getConfluenceSpaces` |
