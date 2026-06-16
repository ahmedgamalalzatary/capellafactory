# Delivery Phases

These documents describe the ERP rollout by vertical slice.

They are no longer just future plans. As of the current codebase:

- phases `01` through `05` are implemented in code
- phase `06` still exists as a planning document, but the shipped code uses the name `purchase-corrections`

## How To Read This Folder

- `01-inventory-foundation.md` through `05-sales-invoices.md` should be read as implemented slices with current-state notes
- `06-ingredient-adjustments.md` is excluded from this doc refresh and may not match the current naming used by the codebase

## Source Of Truth

For the live repository shape, use:

- [../erp-specs.md](../erp-specs.md)
- [../folder-structure.md](../folder-structure.md)

If a phase document disagrees with those two files, the two top-level docs win.

## Implemented Order

The current repository contains code for this progression:

1. [01-inventory-foundation.md](./01-inventory-foundation.md)
2. [02-expenses.md](./02-expenses.md)
3. [03-ingredient-purchases.md](./03-ingredient-purchases.md)
4. [04-production-batches.md](./04-production-batches.md)
5. [05-sales-invoices.md](./05-sales-invoices.md)

## Current Gap

The repo has a shipped `purchase-corrections` module and UI, but the matching historical phase doc still lives under:

- `06-ingredient-adjustments.md`

That file was intentionally left untouched in this update.
