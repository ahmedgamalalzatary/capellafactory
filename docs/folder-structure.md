# Folder Structure

This project is a `pnpm` workspace monorepo with Turborepo for running builds, development scripts, linting, and tests across apps and packages.

The monorepo has separate apps for the frontend and backend, plus a shared package for reusable types and validation schemas.

The `web` app uses `shadcn/ui` as the component library on top of Next.js, Tailwind CSS, and TypeScript. Tests on the web app are run with Vitest.

The `api` app is an Express + Drizzle (MySQL) backend. Tests on the API are run with Vitest.

The whole monorepo is containerised with Docker (`Dockerfile.api`, `Dockerfile.web`, `docker-compose.yml`).

```txt
capella/
├─ apps/
│  ├─ web/
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  │  ├─ layout.tsx
│  │  │  │  ├─ page.tsx
│  │  │  │  ├─ globals.css
│  │  │  │  ├─ suppliers/
│  │  │  │  │  ├─ page.tsx
│  │  │  │  │  ├─ loading.tsx
│  │  │  │  │  └─ error.tsx
│  │  │  │  ├─ buyers/
│  │  │  │  │  ├─ page.tsx
│  │  │  │  │  ├─ loading.tsx
│  │  │  │  │  └─ error.tsx
│  │  │  │  ├─ inventory/
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ purchases/
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ sales/
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ accounting/
│  │  │  │  │  └─ page.tsx
│  │  │  │  └─ reports/
│  │  │  │     └─ page.tsx
│  │  │  ├─ components/
│  │  │  │  ├─ suppliers/
│  │  │  │  │  ├─ suppliers-table.tsx
│  │  │  │  │  ├─ suppliers-search-input.tsx
│  │  │  │  │  ├─ supplier-form.tsx
│  │  │  │  │  ├─ supplier-dialog.tsx
│  │  │  │  │  └─ delete-supplier-dialog.tsx
│  │  │  │  ├─ buyers/
│  │  │  │  │  ├─ buyers-table.tsx
│  │  │  │  │  ├─ buyers-search-input.tsx
│  │  │  │  │  ├─ buyer-form.tsx
│  │  │  │  │  └─ buyer-dialog.tsx
│  │  │  │  ├─ inventory/
│  │  │  │  │  ├─ ingredients-table.tsx
│  │  │  │  │  ├─ inventory-search-input.tsx
│  │  │  │  │  ├─ ingredient-form.tsx
│  │  │  │  │  ├─ ingredient-dialog.tsx
│  │  │  │  │  ├─ products-table.tsx
│  │  │  │  │  ├─ product-form.tsx
│  │  │  │  │  └─ product-dialog.tsx
│  │  │  │  ├─ purchases/
│  │  │  │  │  ├─ expenses-table.tsx
│  │  │  │  │  ├─ expense-form.tsx
│  │  │  │  │  ├─ expense-dialog.tsx
│  │  │  │  │  ├─ ingredient-purchases-table.tsx
│  │  │  │  │  ├─ ingredient-purchase-form.tsx
│  │  │  │  │  ├─ ingredient-purchase-dialog.tsx
│  │  │  │  │  ├─ datetime-fields.tsx
│  │  │  │  │  └─ purchases-search-input.tsx
│  │  │  │  ├─ shell/
│  │  │  │  │  ├─ main-layout.tsx
│  │  │  │  │  ├─ mobile-top-bar.tsx
│  │  │  │  │  ├─ sidebar-nav.ts
│  │  │  │  │  └─ sidebar-view.tsx
│  │  │  │  └─ ui/
│  │  │  │     ├─ button.tsx
│  │  │  │     ├─ card.tsx
│  │  │  │     ├─ dialog.tsx
│  │  │  │     ├─ dropdown-menu.tsx
│  │  │  │     ├─ form.tsx
│  │  │  │     ├─ input.tsx
│  │  │  │     ├─ label.tsx
│  │  │  │     ├─ sheet.tsx
│  │  │  │     ├─ sonner.tsx
│  │  │  │     ├─ table.tsx
│  │  │  │     ├─ textarea.tsx
│  │  │  │     └─ toaster.tsx
│  │  │  └─ lib/
│  │  │     ├─ api.ts
│  │  │     ├─ inventory.ts
│  │  │     ├─ utils.ts
│  │  │     └─ api/
│  │  │        ├─ suppliers.ts
│  │  │        ├─ buyers.ts
│  │  │        ├─ ingredients.ts
│  │  │        ├─ products.ts
│  │  │        ├─ expenses.ts
│  │  │        └─ ingredient-purchases.ts
│  │  ├─ tests/
│  │  │  ├─ app-shell.test.ts
│  │  │  ├─ suppliers.test.ts
│  │  │  ├─ buyers.test.ts
│  │  │  ├─ inventory.test.ts
│  │  │  ├─ ingredients.test.ts
│  │  │  ├─ products.test.ts
│  │  │  ├─ expenses.test.ts
│  │  │  └─ ingredient-purchases.test.ts
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  ├─ next.config.ts
│  │  ├─ next-env.d.ts
│  │  ├─ postcss.config.js
│  │  ├─ components.json
│  │  ├─ tailwind.config.ts
│  │  └─ vitest.config.ts
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
│  │  │  │  └─ ingredient-purchases/
│  │  │  │     ├─ ingredient-purchases.routes.ts
│  │  │  │     ├─ ingredient-purchases.controller.ts
│  │  │  │     ├─ ingredient-purchases.service.ts
│  │  │  │     ├─ ingredient-purchases.repository.ts
│  │  │  │     ├─ ingredient-purchases.validation.ts
│  │  │  │     └─ ingredient-purchases.types.ts
│  │  │  ├─ middlewares/
│  │  │  │  ├─ cors.middleware.ts
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
│  │  │     └─ quantity-normalization.ts
│  │  ├─ tests/
│  │  │  ├─ app.test.ts
│  │  │  ├─ suppliers.repository.test.ts
│  │  │  ├─ suppliers.validation.test.ts
│  │  │  ├─ buyers.controller.test.ts
│  │  │  ├─ buyers.repository.test.ts
│  │  │  ├─ buyers.validation.test.ts
│  │  │  ├─ ingredients.repository.test.ts
│  │  │  ├─ ingredients.validation.test.ts
│  │  │  ├─ products.repository.test.ts
│  │  │  ├─ products.validation.test.ts
│  │  │  ├─ expenses.repository.test.ts
│  │  │  ├─ expenses.validation.test.ts
│  │  │  ├─ ingredient-purchases.repository.test.ts
│  │  │  ├─ ingredient-purchases.validation.test.ts
│  │  │  ├─ invoice-code.service.test.ts
│  │  │  └─ quantity-normalization.test.ts
│  │  ├─ drizzle/
│  │  │  └─ migrations/
│  │  │     ├─ 0000_overjoyed_metal_master.sql
│  │  │     ├─ 0001_melted_excalibur.sql
│  │  │     ├─ 0002_organic_thunderbolts.sql
│  │  │     ├─ 0003_low_speedball.sql
│  │  │     ├─ 0004_great_manta.sql
│  │  │     ├─ 0005_aromatic_grey_gargoyle.sql
│  │  │     ├─ 0006_wide_hercules.sql
│  │  │     ├─ 0007_sudden_stature.sql
│  │  │     └─ meta/
│  │  │        ├─ _journal.json
│  │  │        └─ 0000_snapshot.json ... 0006_snapshot.json
│  │  ├─ drizzle.config.ts
│  │  ├─ package.json
│  │  └─ tsconfig.json
├─ packages/
│  ├─ shared/
│  │  ├─ src/
│  │  │  ├─ index.ts
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
│  │  │  │  ├─ expense.schema.ts
│  │  │  │  └─ expense.constants.ts
│  │  │  └─ ingredient-purchases/
│  │  │     ├─ ingredient-purchase.types.ts
│  │  │     └─ ingredient-purchase.schema.ts
│  │  ├─ package.json
│  │  └─ tsconfig.json
├─ docs/
│  ├─ erp-specs.md
│  ├─ folder-structure.md
│  ├─ docker.md
│  └─ phases/
│     ├─ README.md
│     ├─ 01-inventory-foundation.md
│     ├─ 02-expenses.md
│     ├─ 03-ingredient-purchases.md
│     ├─ 04-production-batches.md
│     ├─ 05-sales-invoices.md
│     └─ 06-ingredient-adjustments.md
├─ .dockerignore
├─ .env
├─ .env.docker
├─ .env.example
├─ .gitignore
├─ docker-compose.yml
├─ Dockerfile.api
├─ Dockerfile.web
├─ package.json
├─ pnpm-lock.yaml
├─ pnpm-workspace.yaml
├─ turbo.json
└─ tsconfig.base.json
```

