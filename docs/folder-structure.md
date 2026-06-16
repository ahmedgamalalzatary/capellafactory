# Folder Structure

This repository is a `pnpm` workspace monorepo managed with Turborepo.

The current codebase ships three workspace packages:

- `apps/web`: Next.js 15 frontend
- `apps/api`: Express 5 + Drizzle backend
- `packages/shared`: shared Zod schemas and TypeScript contracts

The repo also includes Docker assets at the root, but this document focuses on source layout. For container details, use `docs/docker.md`.

## High-Level Tree

```txt
factory/
├─ apps/
│  ├─ api/
│  │  ├─ drizzle/
│  │  │  └─ migrations/
│  │  ├─ src/
│  │  │  ├─ db/
│  │  │  │  ├─ client.ts
│  │  │  │  ├─ index.ts
│  │  │  │  └─ schema/
│  │  │  ├─ middlewares/
│  │  │  ├─ modules/
│  │  │  │  ├─ auth/
│  │  │  │  ├─ buyers/
│  │  │  │  ├─ expenses/
│  │  │  │  ├─ ingredient-purchases/
│  │  │  │  ├─ ingredients/
│  │  │  │  ├─ production-batches/
│  │  │  │  ├─ products/
│  │  │  │  ├─ purchase-corrections/
│  │  │  │  ├─ sales-invoices/
│  │  │  │  └─ suppliers/
│  │  │  ├─ repositories/
│  │  │  ├─ routes/
│  │  │  ├─ services/
│  │  │  ├─ types/
│  │  │  └─ utils/
│  │  └─ tests/
│  └─ web/
│     ├─ src/
│     │  ├─ app/
│     │  │  ├─ (app)/
│     │  │  ├─ (auth)/
│     │  │  ├─ constants/
│     │  │  ├─ types/
│     │  │  ├─ utils/
│     │  │  ├─ globals.css
│     │  │  ├─ layout.tsx
│     │  │  └─ page.tsx
│     │  ├─ components/
│     │  │  ├─ auth/
│     │  │  ├─ buyers/
│     │  │  ├─ inventory/
│     │  │  ├─ production/
│     │  │  ├─ purchases/
│     │  │  ├─ sales/
│     │  │  ├─ shared/
│     │  │  ├─ shell/
│     │  │  ├─ suppliers/
│     │  │  └─ ui/
│     │  ├─ lib/
│     │  │  ├─ api/
│     │  │  ├─ inventory.ts
│     │  │  ├─ server-cookies.ts
│     │  │  ├─ submit-lock.ts
│     │  │  └─ utils.ts
│     │  └─ middleware.ts
│     └─ tests/
├─ packages/
│  └─ shared/
│     ├─ src/
│     │  ├─ buyers/
│     │  ├─ expenses/
│     │  ├─ ingredient-purchases/
│     │  ├─ ingredients/
│     │  ├─ production-batches/
│     │  ├─ products/
│     │  ├─ purchase-corrections/
│     │  ├─ sales-invoices/
│     │  ├─ suppliers/
│     │  └─ index.ts
│     └─ dist/
└─ docs/
   ├─ erp-specs.md
   ├─ folder-structure.md
   ├─ docker.md
   └─ phases/
```

## Root Tooling

The root workspace scripts are:

```txt
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm typecheck
```

Key root files:

- `package.json`: workspace scripts via `turbo run ...`
- `pnpm-workspace.yaml`: workspace package registration
- `turbo.json`: Turborepo task pipeline
- `tsconfig.base.json`: shared TypeScript settings
- `pnpm-lock.yaml`: lockfile

## Backend Layout

`apps/api` is organized around domain modules plus a small set of global folders.

Current route registration is done in `apps/api/src/routes/index.ts`. The backend exposes:

- `/health`
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

The route tree is protected by `requireAuth` after `/auth`, so all business endpoints currently require a valid session cookie.

### `apps/api/src/modules`

Each business module keeps its own route/controller/service/repository/validation/types files:

- `buyers`
- `expenses`
- `ingredient-purchases`
- `ingredients`
- `production-batches`
- `products`
- `purchase-corrections`
- `sales-invoices`
- `suppliers`

There is also an `auth` module for login, session lookup, and logout.

### Shared backend folders

- `db/`: Drizzle client and table schema
- `middlewares/`: cross-cutting Express middleware
- `repositories/`: reusable repository helpers
- `routes/`: top-level route registration
- `services/`: cross-module domain services such as invoice code generation and stock costing
- `types/`: backend-only TypeScript declarations
- `utils/`: reusable stock and quantity helpers

### Database and migrations

The API owns the database model:

- `apps/api/drizzle.config.ts`
- `apps/api/drizzle/migrations/`
- `apps/api/src/db/schema/`

The current migrations run through `0012_sales_invoices.sql`, which confirms that production batches and sales invoices are already represented in the live schema history.

## Frontend Layout

`apps/web` is a Next.js App Router application using:

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- `shadcn/ui`-style primitives under `src/components/ui`
- Vitest for tests

### `apps/web/src/app`

The app is split into authenticated and auth-only route groups:

- `(auth)/login`: login screen
- `(app)/suppliers`
- `(app)/buyers`
- `(app)/inventory`
- `(app)/products`
- `(app)/purchases`
- `(app)/sales`
- `(app)/reports`

There are also detail routes for implemented transactional screens:

- `products/production-batches/[id]`
- `purchases/expenses/[id]`
- `purchases/ingredient-purchases/[id]`
- `purchases/purchase-corrections/[id]`
- `sales/[id]`

`src/middleware.ts` enforces frontend session checks using the `capella_session` cookie and the API's `/auth/me` endpoint.

### `apps/web/src/components`

The UI is grouped by feature area:

- `auth`
- `buyers`
- `inventory`
- `production`
- `purchases`
- `sales`
- `shared`
- `shell`
- `suppliers`
- `ui`

## Shared Package

`packages/shared` contains frontend/backend contracts only. It currently exports domains for:

- suppliers
- buyers
- ingredients
- products
- expenses
- ingredient purchases
- production batches
- purchase corrections
- sales invoices

Each domain keeps its types and Zod schema beside each other. The compiled output lives in `packages/shared/dist`.

## Tests and Build Artifacts

Source-controlled tests live in:

- `apps/api/tests`
- `apps/web/tests`

Build and local-only folders that exist in this checkout but are not part of the authored source layout include:

- `node_modules/`
- `.next/`
- `.turbo/`
- `coverage/`
- `dist/`

Those folders reflect local builds and test runs, not hand-maintained application structure.
