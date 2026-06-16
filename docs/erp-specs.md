# ERP Specs

This document reflects the current codebase state, not the original greenfield plan.

## Current Product Scope

The repository currently implements these functional areas:

- authentication with cookie-backed sessions
- suppliers CRUD
- buyers CRUD
- ingredient catalog and stock-facing inventory views
- finished-product catalog
- purchase expenses
- ingredient purchase invoices
- purchase corrections
- production batches
- sales invoices

There is also a `reports` route in the frontend shell, but the current docs and route tree suggest it is navigation scaffolding rather than a completed reporting module.

## Architecture

### Frontend

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- feature-grouped components
- Vitest + Testing Library

### Backend

- Node.js
- Express 5
- TypeScript
- Drizzle ORM
- MySQL
- module-first domain organization

### Monorepo

- `pnpm` workspaces
- Turborepo
- shared contracts package at `packages/shared`

## Authentication

Authentication is now part of the shipped application.

Current behavior visible in code:

- backend routes expose `/auth/login`, `/auth/me`, and `/auth/logout`
- all business routes are mounted after `requireAuth`
- the frontend middleware redirects unauthenticated users to `/login`
- the session cookie name used by the frontend is `capella_session`

This means older docs that declared auth permanently out of scope are no longer accurate for the live repo.

## Current Backend Surface

The API currently registers these business endpoints:

- `GET /health`
- `/auth`
- `/buyers`
- `/expenses`
- `/ingredient-purchases`
- `/ingredients`
- `/purchase-corrections`
- `/production-batches`
- `/products`
- `/sales-invoices`
- `/suppliers`

The naming choice in the codebase is `purchase-corrections`, not `ingredient-adjustments`.

## Domain Model Status

### Suppliers and buyers

Suppliers and buyers remain master-data modules with shared contracts and dedicated API modules.

Current code confirms:

- both have backend modules and tests
- both have frontend feature components and route pages
- both are part of the shared package

### Ingredients and products

Ingredients and products are implemented as separate catalogs with inventory-oriented frontend support.

The codebase includes:

- backend modules for both
- shared schemas and types for both
- frontend inventory/product components
- tests for both API and web behavior

### Expenses

Expenses are implemented as their own transactional module and UI flow.

The codebase includes:

- backend routes and repository tests
- shared `expenses` contracts
- purchases UI components and detail route

### Ingredient purchases

Ingredient purchases are implemented end to end.

Supporting code present in the repo includes:

- backend module and tests
- invoice code service usage in the API layer
- quantity normalization and stock ledger helpers
- shared `ingredient-purchases` contracts
- purchases UI components and detail route

### Production batches

Production batches are implemented in the current tree.

Evidence in the repo:

- backend `production-batches` module and tests
- shared `production-batches` contracts
- web production components and page coverage
- Drizzle migration history beyond the initial inventory and purchase phases

### Sales invoices

Sales invoices are also implemented in the current tree.

Evidence in the repo:

- backend `sales-invoices` module and tests
- shared `sales-invoices` contracts
- web sales components and detail route
- migration `0012_sales_invoices.sql`

### Purchase corrections

The repo implements stock correction behavior under the name `purchase-corrections`.

Current code proves:

- backend module exists with controller/repository/validation tests
- shared contracts exist under `packages/shared/src/purchase-corrections`
- frontend route and tests exist under purchases

Because `docs/phases/06-ingredient-adjustments.md` is excluded from this update, that older document still uses the previous naming and should be treated as historical planning material.

## Shared Contract Coverage

The shared package currently exports contracts for:

- suppliers
- buyers
- ingredients
- products
- expenses
- ingredient purchases
- production batches
- purchase corrections
- sales invoices

This means the shared package has already moved past the earlier planning stage where only the first few domains existed.

## Stock and Costing Support

The codebase contains explicit stock and costing utilities in the API:

- `services/invoice-code.service.ts`
- `services/stock-costing.service.ts`
- `utils/fifo-stock.ts`
- `utils/quantity-normalization.ts`
- `utils/stock-ledger-core.ts`
- `utils/stock-ledger.ts`

That indicates the application now includes centralized FIFO and ledger logic rather than only CRUD scaffolding.

## Testing State

The repo contains active tests for both apps.

### API tests

Current API coverage includes:

- app boot
- auth
- validation
- repositories
- sales invoices
- production batches
- purchase corrections
- stock ledger helpers
- quantity normalization

### Web tests

Current web coverage includes:

- shell behavior
- suppliers and buyers
- inventory and products
- expenses and ingredient purchases
- purchase corrections
- production batches
- sales invoices
- dialog/form DOM tests
- API helper tests
- submit lock behavior

## Scope Notes

A few old assumptions are now stale relative to the code:

- auth is implemented
- production batches are implemented
- sales invoices are implemented
- ingredient adjustments were renamed in code to `purchase-corrections`

Use this document and `docs/folder-structure.md` as the source of truth for the current repository shape. Use the phase docs as implementation history and rollout notes.
