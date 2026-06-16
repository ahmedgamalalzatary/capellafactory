# Phase 3: Ingredient Purchases

## Status

Implemented in the current codebase.

## What Landed

- shared `ingredient-purchases` contracts
- backend ingredient purchase module
- invoice code and stock ledger support
- quantity normalization utilities
- purchases UI and detail page
- API and web tests

## Current Files

Key files that now exist for this phase:

- `packages/shared/src/ingredient-purchases/*`
- `apps/api/src/modules/ingredient-purchases/*`
- `apps/api/src/services/invoice-code.service.ts`
- `apps/api/src/services/stock-costing.service.ts`
- `apps/api/src/utils/quantity-normalization.ts`
- `apps/api/src/utils/stock-ledger.ts`
- `apps/api/tests/ingredient-purchases.*`
- `apps/api/tests/quantity-normalization.test.ts`
- `apps/web/src/components/purchases/*ingredient-purchase*`
- `apps/web/src/app/(app)/purchases/ingredient-purchases/[id]/page.tsx`
- `apps/web/tests/ingredient-purchases.test.ts`

## What This Phase Means In Today’s Repo

This is the first implemented stock-affecting purchase flow. It is also where the live codebase begins to show the shared costing and ledger direction that later phases reuse.

## Notes

The old phase description talked about preparing for later phases. Those later phases now exist in the same repository, so this phase should be read as completed infrastructure plus a live purchase workflow.
