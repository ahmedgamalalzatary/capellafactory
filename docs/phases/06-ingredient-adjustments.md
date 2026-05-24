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
- current weighted-average cost used for valuation
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

## Out Of Scope

- sales returns, permanently
- purchase returns, permanently
- finished-product manual adjustments
