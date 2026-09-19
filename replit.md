# NEXORA Store

NEXORA is a curated dropshipping storefront for useful, design-forward products, with a persistent cart, checkout, order tracking, Clerk accounts, and an admin summary view.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed:nexora` — seed a starter catalog
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/nexora-store` — React/Vite storefront, routes, theme, and Clerk UI
- `artifacts/api-server` — Express API routes and supplier/cart/checkout logic
- `lib/api-spec/openapi.yaml` — source of truth for generated API clients and Zod schemas
- `lib/db/src/schema/store.ts` — PostgreSQL/Drizzle catalog, carts, orders, and order items
- `scripts/src/seed-nexora.ts` — idempotent starter seed

## Architecture decisions

- Product data comes from PostgreSQL; the storefront never relies on hardcoded product arrays.
- Checkout uses a mock payment mode by design until a payment provider is connected; raw card data is never accepted or stored.
- Cart persistence uses a secure, httpOnly session cookie so anonymous shoppers keep their bag after refresh.
- `supplierId`, `supplierProductId`, and `supplierCost` live on products so a supplier adapter can be added without changing storefront contracts.
- Clerk owns authentication and browser session cookies; server middleware remains the authorization boundary.

## Product

Visitors can browse and filter the catalog, view product details, add items to a persistent bag, apply `NEXORA10`, complete a mock-payment checkout, and track an order. Signed-in users have an account entry point, and authenticated users can access the admin summary route.

## User preferences

- Keep NEXORA editorial, functional, and responsive rather than marketplace-generic.

## Gotchas

- Run API codegen after changing `lib/api-spec/openapi.yaml`.
- The API server expects `DATABASE_URL`; the managed Clerk development-key warning in the browser is expected.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
