# ERP Specs

This document captures the ERP specifications established in this conversation so far.

## Current Scope

The ERP system is larger than the current work, but implementation is being done feature by feature.

The current documented scope includes these areas:

- suppliers
- buyers
- sales invoices
- purchase expenses
- ingredient purchase invoices
- ingredient stock
- finished products
- production batches

Reports and recipe management are not part of the current delivery scope yet.

Returns and authentication are permanently out of scope for this ERP.

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

## Core Feature Areas

### Suppliers And Buyers

Suppliers and buyers remain master-data CRUD features.

Each supplier and buyer record should contain:

- `name`: required
- `phone`: required
- `where`: optional
- `notes`: optional
- `id`
- `createdAt`
- `updatedAt`

### Sales Invoices

Sales invoices sell finished products only.

Each sales invoice should:

- have an auto-generated internal invoice code
- store one real-world invoice datetime
- link to a saved buyer or store a typed buyer name
- contain one or more finished-product lines
- allow each finished product only once per invoice
- require user-entered selling unit price on each line
- reduce finished-product stock when created
- become immutable after creation

Sales invoices must not:

- sell ingredients directly
- support payment-status tracking
- support edit/delete in this phase
- support returns at all
- support backdated creation in this phase

Typed buyer names should stay invoice-only and must not auto-create buyer master records.

### Purchase Expenses

Purchase expenses are separate from ingredient purchases.

Each expense is a single record, not a multi-line invoice.

Supported expense types:

- `rent`
- `food`
- `water`
- `gas`
- `electricity`
- `internet`
- `salary`
- `other`

Rules:

- every expense stores one real-world datetime
- every expense is already paid when entered
- backdated expenses are allowed because they do not affect stock
- `salary` requires employee name and amount
- `salary` employee name is free text
- `other` requires a custom label
- expenses are immutable after creation
- exact duplicate expenses are allowed

### Ingredient Purchase Invoices

Ingredient purchases are invoice-based and use header + lines.

Each ingredient purchase invoice should:

- have an auto-generated internal invoice code
- store one real-world invoice datetime
- link to one saved supplier or store one typed supplier name
- contain one or more ingredient lines
- become immutable after creation

Each purchase line should:

- target one ingredient
- require quantity
- require unit price
- derive total price automatically
- store entered unit and normalized base quantity

Ingredient purchase invoices must:

- increase ingredient stock
- update ingredient weighted-average cost
- block duplicate ingredient lines in the same invoice
- allow backdated entry only if full recalculation keeps later history valid
- allow exact duplicate invoices if the user saves them intentionally

Typed supplier names should stay invoice-only and must not auto-create supplier master records.

### Ingredient Stock

Ingredient stock is transaction-driven.

Ingredient stock increases through:

- ingredient purchase invoices
- positive ingredient adjustments

Ingredient stock decreases through:

- production batches
- negative ingredient adjustments

Ingredient stock rules:

- stock is pooled by ingredient, not by supplier
- stock can never go negative
- stock history should be traceable through movement records
- supplier information stays on purchase history only
- stock movement history is shown in the inventory area

### Finished Products

Finished products are master data used by production and sales.

Each finished product should:

- exist in a separate product catalog
- have current stock quantity
- have current weighted-average cost
- be selectable in production batches and sales invoices

Finished product rules:

- finished-product stock increases through production batches only
- finished-product stock decreases through sales invoices only
- no manual finished-product adjustments in this phase
- finished-product names must be unique

### Production Batches

Production batches convert ingredient stock into finished-product stock.

Each production batch should:

- store one real-world production datetime
- consume multiple ingredient lines
- produce exactly one finished product type
- store produced quantity
- become immutable after creation

Production rules:

- the user enters consumed ingredient quantities
- the user enters produced output quantity
- no predefined recipe system is part of the current scope yet
- the system does not model waste separately in this phase
- a batch can only be created if enough ingredient stock exists
- batch cost = total consumed ingredient cost / produced quantity
- finished-product stock and cost are updated when the batch is created
- backdated production is allowed only if full recalculation keeps later history valid
- each ingredient can appear only once per batch

## Units And Quantities

Ingredients may be bought and consumed in:

- `kg`
- `g`
- `L`
- `ml`
- `piece`

The system should normalize ingredient quantities internally:

- weight ingredients are stored in `grams`
- volume ingredients are stored in `milliliters`
- count ingredients are stored in `pieces`

Rules:

- weighted-average cost must use normalized base quantity
- decimals are allowed
- UI formatting should round consistently for display
- no arbitrary unit-conversion system is needed beyond same-family normalization
- count-based ingredients do not need conversion beyond using `piece` as their base unit

## Costing Rules

The system should use weighted-average costing in this phase.

### Ingredient Costing

When the same ingredient is bought multiple times:

- stock is pooled by ingredient
- supplier does not split stock buckets
- new purchases update one moving weighted-average cost
- the average is always based on normalized base quantity

If the same real material is purchased from different suppliers, brands, or package sizes, it should still be the same ingredient record if it is operationally interchangeable.

### Production Costing

When a production batch is created:

- ingredient consumption uses the ingredient current weighted-average cost at batch time
- the consumed cost is snapshotted on the batch
- later reads should not manually override that batch cost

### Finished Product Costing

When the same finished product is produced in multiple batches with different costs:

- finished-product stock is pooled by product
- finished-product valuation uses weighted-average cost

### Sales Costing

Sales prices are manual user input.

Sales cost-of-stock should use finished-product weighted-average cost at sale time.

