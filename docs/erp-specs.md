# ERP Specs

This document captures the ERP specifications established in this conversation so far.

## Current Scope

The ERP system is larger than the current work, but implementation is being done feature by feature.

The current feature scope is limited to the suppliers and buyers areas.

For now, only the suppliers and buyers features should be built, and only for CRUD operations.

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

## Suppliers And Buyers Features

The first implemented ERP features are the suppliers tab / suppliers table and the buyers tab / buyers table.

Each feature must support CRUD operations:

- Create supplier
- Read suppliers
- Update supplier
- Delete supplier
- Create buyer
- Read buyers
- Update buyer
- Delete buyer

## Shared Record Fields

Each supplier and buyer record should contain:

- `name`: required
- `phone`: required
- `where`: optional
- `notes`: optional

Recommended persisted fields also include:

- `id`
- `createdAt`
- `updatedAt`

## Backend Structure Decision

The backend should use a hybrid structure:

- feature-first for feature/domain code
- shared SOC-style folders for global reusable code

Feature-specific suppliers and buyers code should live under:

```txt
apps/api/src/modules/suppliers/
apps/api/src/modules/buyers/
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

Each CRUD UI should include:

- suppliers page
- suppliers table
- supplier form
- create/edit supplier dialog
- delete supplier dialog
- buyers page
- buyers table
- buyer form
- create/edit buyer dialog
- delete buyer dialog

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
        buyers.ts
        index.ts
```

The backend owns database schema definitions.

Database-specific code should not leak into frontend code or shared frontend/backend contracts.

## Shared Package

Reusable supplier and buyer contracts should live in:

```txt
packages/shared/
```

This shared package should contain:

- supplier types
- supplier validation schema
- buyer types
- buyer validation schema

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

Recommended buyers routes:

```txt
GET    /buyers
GET    /buyers/:id
POST   /buyers
PATCH  /buyers/:id
DELETE /buyers/:id
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

The frontend should call the suppliers and buyers APIs directly.

The backend should expose the suppliers and buyers routes without auth guards.

## Current Delivery Goal

The documented folder structure should be brought to life as working suppliers and buyers CRUD scaffolds, starting backend-first: schema and tables, then endpoints, then frontend components, then page wiring.
