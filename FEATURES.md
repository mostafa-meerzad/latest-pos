# FEATURES.md

Planned features and improvements. Each entry defines the goal, scope, approach, and decisions already made — so future sessions can continue without re-discussing.

Status values: **Planned** | **In Progress** | **Done**

---

## Feature 1: Offline Sales Support

**Priority:** High
**Status:** Done

### Goal
Allow cashiers to continue making sales during short internet outages (up to 2–3 days). Only the sale creation flow needs to work offline. Everything else (reports, settings, delivery management) can degrade gracefully.

### Scope

In scope:
- Cache product catalog locally on every successful app load
- Cache customer list locally on every successful app load
- Queue sales created while offline in local storage
- Auto-flush the queue when connection restores
- Visual indicator: online/offline status + count of pending unsynced sales
- Conflict report when a queued sale fails to sync (e.g., product now out of stock on server)
- Warning banner if device has been offline > 24h: "Stock quantities may be outdated"

Out of scope:
- Offline reports or dashboards
- Offline customer/product/supplier management
- Offline delivery creation
- Long-term offline (weeks/months) — not a design goal
- New customers created while offline (walk-in customer covers this case)

### Approach

**Service Worker** — caches static assets and Next.js page bundles so the app shell loads without a network. Intercepts failed API calls and routes them to the local fallback.

**IndexedDB** (via the `idb` npm library) — three stores:
- `offline_products` — snapshot of active, non-deleted, in-stock products. Refreshed on every successful `/api/products` fetch.
- `offline_customers` — snapshot of customer list. Refreshed on every successful `/api/customer` fetch.
- `pending_sales` — queue of sale payloads created while offline. Each entry includes the full payload, a local timestamp, and a status (`pending` | `failed`).

**Sync flow:**
1. On every sale submit, check `navigator.onLine`.
2. If online: submit normally. On success, clear any stale `pending_sales`.
3. If offline: write the payload to `pending_sales` with status `pending`, show a toast "Sale saved locally — will sync when online".
4. `window.addEventListener('online', ...)` triggers `flushPendingSales()` automatically.
5. `flushPendingSales()` processes the queue in order. On each success: remove the entry. On failure (4xx/5xx): mark as `failed`, surface to cashier with options to retry or void.

**Conflict handling:** A failed sync shows a visible alert card (not just a toast) with the sale details, the error reason, and Retry / Mark as Void actions. A voided sale stays in IndexedDB with status `voided` for audit purposes.

**Stock accuracy:** Offline product data is a snapshot. Overselling is an accepted tradeoff for short outages. The 24h banner warns cashiers to cross-check physically if the outage has been long.

### Key Decisions
- Short-term offline only (2–3 days), not indefinite
- Product catalog is a cached snapshot — stale stock is accepted, not solved
- Walk-in customer covers the case where a new customer walks in during an outage
- Offset-based queue (FIFO) to preserve sale order on sync

---

## Feature 2: Server-Side Pagination

**Priority:** High (sales table already has thousands of rows)
**Status:** Done

### Goal
Replace full-table fetches with paginated API calls. Every list page must load fast regardless of row count. Sales is the most urgent.

### Scope

Pages to paginate (in priority order):
1. Sales
2. Products
3. Customers
4. Deliveries
5. Suppliers
6. Drivers
7. Users (admin only)

### Approach

**API pattern** — all list `GET` endpoints accept query params:
- `page` — 1-indexed page number (default: 1)
- `limit` — rows per page (default: 25)
- `search` — server-side filter string (applied to relevant fields per resource)

Response shape:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 4820,
    "totalPages": 193
  }
}
```

**Prisma pattern:**
```js
const skip = (page - 1) * limit;
const [data, total] = await Promise.all([
  prisma.model.findMany({ where, skip, take: limit, orderBy }),
  prisma.model.count({ where }),
]);
```

**Frontend** — a shared `<PaginationBar />` component used by every list page:
- Previous / Next buttons
- Current page display ("Page 2 of 193")
- Rows-per-page selector (25 / 50 / 100)
- Page + search state lives in URL params (`?page=2&search=ahmed`) so browser back works and links are shareable

**Search:** Debounced input (300ms), clears page back to 1 on new search. Search is server-side — no client-side filtering.

### Key Decisions
- Offset-based pagination (simpler; cursor-based not needed at this scale)
- Default page size: 25
- Search resets to page 1
- URL params are the source of truth for page state (not component state)

---

## Feature 3: Responsive List Pages

**Priority:** Medium
**Status:** Done

### Goal
Fix pages where the table layout breaks or becomes unusable on tablets and smaller screens. The app runs on POS hardware — screen size varies.

### Approach
- **Desktop (md+ breakpoint):** Keep existing table layout
- **Mobile/tablet (< md):** Switch to a card-stack layout where each row becomes a card showing the 3–4 most important fields

No need for a universal `<ResponsiveTable />` abstraction — each page has different important columns, so each gets its own card variant.

### Pages to address (in priority order)
1. Sales list
2. Products list
3. Customers list
4. Deliveries list
5. Suppliers list

### Key Decisions
- Don't rebuild tables that aren't a real problem — only fix confirmed pain points
- Card layout on mobile surfaces only the key columns; secondary fields hidden or shown on expand

---

## Feature 4: UI Consistency Pass

**Priority:** Medium
**Status:** Done

### Goal
Standardize visual language across all pages: colors, page structure, status indicators, empty states, and loading states.

### Scope

- Apply a consistent color palette through shadcn/Tailwind CSS variables — no custom one-off colors scattered in className strings
- Standardize page header pattern: title on the left, primary action button(s) on the right
- Consistent status badges:
  - ACTIVE → green
  - INACTIVE → gray
  - PENDING → yellow/amber
  - FAILED / DELETED → red
- Replace blank loading flashes with skeleton loaders (shadcn `Skeleton` component)
- Add proper empty states instead of empty tables — at minimum a message and a relevant CTA

### Key Decisions
- Use the existing shadcn CSS variable system — no new design tokens
- No full design system overhaul; this is a targeted pass, not a redesign
- Skeletons should match the shape of the content they replace (table skeleton for tables, card skeleton for cards)

---

## Feature 5: UX Enhancements

**Priority:** Low–Medium (implement individually as capacity allows)
**Status:** Done

| Enhancement | Description | Effort |
|---|---|---|
| Keyboard shortcuts | F2 = focus barcode input, Enter = add item to cart, F9 = finalize sale. Standard for POS cashier workflows. | Low |
| Low stock alerts | Show a badge or inline warning on Products list when `stockQuantity` falls below a configurable threshold. No notifications needed — just visible on the page. | Low |
| Export reports | Download the current reports view as CSV. Useful for end-of-day reconciliation. | Medium |
| Better search UX | Debounced search inputs with a clear button. Tied to Feature 2 — server-side search replaces the current client-side filtering. | Low (done as part of Feature 2) |

---

## Implementation Order (recommended)

1. **Feature 2 — Pagination** first. It's the highest-impact fix for existing pain and unblocks Feature 3 (responsive pages will be built on paginated data).
2. **Feature 4 — UI Consistency** alongside pagination, since loading skeletons and empty states are needed as part of the pagination UI anyway.
3. **Feature 3 — Responsive tables** after pagination is in place.
4. **Feature 1 — Offline support** last — it's the most complex and touches the most infrastructure. Do it on a dedicated branch.
5. **Feature 5** items can be picked up opportunistically during any of the above.
