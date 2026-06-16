# Phase 5: Sales Invoices

## Status

Implemented in the current codebase.

## What Landed

- shared `sales-invoices` contracts
- backend sales invoices module
- sales UI and detail route
- API and web tests
- schema migration support through `0012_sales_invoices.sql`

## Current Files

Key files that now exist for this phase:

- `packages/shared/src/sales-invoices/*`
- `apps/api/src/modules/sales-invoices/*`
- `apps/api/tests/sales-invoices.repository.test.ts`
- `apps/api/tests/sales-invoices.validation.test.ts`
- `apps/api/drizzle/migrations/0012_sales_invoices.sql`
- `apps/web/src/components/sales/*`
- `apps/web/src/app/(app)/sales/[id]/page.tsx`
- `apps/web/tests/sales-invoices.test.ts`
- `apps/web/tests/sales-invoice-form.dom.test.tsx`

## What This Phase Means In Today’s Repo

Sales is a live implemented slice, not a future placeholder. The module is present end to end across shared contracts, backend logic, migrations, frontend pages, and tests.

## Notes

Because sales invoices are already in the migration chain and route tree, earlier docs that treated this area as upcoming work are outdated.
