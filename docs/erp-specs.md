# ERP Specs

This document captures the ERP specifications established in this conversation so far.

## Current Scope

The ERP system is larger than the current work, but implementation is being done feature by feature.

The current feature scope is limited to the suppliers area only.

For now, only the suppliers feature should be built, and only for CRUD operations.

## Technology Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- `shadcn/ui`

### Backend

- Node.js
- Express.js
- TypeScript

### Database

- MySQL 8

### ORM

- Drizzle ORM

### Repository Layout

- Monorepo
- Shared packages
- `pnpm` as package manager
- Turborepo for workspace task orchestration

## Suppliers Feature

The first implemented ERP feature is the suppliers tab / suppliers table.

The suppliers feature must support CRUD operations:

- Create supplier
- Read suppliers
- Update supplier
- Delete supplier

## Supplier Fields

Each supplier record should contain:

- `name`: required
- `phone`: required
- `where`: optional
- `notes`: required

Recommended persisted fields also include:

- `id`
- `createdAt`
- `updatedAt`

## Backend Structure Decision

The backend should use a hybrid structure:

- feature-first for feature/domain code
- shared SOC-style folders for global reusable code

Feature-specific suppliers code should live under:

```txt
apps/api/src/modules/suppliers/
```

Global backend folders should include:

- `middlewares/`
- `routes/`
- `services/`
- `repositories/`
- `types/`
- `utils/`
- `db/`

## Frontend Structure Decision

The web app should live under:

```txt
apps/web/
```

Frontend source code should live under:

```txt
apps/web/src/
```

The suppliers UI should include:

- suppliers page
- suppliers table
- supplier form
- create/edit supplier dialog
- delete supplier dialog

`shadcn/ui` components should be used as the base UI library for:

- buttons
- inputs
- labels
- textareas
- dialogs
- forms
- tables
- cards

## Drizzle Structure

Drizzle ORM should live only in the backend app.

Recommended structure:

```txt
apps/api/
  drizzle.config.ts
  drizzle/
    migrations/
  src/
    db/
      client.ts
      index.ts
      schema/
        suppliers.ts
        index.ts
```

The backend owns database schema definitions.

Database-specific code should not leak into frontend code or shared frontend/backend contracts.

## Shared Package

Reusable supplier contracts should live in:

```txt
packages/shared/
```

This shared package should contain:

- supplier types
- supplier validation schema

These contracts should be reused by both frontend and backend.

## API Shape

Recommended suppliers routes:

```txt
GET    /suppliers
GET    /suppliers/:id
POST   /suppliers
PATCH  /suppliers/:id
DELETE /suppliers/:id
```

## Authentication Scope

There should be no authentication or authorization for this phase.

Do not add:

- login flow
- logout flow
- JWT
- sessions
- auth middleware
- protected frontend routes
- users module
- roles module
- permissions module

The frontend should call the suppliers API directly.

The backend should expose the suppliers routes without auth guards.

## Current Delivery Goal

The documented folder structure should be brought to life as a working scaffold, so the repository reflects the chosen structure and can run workspace commands successfully.
