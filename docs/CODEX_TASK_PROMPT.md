# Codex Task — Finish DTY ERP V1.0-RC.3 to Production Candidate

You are working on an Arabic-first RTL DTY manufacturing ERP. Continue from the existing code; do not redesign the domain model unless a failing test or schema defect requires it.

## Goal
Turn RC.3 into a buildable, tested Production Candidate for the DTY factory pilot.

## Mandatory sequence
1. Read `README_AR.md`, `docs/CODEX_HANDOFF.md`, `docs/RELEASE_NOTES_AR.md`, `docs/VALIDATION_REPORT.json`.
2. Run `npm install --no-audit --no-fund`; review and commit `package-lock.json`.
3. Change Dockerfile and GitHub CI bootstrap step to `npm ci` after the lockfile exists.
4. Run `npx prisma format`, `npx prisma validate`, `npx prisma generate`.
5. Create a PostgreSQL 16 empty staging database and generate a clean `baseline` migration from the current schema. Do not apply files in `prisma/legacy-migrations/` to a new DB.
6. Run all existing tests/checks, `npm run typecheck`, and `npm run build`; fix all defects.
7. Add Playwright E2E for the critical workflows below.
8. Run a security review focused on company/plant isolation, cookie/session handling, CSRF/same-origin, concurrency, secrets/logging, and API authorization.
9. Produce a concise test report and open a Draft PR only when CI is green.

## Critical workflows
- Login + RBAC + authorized Plant selection.
- MRP → PR → RFQ → Supplier Quote → PO → approval → GRN → POY lot → QC release.
- Production Plan → Production Order → POY issue → Run → live downtime → Mass Balance → Finished DTY Lot.
- QC test → Release/Hold/Reject.
- Quotation → Sales Order → Credit → Allocation → Dispatch → Invoice → Collection.
- Supplier Invoice → Supplier Payment.
- Stock Count → Submit → Approve → Post with conflict detection.
- Maintenance order → Spare issue → Maintenance cost.
- Traceability POY lot ↔ DTY lot ↔ customer delivery.

## Non-negotiable rules
- Arabic-first RTL.
- No negative inventory.
- No issue/sale/dispatch from HOLD or REJECTED lots.
- Full lot traceability.
- Mass balance before run close.
- Below-floor price requires controlled approval.
- Credit block requires management override.
- AI Factory Assistant is read-only.
- Every write must enforce company/plant ownership, not merely possession of an ID.

## Factory seed facts
- Plant code: 2100.
- 6 DTY machines.
- Total spindle count: 1,414.

Do not mark the release Production-ready until Prisma validation, semantic typecheck, Next production build, E2E tests, and PostgreSQL pilot checks all pass.
