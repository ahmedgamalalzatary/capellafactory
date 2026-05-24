# Choices Made During Scaffolding

This file records implementation choices that were made while turning the documented folder structure into a working monorepo scaffold.

## Workspace and Tooling

- The monorepo root folder name in the visual tree was normalized to `capella/`, while the actual local repository folder remains `capellafactory/`.
- The workspace uses `pnpm` with `turbo` at the root.
- Environment configuration was centralized at the repository root in `.env`, with one root `.env.example`.
- A shared root `tsconfig.base.json` was added so `apps/web`, `apps/api`, and `packages/shared` can use consistent TypeScript settings.
- Root scripts were added for `dev`, `build`, `lint`, `test`, and `typecheck`.

## Frontend Choices

- `apps/web` was scaffolded with the Next.js App Router.
- The frontend source code was placed under `apps/web/src/` rather than mixing source files at app root.
- `shadcn/ui` is represented as local component files under `apps/web/src/components/ui/`.
- Minimal local UI primitives were created for `button`, `card`, `dialog`, `form`, `input`, `label`, `table`, and `textarea` so the structure is immediately runnable.
- A simple suppliers page was added at `/suppliers` and the root route redirects there.
- The suppliers page currently uses server rendering and fetches from the API through `src/api-client/suppliers.ts`.
- A fallback supplier dataset was added on the frontend so the page still renders if the API is not running yet.
- `API_URL` defaults to `http://localhost:4000`.
- The web app reads root `.env` values through `dotenv-cli` in package scripts rather than app-local `.env` files.
- Styling was kept intentionally simple but non-default, using Tailwind plus a small custom `globals.css`.

## Backend Choices

- The backend uses a hybrid structure:
  feature-first for business logic in `modules/suppliers`
  shared SOC-style folders for cross-cutting code such as `middlewares`, `routes`, `types`, and `utils`
- The Express app exposes `/health` and `/suppliers` routes.
- The API app reads root `.env` values through `dotenv-cli` in package scripts rather than app-local `.env` files.
- Suppliers CRUD handlers were scaffolded for `GET`, `GET by id`, `POST`, `PATCH`, and `DELETE`.
- Request body validation is handled with Zod-based middleware.
- No auth, session, JWT, role, or permission layer was added anywhere in the backend.

## Drizzle and Data Choices

- Drizzle ORM files were added only in `apps/api`.
- `drizzle.config.ts` writes generated migrations to `apps/api/drizzle/migrations/`.
- The Drizzle schema includes a `suppliers` table with `id`, `name`, `phone`, `where`, `notes`, `createdAt`, and `updatedAt`.
- The actual runtime repository currently uses an in-memory array instead of MySQL queries.

Reason:
This keeps the scaffold runnable and verifiable before real database CRUD is implemented, while still preserving the final file layout and Drizzle entry points.

## Shared Package Choices

- Shared supplier contracts live in `packages/shared`.
- Shared code currently includes `supplier.types.ts` and `supplier.schema.ts`.
- The shared package is configured as an internal workspace package and exported through package `exports`.

## Verification Choices

- The workspace was considered live only after `pnpm install`, `pnpm typecheck`, `pnpm build`, and `pnpm test` all succeeded.
- `test` scripts currently print placeholder messages because no real tests exist yet.
- `turbo.json` uses an empty outputs list for `test` to avoid false warnings about missing coverage output.