Notes on what is intentionally not shown in the tree:

- `node_modules/`, `dist/`, `.next/`, `.turbo/`, `.history/`, and `.agents/` are present locally and in containers but are build/cache artefacts and are not part of the source tree.
- `apps/api/dist/...` and `packages/shared/dist/...` are TypeScript build outputs.
- `apps/web/tsconfig.tsbuildinfo` is a TypeScript incremental build cache file.

## Monorepo Tooling

`pnpm` is the package manager and workspace manager. Turborepo orchestrates tasks across the monorepo:

```txt
pnpm dev
pnpm build
pnpm lint
pnpm test
```

The root workspace includes:

- `pnpm-workspace.yaml`: declares workspace packages.
- `turbo.json`: defines shared pipelines such as `dev`, `build`, `lint`, and `test`.
- `package.json`: root scripts that call `turbo`.
- `tsconfig.base.json`: shared TypeScript compiler settings.
- `pnpm-lock.yaml`: the generated lockfile.

## Frontend Stack

The `apps/web` application uses:

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- `shadcn/ui`
- Vitest for component and page tests

`shadcn/ui` components are the default base for forms, dialogs, tables, buttons, inputs, labels, and other UI building blocks in suppliers, buyers, inventory, purchases, sales, accounting, and reports flows.

