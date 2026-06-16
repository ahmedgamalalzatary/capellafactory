# Phase 4: Production Batches

## Status

Implemented in the current codebase.

## What Landed

- shared `production-batches` contracts
- backend production batches module
- production-related frontend components
- product-side production batch detail route
- API and web tests
- downstream use of stock and costing helpers

## Current Files

Key files that now exist for this phase:

- `packages/shared/src/production-batches/*`
- `apps/api/src/modules/production-batches/*`
- `apps/api/tests/production-batches.repository.test.ts`
- `apps/api/tests/production-batches.validation.test.ts`
- `apps/web/src/components/production/*`
- `apps/web/src/app/(app)/products/production-batches/[id]/page.tsx`
- `apps/web/tests/production-batches.test.ts`
- `apps/web/tests/production-batch-form.dom.test.tsx`

## What This Phase Means In Today’s Repo

Production is no longer just a planned stock transformation. The module, routes, frontend coverage, and tests are already present in the codebase.

## Notes

This phase sits between ingredient purchase inflows and sales outflows in the shipped system shape. The current file tree confirms that positioning.
