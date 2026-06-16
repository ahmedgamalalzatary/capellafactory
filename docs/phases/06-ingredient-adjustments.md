# Phase 6: Ingredient Adjustments

## Source Of Truth

- [../erp-specs.md](../erp-specs.md)
- [../folder-structure.md](../folder-structure.md)

## Goal

Deliver ingredient adjustments end to end and finish the remaining stock-correction workflow for v1.

## Deliverables

- create/list/view ingredient adjustments
- existing ingredient only
- increase and decrease directions
- required reason
- FIFO stock-layer allocation/valuation used for stock decreases
- no backdating
- no negative stock allowed
- immutable after create
- inventory movement history includes adjustments

## Files To Create

- `packages/shared/src/ingredient-adjustments/ingredient-adjustment.types.ts`
- `packages/shared/src/ingredient-adjustments/ingredient-adjustment.schema.ts`
- `apps/api/src/db/schema/ingredient-adjustments.ts`
- `apps/api/src/modules/ingredient-adjustments/ingredient-adjustments.routes.ts`
- `apps/api/src/modules/ingredient-adjustments/ingredient-adjustments.controller.ts`
- `apps/api/src/modules/ingredient-adjustments/ingredient-adjustments.service.ts`
- `apps/api/src/modules/ingredient-adjustments/ingredient-adjustments.repository.ts`
- `apps/api/src/modules/ingredient-adjustments/ingredient-adjustments.validation.ts`
- `apps/api/src/modules/ingredient-adjustments/ingredient-adjustments.types.ts`
- `apps/api/tests/ingredient-adjustments.validation.test.ts`
- `apps/api/tests/ingredient-adjustments.repository.test.ts`
- `apps/web/src/lib/api/ingredient-adjustments.ts`
- `apps/web/src/components/purchases/ingredient-adjustments-table.tsx`
- `apps/web/src/components/purchases/ingredient-adjustment-form.tsx`
- `apps/web/src/components/purchases/ingredient-adjustment-dialog.tsx`
- `apps/web/tests/ingredient-adjustments.test.ts`

## Files To Edit

- `packages/shared/src/index.ts`
- `apps/api/src/db/schema/index.ts`
- `apps/api/src/routes/index.ts`
- `apps/api/src/services/stock-costing.service.ts`
- `apps/api/src/utils/stock-ledger.ts`
- `apps/web/src/app/purchases/page.tsx`
- `apps/web/src/app/inventory/page.tsx`

## Exit Criteria

- ingredient adjustments work end to end
- adjustment save updates stock history and current ingredient balance
- purchases and inventory areas expose the final v1 stock-correction flow

## Inventory Movement History Viewer

A late add-on inside phase 6 that finally exposes the full `+` / `-` stock timeline, now that every movement source from phases 3 through 6 exists. Lands after the adjustments slice above is working end to end.

### Deliverables

- per-ingredient and per-product history routes
- timeline aggregates purchases, production in/out, sales, and adjustments
- each row shows direction (`+` / `-`), quantity in base unit, source record (type + id), and datetime
- chronological order with creation-order tie-breaker on equal datetimes
- archived items still browsable through the history route
- no edit or delete on movement rows
- the existing "تاريخ الحركات" cell on the inventory tables becomes the entry point

### Files To Create

- `packages/shared/src/stock-movements/stock-movement.types.ts`
- `apps/api/src/modules/stock-movements/stock-movements.routes.ts`
- `apps/api/src/modules/stock-movements/stock-movements.controller.ts`
- `apps/api/src/modules/stock-movements/stock-movements.service.ts`
- `apps/api/src/modules/stock-movements/stock-movements.repository.ts`
- `apps/api/src/modules/stock-movements/stock-movements.types.ts`
- `apps/api/tests/stock-movements.repository.test.ts`
- `apps/web/src/lib/api/stock-movements.ts`
- `apps/web/src/app/inventory/ingredients/[id]/history/page.tsx`
- `apps/web/src/app/inventory/products/[id]/history/page.tsx`
- `apps/web/src/components/inventory/stock-movements-table.tsx`
- `apps/web/tests/stock-movements.test.ts`

### Files To Edit

- `packages/shared/src/index.ts`
- `apps/api/src/routes/index.ts`
- `apps/api/src/utils/stock-ledger.ts`
- `apps/web/src/components/inventory/ingredients-table.tsx`
- `apps/web/src/components/inventory/products-table.tsx`

### Exit Criteria

- clicking an item's "تاريخ الحركات" cell opens its dedicated timeline page
- timeline shows every `+` and `-` event sourced from phases 3, 4, 5, and 6
- new purchases, batches, sales, and adjustments appear in the affected items' timelines on refresh

## Out Of Scope

- sales returns, permanently
- purchase returns, permanently
- finished-product manual adjustments
