# NEXORA Store

NEXORA is a full-stack dropshipping storefront for curated, useful products. It includes a PostgreSQL-backed catalog, anonymous persistent carts, Clerk authentication, mock-payment checkout, order tracking, and an authenticated admin summary.

## Run locally

```bash
pnpm install
pnpm --filter @workspace/db run push
pnpm --filter @workspace/scripts run seed:nexora
```

The configured workflows run the API and storefront:

- Storefront: the root preview
- API: `/api`

Useful checks:

```bash
pnpm run typecheck
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/scripts run seed:nexora
```

`DATABASE_URL` is required by the database package. Clerk development credentials are provisioned by the workspace auth setup; never expose `CLERK_SECRET_KEY` to the browser.

## User flows

- Browse the homepage and catalog at `/shop`
- Filter by search, category, offers, and sort order
- Open a product at `/product/:slug`
- Add items to the persistent bag at `/cart`
- Checkout at `/checkout`
- Use `NEXORA10` for a 10% discount
- Order confirmation and tracking at `/order/:orderId`
- Account entry point at `/account`
- Authenticated admin summary at `/admin`

Checkout currently uses a safe mock payment mode. It creates the order, decrements inventory, clears the session cart, and stores the payment method/status without accepting or storing raw card numbers.

## Architecture

### Frontend

`artifacts/nexora-store` is a React/Vite app using wouter for routes, TanStack Query for server state, generated API hooks, and Clerk for browser authentication. The visual system is defined in `src/index.css`; the shared storefront shell lives in `src/components/storefront.tsx`.

### API

`artifacts/api-server` is an Express 5 API mounted at `/api`. Routes are grouped by storefront, cart, checkout, orders, and admin. Clerk middleware and the Clerk proxy are mounted before body parsing and routes.

### API contract

`lib/api-spec/openapi.yaml` is the source of truth. After editing it:

```bash
pnpm --filter @workspace/api-spec run codegen
```

Generated Zod validators are used by the API, and generated React Query hooks are used by the frontend.

### Database

`lib/db/src/schema/store.ts` contains the Drizzle schema for:

- Categories
- Products and supplier metadata
- Anonymous carts
- Orders
- Order items

The catalog is database-backed. The seed command is idempotent and lives at `scripts/src/seed-nexora.ts`.

### Supplier boundary

Products carry supplier IDs, supplier product IDs, and supplier cost so supplier adapters can be added without changing the storefront shape. The current checkout flow intentionally uses mock payment and fulfillment behavior until a payment provider and supplier account are connected.

## Production follow-ups

Before taking live payments, connect a supported payment provider and replace the mock checkout implementation with provider-hosted tokenization or checkout sessions. Keep secret keys server-side and add webhook verification before changing order/payment status.

Before live fulfillment, add a supplier adapter that implements product sync, order placement, and tracking updates. Store supplier order IDs and fulfillment events alongside the existing customer order.

For production publishing, use separate Clerk production configuration and review the legal pages with the actual business identity, address, refund policy, tax rules, and support contact.