## Stock Adjustments

Only ingredient adjustments are supported in this phase.

Ingredient adjustment rules:

- must target an existing ingredient
- must require a reason
- may increase or decrease stock
- must use current ingredient weighted-average cost at adjustment time
- must be immutable after creation
- must not allow backdating
- must not allow stock to go negative

Suggested reasons include:

- wrong input before
- wrong calculation
- wasted or expired stock
- similar operational correction reasons

## Immutability And History Rules

These records are immutable after creation:

- sales invoices
- purchase expenses
- ingredient purchase invoices
- production batches
- ingredient adjustments

Master data rules:

- ingredients and finished products become locked after they have transaction history
- historical records must still display archived items
- archived items must be hidden from new-entry forms unless reactivated
- ingredients and finished products may be archived manually only when stock is `0`
- archived items may be reactivated manually
- archived ingredient and finished-product names remain reserved and must not be reused
- ingredient and finished-product records may be deleted only if they have `0` stock and no history

Party master data rules:

- buyers and suppliers remain normal CRUD until linked to an invoice
- once a buyer has at least one linked sales invoice, it cannot be edited or deleted
- once a supplier has at least one linked ingredient purchase invoice, it cannot be edited or deleted
- buyer names may repeat across master records
- supplier names may repeat across master records

## Backdating Rules

Backdated creation is allowed for:

- ingredient purchase invoices
- production batches

Backdated creation is not allowed for:

- sales invoices
- ingredient adjustments

Backdated save rule:

- if recalculation would make any later stock-affecting record invalid, block the new backdated save
- if two stock-affecting records share the same datetime, creation order is the tie-breaker

## Backend Structure Decision

The backend should use a hybrid structure:

- feature-first for feature/domain code
- shared SOC-style folders for global reusable code

Feature-specific backend code should live under:

```txt
apps/api/src/modules/
  suppliers/
  buyers/
  ingredients/
  products/
  expenses/
  ingredient-purchases/
  production-batches/
  sales-invoices/
  ingredient-adjustments/
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

The current navigation areas should support:

- suppliers
- buyers
- inventory
- purchases
- sales

Planned frontend behavior by area:

- `suppliers`: supplier CRUD
- `buyers`: buyer CRUD
- `inventory`: ingredient catalog, finished-product catalog, current stock views
- `purchases`: purchase expenses, ingredient purchase invoices, ingredient adjustments
- `sales`: sales invoices

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
        ingredients.ts
        products.ts
        expenses.ts
        ingredient-purchases.ts
        production-batches.ts
        sales-invoices.ts
        ingredient-adjustments.ts
        index.ts
```

The backend owns database schema definitions.

Database-specific code should not leak into frontend code or shared frontend/backend contracts.

## Shared Package

Reusable contracts should live in:

```txt
packages/shared/
```

This shared package should contain:

- supplier types and validation schema
- buyer types and validation schema
- ingredient types and validation schema
- finished-product types and validation schema
- expense types and validation schema
- ingredient purchase invoice types and validation schema
- production batch types and validation schema
- sales invoice types and validation schema
- ingredient adjustment types and validation schema

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

Recommended ingredients routes:

```txt
GET    /ingredients
GET    /ingredients/:id
POST   /ingredients
PATCH  /ingredients/:id
DELETE /ingredients/:id
```

Recommended finished-products routes:

```txt
GET    /products
GET    /products/:id
POST   /products
PATCH  /products/:id
DELETE /products/:id
```

Recommended expense routes:

```txt
GET    /expenses
GET    /expenses/:id
POST   /expenses
```

Recommended ingredient purchase routes:

```txt
GET    /ingredient-purchases
GET    /ingredient-purchases/:id
POST   /ingredient-purchases
```

Recommended production batch routes:

```txt
GET    /production-batches
GET    /production-batches/:id
POST   /production-batches
```

Recommended sales invoice routes:

```txt
GET    /sales-invoices
GET    /sales-invoices/:id
POST   /sales-invoices
```

Recommended ingredient adjustment routes:

```txt
GET    /ingredient-adjustments
GET    /ingredient-adjustments/:id
POST   /ingredient-adjustments
```

## Authentication Scope

There should be no authentication or authorization in this ERP.

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

The frontend should call the ERP APIs directly.

The backend should expose these routes without auth guards.

## Test And Validation Expectations

Important validation scenarios for this phase:

- salary expense requires employee name
- `other` expense requires custom label
- ingredient purchase invoice requires at least one line
- duplicate ingredient lines in one purchase invoice are blocked
- duplicate ingredient lines in one production batch are blocked
- duplicate finished-product lines in one sales invoice are blocked
- supplier selection is either saved supplier or typed name
- buyer selection is either saved buyer or typed name
- ingredient purchase total price is derived from quantity and unit price
- ingredient quantities normalize correctly across `kg/g` and `L/ml`
- production is blocked on insufficient ingredient stock
- sales are blocked on insufficient finished-product stock
- ingredient adjustments are blocked if they would make stock negative
- backdated purchase or production is blocked if recalculation breaks later history
- archived ingredients and products are hidden from new forms
- ingredients and products with history cannot be deleted
- suppliers and buyers with linked invoices cannot be edited or deleted

## Current Delivery Goal

The documented folder structure should be brought to life as working scaffolds in this order:

1. master data for ingredients and finished products
2. ingredient stock model and weighted-average costing
3. purchase expenses
4. ingredient purchase invoices
5. production batches
6. sales invoices
7. ingredient adjustments
8. frontend pages and dialogs wiring
