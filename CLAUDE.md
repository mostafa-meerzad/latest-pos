# POS System — Claude Code Guide

## What this is

A Point-of-Sale web application for retail shops in Afghanistan. Currency is AFN (Afghan Afghani). Built with Next.js 15 App Router, React 19, and MySQL via Prisma. Supports multiple branches, two roles (ADMIN / CASHIER), delivery management, and thermal-printer invoices.

## Essential commands

```bash
npm run dev       # start dev server
npm run build     # production build (run this to verify no import errors)
npm run lint      # ESLint
npx prisma studio # browse the database
npx prisma migrate dev --name <name>  # create a migration
npx prisma db seed  # seed initial data
```

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router |
| Database | MySQL + Prisma ORM |
| Auth | Custom JWT (jose + bcryptjs) — session cookie `pos.session` |
| State | Zustand (cart store persisted to localStorage) |
| UI | shadcn/ui (Radix primitives) + Tailwind v4 |
| Validation | Zod schemas in `lib/schemas/` |
| Charts | Recharts |
| Printing | react-to-print |
| Errors | Sentry (`sentry.server.config.js`, `sentry.edge.config.js`) |

## Project structure

```
app/
  api/                    # Next.js API routes (server-only)
    auth/                 # login / logout / me
    branches/             # branch CRUD
    category/             # category CRUD
    customer/             # customer CRUD + purchase history
    deliveries/           # delivery CRUD
    drivers/              # driver CRUD
    invoices/             # invoice generation
    products/             # product CRUD
    reports/              # reports aggregation
    sale/                 # sale CRUD + editSale + refund
    suppliers/            # supplier CRUD
    users/                # user CRUD (admin only)
  sales/add-sale/
    AddSaleClient.jsx     # orchestrator (~280 lines) — imports hooks + components
    _hooks/               # feature-scoped React hooks
      useSaleCart.js      # cart state, add/edit/delete items, totals
      useEditMode.js      # URL-driven edit mode, fetches sale for editing
      usePrinting.js      # print refs, auto-trigger invoice/delivery print
      useNumericKeyboard.js # on-screen keypad visibility + positioning
    _components/          # feature-scoped UI components
      SaleHeader.jsx      # page title + action buttons
      CustomerSearch.jsx  # customer typeahead
      ProductSearch.jsx   # barcode scan + product typeahead + qty/discount/payment
      CartTable.jsx       # items table with inline row editing

lib/
  auth.js                 # signSession, verifySessionToken, cookie builders
  errors.js               # ApiError class
  permissions.js          # canAccess(role, action) — hierarchical permission check
  prisma.js               # Prisma singleton (dev hot-reload safe)
  roles.js                # ROLES enum + roleAccess map
  schemas/                # Zod validation schemas (one file per domain)
    category.js  customer.js  product.js  sale.js  supplier.js  user.js
  services/               # Server-side business logic (Prisma queries)
    customer.js           # getOrCreateWalkInCustomer
    customerHistory.js    # getCustomerPurchaseHistory
    invoice.js            # generateInvoice (create or fetch)
  status.js               # STATUS enum { ACTIVE, INACTIVE }
  stores/
    saleStore.js          # Zustand cart store (persisted, cross-tab sync)
  utils.js                # shadcn cn() helper

components/
  Invoice.jsx             # 80mm thermal invoice (used in add-sale flow)
  NewInvoice.js           # Full invoice with DB data (used in sale detail page)
  Delivery.jsx            # 80mm delivery slip
  NumericKeyboard.jsx     # On-screen numeric keypad (touch/POS hardware)
  BackToDashboardButton.jsx
  ui/                     # shadcn/ui primitives (button, card, dialog, etc.)

prisma/
  schema.prisma           # database schema
  seed.js                 # seed script
  migrations/             # migration history
```

## Auth system

**Custom JWT, NOT next-auth.** The `next-auth` package has been removed.

