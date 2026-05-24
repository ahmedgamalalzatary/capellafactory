# Delivery Phases

These phase documents break the ERP work into smaller end-to-end slices.

Each phase should be implemented from:

- database schema and migrations
- shared contracts and validation
- API module and route registration
- tests
- frontend API client
- frontend page/components

## Source Of Truth

Before implementing any phase, use these docs as the primary source of truth:

- [../erp-specs.md](../erp-specs.md)
- [../folder-structure.md](../folder-structure.md)

If a phase doc is unclear, the two docs above win.

## Recommended Order

1. [01-inventory-foundation.md](./01-inventory-foundation.md)
2. [02-expenses.md](./02-expenses.md)
3. [03-ingredient-purchases.md](./03-ingredient-purchases.md)
4. [04-production-batches.md](./04-production-batches.md)
5. [05-sales-invoices.md](./05-sales-invoices.md)
6. [06-ingredient-adjustments.md](./06-ingredient-adjustments.md)

## Phase Rule

Each phase is expected to land as a usable vertical slice. Do not start a later phase until the current one works end to end.

## Explicit Scope Boundary

- Reports: not yet
- Recipe management: not yet
- Returns: never
- Authentication/authorization: never
