# Recommended Folder Structure

This project should use a `pnpm` workspace monorepo with Turborepo for running builds, development scripts, linting, and tests across apps and packages.

The monorepo should have separate apps for the frontend and backend, plus shared packages for reusable types and validation schemas.

The `web` app should use `shadcn/ui` as the component library on top of Next.js, Tailwind CSS, and TypeScript.

```txt
capella/
├─ apps/
│  ├─ web/
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  │  ├─ suppliers/
│  │  │  │  │  ├─ page.tsx
│  │  │  │  │  ├─ loading.tsx
│  │  │  │  │  └─ error.tsx
│  │  │  │  ├─ buyers/
│  │  │  │  │  ├─ page.tsx
│  │  │  │  │  ├─ loading.tsx
│  │  │  │  │  └─ error.tsx
│  │  │  │  ├─ inventory/
│  │  │  │  │  ├─ page.tsx
│  │  │  │  │  ├─ loading.tsx
│  │  │  │  │  └─ error.tsx
│  │  │  │  ├─ purchases/
│  │  │  │  │  ├─ page.tsx
│  │  │  │  │  ├─ loading.tsx
│  │  │  │  │  └─ error.tsx
│  │  │  │  ├─ sales/
│  │  │  │  │  ├─ page.tsx
│  │  │  │  │  ├─ loading.tsx
│  │  │  │  │  └─ error.tsx
│  │  │  ├─ components/
│  │  │  │  ├─ suppliers/
│  │  │  │  │  ├─ suppliers-table.tsx
│  │  │  │  │  ├─ supplier-form.tsx
│  │  │  │  │  ├─ supplier-dialog.tsx
│  │  │  │  │  └─ delete-supplier-dialog.tsx
│  │  │  │  ├─ buyers/
│  │  │  │  │  ├─ buyers-table.tsx
│  │  │  │  │  ├─ buyer-form.tsx
│  │  │  │  │  ├─ buyer-dialog.tsx
│  │  │  │  │  └─ delete-buyer-dialog.tsx
│  │  │  │  ├─ inventory/
│  │  │  │  │  ├─ ingredients-table.tsx
│  │  │  │  │  ├─ ingredient-form.tsx
│  │  │  │  │  ├─ ingredient-dialog.tsx
│  │  │  │  │  ├─ products-table.tsx
│  │  │  │  │  ├─ product-form.tsx
│  │  │  │  │  ├─ product-dialog.tsx
│  │  │  │  │  └─ stock-movements-table.tsx
│  │  │  │  ├─ purchases/
│  │  │  │  │  ├─ expenses-table.tsx
│  │  │  │  │  ├─ expense-form.tsx
│  │  │  │  │  ├─ expense-dialog.tsx
│  │  │  │  │  ├─ ingredient-purchases-table.tsx
│  │  │  │  │  ├─ ingredient-purchase-form.tsx
│  │  │  │  │  ├─ ingredient-purchase-dialog.tsx
│  │  │  │  │  ├─ ingredient-adjustments-table.tsx
│  │  │  │  │  ├─ ingredient-adjustment-form.tsx
│  │  │  │  │  └─ ingredient-adjustment-dialog.tsx
│  │  │  │  ├─ sales/
│  │  │  │  │  ├─ sales-invoices-table.tsx
│  │  │  │  │  ├─ sales-invoice-form.tsx
│  │  │  │  │  └─ sales-invoice-dialog.tsx
│  │  │  │  ├─ production/
│  │  │  │  │  ├─ production-batches-table.tsx
│  │  │  │  │  ├─ production-batch-form.tsx
│  │  │  │  │  └─ production-batch-dialog.tsx
│  │  │  │  └─ ui/
│  │  │  │     ├─ button.tsx
│  │  │  │     ├─ card.tsx
│  │  │  │     ├─ dialog.tsx
│  │  │  │     ├─ form.tsx
│  │  │  │     ├─ input.tsx
│  │  │  │     ├─ label.tsx
│  │  │  │     ├─ table.tsx
│  │  │  │     └─ textarea.tsx
│  │  │  ├─ lib/
│  │  │  │  ├─ api.ts
│  │  │  │  ├─ stock/
│  │  │  │  │  ├─ units.ts
│  │  │  │  │  └─ formatting.ts
│  │  │  │  └─ api/
│  │  │  │     ├─ suppliers.ts
│  │  │  │     ├─ buyers.ts
│  │  │  │     ├─ ingredients.ts
│  │  │  │     ├─ products.ts
│  │  │  │     ├─ expenses.ts
│  │  │  │     ├─ ingredient-purchases.ts
│  │  │  │     ├─ production-batches.ts
│  │  │  │     ├─ sales-invoices.ts
│  │  │  │     └─ ingredient-adjustments.ts
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  ├─ next.config.ts
│  │  ├─ postcss.config.js
│  │  ├─ components.json
│  │  └─ tailwind.config.ts
│  ├─ api/
│  │  ├─ src/
│  │  │  ├─ app.ts
│  │  │  ├─ server.ts
│  │  │  ├─ db/
│  │  │  │  ├─ client.ts
│  │  │  │  ├─ index.ts
│  │  │  │  └─ schema/
│  │  │  │     ├─ suppliers.ts
│  │  │  │     ├─ buyers.ts
│  │  │  │     ├─ ingredients.ts
│  │  │  │     ├─ products.ts
│  │  │  │     ├─ expenses.ts
│  │  │  │     ├─ ingredient-purchases.ts
│  │  │  │     ├─ production-batches.ts
│  │  │  │     ├─ sales-invoices.ts
│  │  │  │     ├─ ingredient-adjustments.ts
│  │  │  │     └─ index.ts
│  │  │  ├─ modules/
│  │  │  │  ├─ suppliers/
│  │  │  │  │  ├─ suppliers.routes.ts
│  │  │  │  │  ├─ suppliers.controller.ts
│  │  │  │  │  ├─ suppliers.service.ts
│  │  │  │  │  ├─ suppliers.repository.ts
│  │  │  │  │  ├─ suppliers.validation.ts
│  │  │  │  │  └─ suppliers.types.ts
│  │  │  │  ├─ buyers/
│  │  │  │  │  ├─ buyers.routes.ts
│  │  │  │  │  ├─ buyers.controller.ts
│  │  │  │  │  ├─ buyers.service.ts
│  │  │  │  │  ├─ buyers.repository.ts
│  │  │  │  │  ├─ buyers.validation.ts
│  │  │  │  │  └─ buyers.types.ts
│  │  │  │  ├─ ingredients/
│  │  │  │  │  ├─ ingredients.routes.ts
│  │  │  │  │  ├─ ingredients.controller.ts
│  │  │  │  │  ├─ ingredients.service.ts
│  │  │  │  │  ├─ ingredients.repository.ts
│  │  │  │  │  ├─ ingredients.validation.ts
│  │  │  │  │  └─ ingredients.types.ts
│  │  │  │  ├─ products/
│  │  │  │  │  ├─ products.routes.ts
│  │  │  │  │  ├─ products.controller.ts
│  │  │  │  │  ├─ products.service.ts
│  │  │  │  │  ├─ products.repository.ts
│  │  │  │  │  ├─ products.validation.ts
│  │  │  │  │  └─ products.types.ts
│  │  │  │  ├─ expenses/
│  │  │  │  │  ├─ expenses.routes.ts
│  │  │  │  │  ├─ expenses.controller.ts
│  │  │  │  │  ├─ expenses.service.ts
│  │  │  │  │  ├─ expenses.repository.ts
│  │  │  │  │  ├─ expenses.validation.ts
│  │  │  │  │  └─ expenses.types.ts
│  │  │  │  ├─ ingredient-purchases/
│  │  │  │  │  ├─ ingredient-purchases.routes.ts
│  │  │  │  │  ├─ ingredient-purchases.controller.ts
│  │  │  │  │  ├─ ingredient-purchases.service.ts
│  │  │  │  │  ├─ ingredient-purchases.repository.ts
│  │  │  │  │  ├─ ingredient-purchases.validation.ts
│  │  │  │  │  └─ ingredient-purchases.types.ts
│  │  │  │  ├─ production-batches/
│  │  │  │  │  ├─ production-batches.routes.ts
│  │  │  │  │  ├─ production-batches.controller.ts
│  │  │  │  │  ├─ production-batches.service.ts
│  │  │  │  │  ├─ production-batches.repository.ts
│  │  │  │  │  ├─ production-batches.validation.ts
│  │  │  │  │  └─ production-batches.types.ts
│  │  │  │  ├─ sales-invoices/
│  │  │  │  │  ├─ sales-invoices.routes.ts
│  │  │  │  │  ├─ sales-invoices.controller.ts
│  │  │  │  │  ├─ sales-invoices.service.ts
│  │  │  │  │  ├─ sales-invoices.repository.ts
│  │  │  │  │  ├─ sales-invoices.validation.ts
│  │  │  │  │  └─ sales-invoices.types.ts
│  │  │  │  └─ ingredient-adjustments/
│  │  │  │     ├─ ingredient-adjustments.routes.ts
│  │  │  │     ├─ ingredient-adjustments.controller.ts
│  │  │  │     ├─ ingredient-adjustments.service.ts
│  │  │  │     ├─ ingredient-adjustments.repository.ts
│  │  │  │     ├─ ingredient-adjustments.validation.ts
│  │  │  │     └─ ingredient-adjustments.types.ts
│  │  │  ├─ middlewares/
│  │  │  │  ├─ error.middleware.ts
│  │  │  │  ├─ not-found.middleware.ts
│  │  │  │  └─ validate.middleware.ts
│  │  │  ├─ routes/
│  │  │  │  └─ index.ts
│  │  │  ├─ services/
│  │  │  │  ├─ logger.service.ts
│  │  │  │  ├─ invoice-code.service.ts
│  │  │  │  └─ stock-costing.service.ts
│  │  │  ├─ repositories/
│  │  │  │  └─ base.repository.ts
│  │  │  ├─ types/
│  │  │  │  ├─ api-response.ts
│  │  │  │  └─ express.d.ts
│  │  │  └─ utils/
│  │  │     ├─ async-handler.ts
│  │  │     ├─ http-error.ts
│  │  │     ├─ pagination.ts
│  │  │     ├─ quantity-normalization.ts
│  │  │     └─ stock-ledger.ts
│  │  ├─ drizzle/
│  │  │  └─ migrations/
│  │  ├─ drizzle.config.ts
│  │  ├─ package.json
│  │  └─ tsconfig.json
├─ packages/
│  ├─ shared/
│  │  ├─ src/
│  │  │  ├─ suppliers/
│  │  │  │  ├─ supplier.types.ts
│  │  │  │  └─ supplier.schema.ts
│  │  │  ├─ buyers/
│  │  │  │  ├─ buyer.types.ts
│  │  │  │  └─ buyer.schema.ts
│  │  │  ├─ ingredients/
│  │  │  │  ├─ ingredient.types.ts
│  │  │  │  └─ ingredient.schema.ts
│  │  │  ├─ products/
│  │  │  │  ├─ product.types.ts
│  │  │  │  └─ product.schema.ts
│  │  │  ├─ expenses/
│  │  │  │  ├─ expense.types.ts
│  │  │  │  └─ expense.schema.ts
│  │  │  ├─ ingredient-purchases/
│  │  │  │  ├─ ingredient-purchase.types.ts
│  │  │  │  └─ ingredient-purchase.schema.ts
│  │  │  ├─ production-batches/
│  │  │  │  ├─ production-batch.types.ts
│  │  │  │  └─ production-batch.schema.ts
│  │  │  ├─ sales-invoices/
│  │  │  │  ├─ sales-invoice.types.ts
│  │  │  │  └─ sales-invoice.schema.ts
│  │  │  ├─ ingredient-adjustments/
│  │  │  │  ├─ ingredient-adjustment.types.ts
│  │  │  │  └─ ingredient-adjustment.schema.ts
│  │  │  └─ index.ts
│  │  ├─ package.json
│  │  └─ tsconfig.json
├─ docs/
│  ├─ erp-specs.md
│  └─ folder-structure.md
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
└─ tsconfig.base.json
```

