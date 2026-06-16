# Phase 2: Expenses

## Status

Implemented in the current codebase.

## What Landed

- shared `expenses` types and validation
- backend expenses module
- purchases-area expense UI
- expense detail route
- API and web tests

## Current Files

Key files that now exist for this phase:

- `packages/shared/src/expenses/*`
- `apps/api/src/modules/expenses/*`
- `apps/api/tests/expenses.repository.test.ts`
- `apps/api/tests/expenses.validation.test.ts`
- `apps/web/src/components/purchases/*expense*`
- `apps/web/src/app/(app)/purchases/expenses/[id]/page.tsx`
- `apps/web/tests/expenses.test.ts`

## Current Behavior Summary

Expenses are a separate transactional area under purchases. The repo structure and tests show this phase is no longer a placeholder and is already integrated with the authenticated shell.

## Notes

This phase remains separate from stock-consuming and stock-producing flows, even though it now lives beside those flows in the broader purchases area.
