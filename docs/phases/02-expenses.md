# Phase 2: Expenses

## Source Of Truth

- [../erp-specs.md](../erp-specs.md)
- [../folder-structure.md](../folder-structure.md)

## Goal

Deliver purchase expenses as a fully working end-to-end slice.

## Deliverables

- create/list/view expense records
- expense types: rent, food, water, gas, electricity, internet, salary, other
- `salary` requires employee name
- `other` requires custom label
- backdated expense entry allowed
- no edit/delete flow
- expenses stay independent from stock logic
- purchases page upgraded from placeholder to working expense UI

## Files To Create

- `packages/shared/src/expenses/expense.types.ts`
- `packages/shared/src/expenses/expense.schema.ts`
- `apps/api/src/db/schema/expenses.ts`
- `apps/api/src/modules/expenses/expenses.routes.ts`
- `apps/api/src/modules/expenses/expenses.controller.ts`
- `apps/api/src/modules/expenses/expenses.service.ts`
- `apps/api/src/modules/expenses/expenses.repository.ts`
- `apps/api/src/modules/expenses/expenses.validation.ts`
- `apps/api/src/modules/expenses/expenses.types.ts`
- `apps/api/tests/expenses.validation.test.ts`
- `apps/api/tests/expenses.repository.test.ts`
- `apps/web/src/lib/api/expenses.ts`
- `apps/web/src/components/purchases/expenses-table.tsx`
- `apps/web/src/components/purchases/expense-form.tsx`
- `apps/web/src/components/purchases/expense-dialog.tsx`
- `apps/web/tests/expenses.test.ts`

## Files To Edit

- `packages/shared/src/index.ts`
- `apps/api/src/db/schema/index.ts`
- `apps/api/src/routes/index.ts`
- `apps/web/src/app/purchases/page.tsx`

## Exit Criteria

- expenses work end to end from database to UI
- the purchases area is no longer placeholder-only
- expense validation rules are enforced in backend and frontend contracts

## Out Of Scope

- ingredient purchase invoices
- stock effects
- production
- sales
