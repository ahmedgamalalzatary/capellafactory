# Phase 5: Sales Invoices

## Source Of Truth

- [../erp-specs.md](../erp-specs.md)
- [../folder-structure.md](../folder-structure.md)

## Goal

Deliver sales invoices end to end so finished-product stock can be sold through working UI and API flows.

## Deliverables

- create/list/view sales invoices
- finished products only, no ingredient sales
- one line per finished product
- user-entered selling unit price
- one saved buyer only
- no typed buyer names in sales invoices
- stock availability validation before save
- finished-product stock reduction on save
- finished-product cost usage based on FIFO product stock-layer allocations
- no edit/delete and no backdating
- buyer lock rules once linked to invoice history

## Files To Create

- `packages/shared/src/sales-invoices/sales-invoice.types.ts`
- `packages/shared/src/sales-invoices/sales-invoice.schema.ts`
- `apps/api/src/db/schema/sales-invoices.ts`
- `apps/api/src/modules/sales-invoices/sales-invoices.routes.ts`
- `apps/api/src/modules/sales-invoices/sales-invoices.controller.ts`
- `apps/api/src/modules/sales-invoices/sales-invoices.service.ts`
- `apps/api/src/modules/sales-invoices/sales-invoices.repository.ts`
- `apps/api/src/modules/sales-invoices/sales-invoices.validation.ts`
- `apps/api/src/modules/sales-invoices/sales-invoices.types.ts`
- `apps/api/tests/sales-invoices.validation.test.ts`
- `apps/api/tests/sales-invoices.repository.test.ts`
- `apps/web/src/lib/api/sales-invoices.ts`
- `apps/web/src/components/sales/sales-invoices-table.tsx`
- `apps/web/src/components/sales/sales-invoice-form.tsx`
- `apps/web/src/components/sales/sales-invoice-dialog.tsx`
- `apps/web/tests/sales-invoices.test.ts`

## Files To Edit

- `packages/shared/src/index.ts`
- `apps/api/src/db/schema/index.ts`
- `apps/api/src/routes/index.ts`
- `apps/api/src/modules/buyers/buyers.repository.ts`
- `apps/api/src/modules/buyers/buyers.service.ts`
- `apps/api/src/modules/buyers/buyers.controller.ts`
- `apps/api/src/services/invoice-code.service.ts`
- `apps/api/src/services/stock-costing.service.ts`
- `apps/api/src/utils/stock-ledger.ts`
- `apps/web/src/app/sales/page.tsx`
- `apps/web/src/app/inventory/page.tsx`

## Exit Criteria

- saving a sales invoice reduces finished-product stock
- insufficient stock blocks invoice save
- sales page is upgraded from placeholder to working invoice management

## Out Of Scope

- ingredient adjustments
- returns, permanently