- Login: `POST /api/login` → sets `pos.session` HttpOnly cookie with a 12h JWT
- Logout: `POST /api/logout` → clears cookie
- Session data: `{ id, username, role, branchId }`
- Middleware (`middleware.js`): verifies JWT on every request; redirects unauthenticated users to `/login`; blocks non-ADMIN from `/settings` and `/api/users`
- Server components / route handlers: use `getAuthFromCookies()` from `lib/auth.js`
- API route handlers: use `getAuthFromRequest(req)` from `lib/auth.js`

## Roles and permissions

Two active roles: **ADMIN** (full access `"*"`) and **CASHIER** (broad access, no user management settings).

`canAccess(role, action)` in `lib/permissions.js` supports dot-notation hierarchy — `"deliveries"` grants `"deliveries.view"` and `"deliveries.manage"`.

The `Role.permissions` DB column exists but is not used at runtime — permissions are hardcoded in `lib/roles.js`.

## Database models (key relationships)

```
Branch  →  User, Product, Category, Supplier, Customer, DeliveryDriver, Delivery, Sale
Sale    →  SaleItem[], Customer?, User, Branch, Invoice?, Delivery?
SaleItem → Product, Sale
Delivery → Sale (1:1), Customer, DeliveryDriver?, Branch
Invoice  → Sale (1:1)
```

All entities are branch-scoped (`branchId`). Unique constraints are per-branch (e.g. barcode is unique within a branch, not globally).

## Prisma conventions

- Client is generated into `app/generated/prisma` (not the default location)
- Import the singleton: `import prisma from "@/lib/prisma"`
- Pass `tx` as first arg to service functions when called inside a transaction

## API route conventions

All routes follow this pattern:

```js
import { getAuthFromCookies } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { someSchema } from "@/lib/schemas/something";

export async function GET(req) {
  const auth = await getAuthFromCookies();
  if (!auth) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

  // permission check if needed
  if (!canAccess(auth.role, "resource.action")) {
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  // always filter by branchId unless ADMIN querying all branches
  const data = await prisma.model.findMany({ where: { branchId: auth.branchId } });
  return Response.json({ success: true, data });
}
```

## Key conventions

- **Currency**: all monetary values stored as integers (whole AFN, no decimals). `Decimal` type is used for `stockQuantity` and `discountAmount` in the schema.
- **Soft deletes**: `Product` and `DeliveryDriver` use `isDeleted` boolean. `Delivery` uses `deleted`. Others use `status: "ACTIVE" | "INACTIVE"`.
- **Units**: products are either `"pcs"` (integer quantity only) or `"kg"` (decimal quantity allowed).
- **Walk-in customer**: anonymous sales use a customer named `"Walk-in Customer"` fetched via `getOrCreateWalkInCustomer()`.
- **Branch isolation**: the main branch (`isMain: true`) can see cross-branch reports; other branches see only their own data.
- **File extensions**: `.jsx` for React components, `.js` for everything else (hooks, API routes, lib).
- **No comments** unless the WHY is non-obvious. No docstrings.

## Environment variables

```
DATABASE_URL=          # MySQL connection string
JWT_SECRET=            # (or NEXTAUTH_SECRET) JWT signing key
SENTRY_DSN=            # optional, for error tracking
NODE_ENV=              # development | production
```

## Things to watch out for

- `lib/prisma.js` logs all queries in dev (`log: ["query", ...]`). Remove or gate this if it gets noisy.
- The `Role.permissions` DB column is unused — don't rely on it for access control.
- `CustomerSearch.jsx` manages its own `query` state internally; when the parent clears `customer`, the input won't auto-clear unless you extend the component.
- The sale store (`lib/stores/saleStore.js`) persists cart to localStorage under key `pos-sale-storage`. Clear it manually during testing if cart state looks stale.
- `components/NewInvoice.js` is intentionally separate from `components/Invoice.jsx` — `NewInvoice` renders a full DB-fetched sale (used in `/sales/[id]`), `Invoice` renders a cart-based sale (used in the add-sale flow).
