# Phase 1: Inventory Foundation

## Source Of Truth

- [../erp-specs.md](../erp-specs.md)
- [../folder-structure.md](../folder-structure.md)

## Goal

Create the inventory master-data foundation for:

- ingredients
- finished products

This phase should deliver working create/list/update flows plus the base rules needed by later stock phases.

## Deliverables

- ingredient master records with unique names
- finished-product master records with unique names
- archive/reactivate support on both master types
- archive allowed only when stock is `0`
- delete allowed only when stock is `0` and there is no history
- archived items hidden from new transaction forms later
- inventory page upgraded from placeholder to working catalog screens
- shared unit-family model for ingredients
- ingredient unit-family model supports `weight`, `volume`, and `count`

## Files To Create

- `packages/shared/src/ingredients/ingredient.types.ts`
- `packages/shared/src/ingredients/ingredient.schema.ts`
- `packages/shared/src/products/product.types.ts`
- `packages/shared/src/products/product.schema.ts`
- `apps/api/src/db/schema/ingredients.ts`
- `apps/api/src/db/schema/products.ts`
- `apps/api/src/modules/ingredients/ingredients.routes.ts`
- `apps/api/src/modules/ingredients/ingredients.controller.ts`
- `apps/api/src/modules/ingredients/ingredients.service.ts`
- `apps/api/src/modules/ingredients/ingredients.repository.ts`
- `apps/api/src/modules/ingredients/ingredients.validation.ts`
- `apps/api/src/modules/ingredients/ingredients.types.ts`
- `apps/api/src/modules/products/products.routes.ts`
- `apps/api/src/modules/products/products.controller.ts`
- `apps/api/src/modules/products/products.service.ts`
- `apps/api/src/modules/products/products.repository.ts`
- `apps/api/src/modules/products/products.validation.ts`
- `apps/api/src/modules/products/products.types.ts`
- `apps/api/tests/ingredients.validation.test.ts`
- `apps/api/tests/ingredients.repository.test.ts`
- `apps/api/tests/products.validation.test.ts`
- `apps/api/tests/products.repository.test.ts`
- `apps/web/src/lib/api/ingredients.ts`
- `apps/web/src/lib/api/products.ts`
- `apps/web/src/components/inventory/ingredients-table.tsx`
- `apps/web/src/components/inventory/ingredient-form.tsx`
- `apps/web/src/components/inventory/ingredient-dialog.tsx`
- `apps/web/src/components/inventory/products-table.tsx`
- `apps/web/src/components/inventory/product-form.tsx`
- `apps/web/src/components/inventory/product-dialog.tsx`
- `apps/web/tests/ingredients.test.ts`
- `apps/web/tests/products.test.ts`

## Files To Edit

- `packages/shared/src/index.ts`
- `apps/api/src/db/schema/index.ts`
- `apps/api/src/routes/index.ts`
- `apps/web/src/app/inventory/page.tsx`
- `apps/web/tests/app-shell.test.ts`

## Exit Criteria

- inventory master records work end to end
- placeholder inventory page is replaced with working ingredient/product management
- later phases can safely reference ingredient IDs and product IDs

## Out Of Scope

- stock movement history
- purchases
- production
- sales
- ingredient adjustments