## Monorepo Tooling

Use `pnpm` as the package manager and workspace manager.

Use Turborepo for task orchestration across the monorepo:

```txt
pnpm dev
pnpm build
pnpm lint
pnpm test
```

The root workspace should include:

- `pnpm-workspace.yaml`: declares workspace packages.
- `turbo.json`: defines shared pipelines such as `dev`, `build`, `lint`, and `test`.
- `package.json`: root scripts that call `turbo`.
- `tsconfig.base.json`: shared TypeScript compiler settings.

## Frontend Stack

The `apps/web` application should use:

- Next.js
- TypeScript
- Tailwind CSS
- `shadcn/ui`

`shadcn/ui` components should be the default base for forms, dialogs, tables, buttons, inputs, labels, and other UI building blocks in suppliers, buyers, inventory, purchases, production, and sales flows.

## Backend Organization

Use a module-first backend structure. Feature-specific code should live inside its own module, and top-level backend folders should only contain global or reusable code:

- `middlewares/`: Express middleware reused across modules.
- `routes/`: Global route registration, usually `routes/index.ts`.
- `services/`: Cross-feature services only, such as logging, invoice-code generation, or costing helpers.
- `repositories/`: Shared/base repository helpers only.
- `types/`: Backend-only TypeScript types and Express type extensions.
- `utils/`: Small reusable backend utilities.
- `db/`: Drizzle client, schema definitions, and migrations.

