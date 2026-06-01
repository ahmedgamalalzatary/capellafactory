# Phase 3: Ingredient Purchases

## Source Of Truth

- [../erp-specs.md](../erp-specs.md)
- [../folder-structure.md](../folder-structure.md)

## Goal

Deliver ingredient purchase invoices end to end, including the first real ingredient stock movement flow.

## Deliverables

- create/list/view ingredient purchase invoices
- invoice header plus multiple ingredient lines
- one supplier link or one typed supplier name per invoice
- typed supplier names remain invoice-only
- each ingredient can appear only once per invoice
- quantity plus unit price input, total derived automatically
- normalized base quantities for `kg/g` and `L/ml`
- weighted-average ingredient costing updates on save
- backdated invoice entry with chronological recalculation support
- groundwork only for later-history conflict detection once later stock-affecting phases exist
- stock movement history starts existing for ingredients

## Files To Create

- `packages/shared/src/ingredient-purchases/ingredient-purchase.types.ts`
- `packages/shared/src/ingredient-purchases/ingredient-purchase.schema.ts`
- `apps/api/src/db/schema/ingredient-purchases.ts`
- `apps/api/src/modules/ingredient-purchases/ingredient-purchases.routes.ts`
- `apps/api/src/modules/ingredient-purchases/ingredient-purchases.controller.ts`
- `apps/api/src/modules/ingredient-purchases/ingredient-purchases.service.ts`
- `apps/api/src/modules/ingredient-purchases/ingredient-purchases.repository.ts`
- `apps/api/src/modules/ingredient-purchases/ingredient-purchases.validation.ts`
- `apps/api/src/modules/ingredient-purchases/ingredient-purchases.types.ts`
- `apps/api/src/services/invoice-code.service.ts`
- `apps/api/src/services/stock-costing.service.ts`
- `apps/api/src/utils/quantity-normalization.ts`
- `apps/api/src/utils/stock-ledger.ts`
- `apps/api/tests/ingredient-purchases.validation.test.ts`
- `apps/api/tests/ingredient-purchases.repository.test.ts`
- `apps/api/tests/quantity-normalization.test.ts`
- `apps/web/src/lib/api/ingredient-purchases.ts`
- `apps/web/src/components/purchases/ingredient-purchases-table.tsx`
- `apps/web/src/components/purchases/ingredient-purchase-form.tsx`
- `apps/web/src/components/purchases/ingredient-purchase-dialog.tsx`
- `apps/web/tests/ingredient-purchases.test.ts`

## Files To Edit

- `packages/shared/src/index.ts`
- `apps/api/src/db/schema/index.ts`
- `apps/api/src/routes/index.ts`
- `apps/api/src/modules/ingredients/ingredients.repository.ts`
- `apps/web/src/app/purchases/page.tsx`
- `apps/web/src/app/inventory/page.tsx`

## Exit Criteria

- saving an ingredient purchase invoice updates ingredient stock and ingredient average cost
- purchase invoice validation and unit normalization are covered by tests
- inventory screens can show current ingredient stock after purchases
- the codebase is ready for later shared ledger conflict checks, but later-history invalidation is not considered complete until stock-consuming phases exist

## Out Of Scope

- production batches
- sales invoices
- ingredient adjustments
