# Phase 4: Production Batches

## Source Of Truth

- [../erp-specs.md](../erp-specs.md)
- [../folder-structure.md](../folder-structure.md)

## Goal

Deliver production batches end to end so ingredients can be consumed and finished-product stock can be created.

## Deliverables

- create/list/view production batches
- one finished product output per batch
- multiple ingredient consumption lines
- each ingredient can appear only once per batch
- no predefined recipe system in the current scope yet
- ingredient stock validation before save
- batch cost snapshot based on current ingredient average cost
- finished-product weighted-average cost update on batch save
- backdated production with recalculation guard
- stock movement history for ingredient consumption and finished-product output

## Files To Create

- `packages/shared/src/production-batches/production-batch.types.ts`
- `packages/shared/src/production-batches/production-batch.schema.ts`
- `apps/api/src/db/schema/production-batches.ts`
- `apps/api/src/modules/production-batches/production-batches.routes.ts`
- `apps/api/src/modules/production-batches/production-batches.controller.ts`
- `apps/api/src/modules/production-batches/production-batches.service.ts`
- `apps/api/src/modules/production-batches/production-batches.repository.ts`
- `apps/api/src/modules/production-batches/production-batches.validation.ts`
- `apps/api/src/modules/production-batches/production-batches.types.ts`
- `apps/api/tests/production-batches.validation.test.ts`
- `apps/api/tests/production-batches.repository.test.ts`
- `apps/web/src/lib/api/production-batches.ts`
- `apps/web/src/components/production/production-batches-table.tsx`
- `apps/web/src/components/production/production-batch-form.tsx`
- `apps/web/src/components/production/production-batch-dialog.tsx`
- `apps/web/tests/production-batches.test.ts`

## Files To Edit

- `packages/shared/src/index.ts`
- `apps/api/src/db/schema/index.ts`
- `apps/api/src/routes/index.ts`
- `apps/api/src/services/stock-costing.service.ts`
- `apps/api/src/utils/stock-ledger.ts`
- `apps/web/src/app/inventory/page.tsx`
- `apps/web/src/app/purchases/page.tsx`
- `apps/web/src/app/sales/page.tsx`

## Exit Criteria

- saving a batch consumes ingredient stock and creates finished-product stock
- batch cost is snapshotted and finished-product average cost updates correctly
- inventory screens can show produced-product balances

## Out Of Scope

- sales invoices
- ingredient adjustments
