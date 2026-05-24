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
│  │  │  ├─ components/
│  │  │  │  ├─ suppliers/
│  │  │  │  │  ├─ suppliers-table.tsx
│  │  │  │  │  ├─ supplier-form.tsx
│  │  │  │  │  ├─ supplier-dialog.tsx
│  │  │  │  │  └─ delete-supplier-dialog.tsx
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
│  │  │  │  └─ api.ts
│  │  │  └─ api-client/
│  │  │     └─ suppliers.ts
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
│  │  │  │     └─ index.ts
│  │  │  ├─ modules/
│  │  │  │  └─ suppliers/
│  │  │  │     ├─ suppliers.routes.ts
│  │  │  │     ├─ suppliers.controller.ts
│  │  │  │     ├─ suppliers.service.ts
│  │  │  │     ├─ suppliers.repository.ts
│  │  │  │     ├─ suppliers.validation.ts
│  │  │  │     └─ suppliers.types.ts
│  │  │  ├─ middlewares/
│  │  │  │  ├─ error.middleware.ts
│  │  │  │  ├─ not-found.middleware.ts
│  │  │  │  └─ validate.middleware.ts
│  │  │  ├─ routes/
│  │  │  │  └─ index.ts
│  │  │  ├─ services/
│  │  │  │  └─ logger.service.ts
│  │  │  ├─ repositories/
│  │  │  │  └─ base.repository.ts
│  │  │  ├─ types/
│  │  │  │  ├─ api-response.ts
│  │  │  │  └─ express.d.ts
│  │  │  └─ utils/
│  │  │     ├─ async-handler.ts
│  │  │     ├─ http-error.ts
│  │  │     └─ pagination.ts
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
│  │  │  └─ index.ts
│  │  ├─ package.json
│  │  └─ tsconfig.json
├─ docs/
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

`shadcn/ui` components should be the default base for forms, dialogs, tables, buttons, inputs, labels, and other UI building blocks in the suppliers feature.

## Backend Organization

Use a module-first backend structure. Feature-specific code should live inside its own module, and top-level backend folders should only contain global or reusable code:

- `middlewares/`: Express middleware reused across modules.
- `routes/`: Global route registration, usually `routes/index.ts`.
- `services/`: Cross-feature services only, such as logging or external integrations.
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
- `src/db/schema/suppliers.ts`: suppliers table schema.
- `src/db/schema/index.ts`: aggregates and re-exports schema files.

## Suppliers Feature Scope

The initial suppliers CRUD feature should support this data model:

```txt
supplier
  id: number
  name: string
  phone: string
  where?: string
  notes: string
  createdAt: Date
  updatedAt: Date
```

Required fields:

- `name`
- `phone`
- `notes`

Optional fields:

- `where`

Recommended API routes:

```txt
GET    /suppliers
GET    /suppliers/:id
POST   /suppliers
PATCH  /suppliers/:id
DELETE /suppliers/:id
```

## Authentication Scope

This phase of the ERP should not include any authentication or authorization in either the frontend or backend.

Do not add:

- login or logout flows
- JWT or session handling
- auth middleware
- protected route wrappers
- user, role, or permission modules

The frontend should call the suppliers API directly.

The backend should expose suppliers routes without auth guards for now.

## Shared Package

Put reusable supplier types and validation schemas in `packages/shared` so both the Next.js frontend and Express backend can use the same contracts.

The backend should still own the Drizzle database schema because database details should not leak into frontend code.