## Drizzle ORM Files

Use these responsibilities:

- `drizzle.config.ts`: Drizzle Kit configuration.
- `drizzle/migrations/`: generated SQL migrations.
- `src/db/client.ts`: MySQL connection and Drizzle database instance.
- `src/db/index.ts`: backend database exports.
- `src/db/schema/*.ts`: backend-owned table schemas for master data, invoices, batches, and adjustments.
- `src/db/schema/index.ts`: aggregates and re-exports schema files.

## Feature Scope Summary

This structure supports these documented areas:

- supplier CRUD
- buyer CRUD
- ingredient catalog and stock
- finished-product catalog and stock
- purchase expenses
- ingredient purchase invoices
- production batches
- sales invoices
- ingredient adjustments

Additional v1 behavior expectations tied to this structure:

- sales invoices allow one line per finished product only
- production batches allow one line per ingredient only
- typed buyer and supplier names stay invoice-only
- no recipe master is part of the current scope yet
- stock movement history is surfaced from inventory views
- ingredients and finished products are manually archivable only at zero stock
- archived inventory items are hidden from all new transaction forms until manually reactivated
- ingredient and finished-product names stay unique and reserved even after archive
- buyer and supplier names may repeat, but linked buyer/supplier records become non-editable and non-deletable

## Transaction Rules To Preserve In Implementation

- sales invoices are create/list/view only
- expenses are create/list/view only
- ingredient purchase invoices are create/list/view only
- production batches are create/list/view only
- ingredient adjustments are create/list/view only
- ingredient and finished-product stock must never go negative
- weighted-average costing is used for ingredients and finished products
- ingredient quantities are normalized to base units
- ingredient unit families include weight, volume, and count
- stock movements should remain traceable through transaction history
- backdated expenses are allowed
- backdated sales and ingredient adjustments are not allowed
- backdated purchases and production are allowed only if recalculation keeps later history valid
- same-datetime stock records use creation order as the tie-breaker
- ingredient/product deletion is allowed only when stock is zero and no history exists

## Shared Package

Put reusable supplier, buyer, inventory, invoice, batch, and adjustment types and validation schemas in `packages/shared` so both the Next.js frontend and Express backend can use the same contracts.

The backend should still own the Drizzle database schema because database details should not leak into frontend code.