Top-level app routes currently shipping:

- `suppliers`
- `buyers`
- `inventory`
- `purchases`
- `sales`
- `accounting`
- `reports`

A `shell/` components folder holds the application chrome (`main-layout`, `mobile-top-bar`, `sidebar-nav`, `sidebar-view`).

## Backend Organization

The API uses a module-first backend structure. Feature-specific code lives inside its own module, and top-level backend folders only contain global or reusable code:

- `middlewares/`: Express middleware reused across modules (CORS, error, not-found, validate).
- `routes/`: Global route registration, `routes/index.ts`.
- `services/`: Cross-feature services only, such as logging, invoice-code generation, and FIFO stock costing.
- `repositories/`: Shared/base repository helpers only.
- `types/`: Backend-only TypeScript types and Express type extensions.
- `utils/`: Small reusable backend utilities (async handler, HTTP error, pagination, quantity normalization).
- `db/`: Drizzle client, schema definitions, and migrations.

Each feature module (`suppliers`, `buyers`, `ingredients`, `products`, `expenses`, `ingredient-purchases`) contains its own `routes`, `controller`, `service`, `repository`, `validation`, and `types` files.

## Drizzle ORM Files

Responsibilities:

- `drizzle.config.ts`: Drizzle Kit configuration.
- `drizzle/migrations/`: generated SQL migrations and the `meta/` folder with snapshots and journal.
- `src/db/client.ts`: MySQL connection and Drizzle database instance.
- `src/db/index.ts`: backend database exports.
- `src/db/schema/*.ts`: backend-owned table schemas for master data and transactions.
- `src/db/schema/index.ts`: aggregates and re-exports schema files.

## Tests

Both apps have co-located `tests/` folders run with Vitest:

- `apps/web/tests/`: page, shell, and form tests (one file per feature area plus `app-shell`).
- `apps/api/tests/`: validation, repository, service, and app boot tests (one file per module/unit under test).

## Docker Setup

The repository is configured to run both apps and a MySQL database in containers:

- `Dockerfile.api`: production-style image for the Express + Drizzle backend.
- `Dockerfile.web`: production-style image for the Next.js frontend.
- `docker-compose.yml`: orchestrates `api`, `web`, and the MySQL service.
- `.env.docker`, `.env.example`, `.env`: environment variable templates and local overrides.
- `.dockerignore`: excludes non-build paths from the image context.
- `docs/docker.md`: describes the Docker workflow.

## Feature Scope

Code currently shipping in this tree covers:

- supplier CRUD
- buyer CRUD
- ingredient catalog and stock
- finished-product catalog and stock
- purchase expenses
- ingredient purchase invoices

The following feature areas are designed and documented in `docs/phases/` but their backend modules, frontend routes, and Drizzle schemas are not yet present in this tree:

- production batches (`docs/phases/04-production-batches.md`)
- sales invoices (`docs/phases/05-sales-invoices.md`)
- ingredient adjustments (`docs/phases/06-ingredient-adjustments.md`)

When those land, the structure for each will mirror the existing modules (route, controller, service, repository, validation, types), and shared schemas/types will be added to `packages/shared/src/`.

## Shared Package

Reusable types and validation schemas live in `packages/shared` so both the Next.js frontend and Express backend use the same contracts. The backend still owns the Drizzle database schema because database details should not leak into frontend code.

Shared domains currently exported:

- `suppliers` (`supplier.types.ts`, `supplier.schema.ts`)
- `buyers` (`buyer.types.ts`, `buyer.schema.ts`)
- `ingredients` (`ingredient.types.ts`, `ingredient.schema.ts`)
- `products` (`product.types.ts`, `product.schema.ts`)
- `expenses` (`expense.types.ts`, `expense.schema.ts`, `expense.constants.ts`)
- `ingredient-purchases` (`ingredient-purchase.types.ts`, `ingredient-purchase.schema.ts`)

All of these are re-exported from `packages/shared/src/index.ts`.
