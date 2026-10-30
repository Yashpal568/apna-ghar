# Apna Ghar — Locked Execution Governance

**Authority:** `docs/19-master-execution-checklist.md` is the single source of truth for milestone status, task completion, blockers, and the next exact task. This file defines the rules; it does not replace the master checklist.

## Mandatory completion gate

A task may be marked complete only when all of the following are recorded in the master checklist:

1. The implementation is committed to Git and the exact commit SHA is recorded.
2. Relevant automated tests were actually run and passed; record workflow/run IDs or local commands and outcomes.
3. Applicable integration, API, browser, or deployment acceptance evidence is recorded. Mocked tests do not count as live-service verification.
4. The checklist entry and session log are updated with remaining blockers and the next exact task.

Pending, skipped, flaky, unavailable, or mocked verification must never be described as passed. If a later commit invalidates earlier evidence, reopen the checklist item until the new head is verified.

## Session start and handoff

- Read the master checklist first, then inspect the active PR, branch head, recent commits, and latest CI failures.
- Resume from the current checkpoint in the master checklist; do not infer completion from code presence or old session notes.
- Every meaningful implementation change must be followed by a checklist update in the same work sequence.
- Keep the web-first order: M2 marketplace acceptance, M3 backend/identity acceptance, M4 admin, M5 SEO, M6 security/reliability, M7 entitlements, M8 data/media, M9 release QA, and M10 native mobile last.
- Do not spend time on cosmetic UI redesign until functional milestones are accepted. Preserve approved branding and existing themes while making necessary functional fixes.
- Free launch remains the rule; payment collection stays disabled unless explicitly approved.
- Do not merge or deploy a PR until required CI and acceptance gates pass.

## Current checkpoint (2026-10-30)

- Active PR: [#11](https://github.com/Yashpal568/apna-ghar/pull/11), head branch `feat/m3-backend-identity`, base `deploy/cloudflare-preview`.
- Latest code commit at checkpoint: `7a92da4bbbf5386f0a6e797b43004d8041d5901c`.
- Fixed the API pagination unit-test expectation to use MongoDB's `$$message.sentAt` aggregation variable, matching the controller expression.
- Fresh CI and Quality Checks were triggered for that commit. At the time this governance entry was written, runs were still in progress/pending; no green result is claimed.
- Next exact task: inspect both latest workflow outcomes, fix any remaining failure, then update `docs/19-master-execution-checklist.md` with the commit SHA, run IDs, exact results, and next checkpoint. Continue M2/M3 live acceptance only after CI is green.
