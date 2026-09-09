# CELESTIALS

A mobile-first streetwear store built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase. Ready to import into Vercel.

## Run locally

Requires Node.js 20.9 or newer (Node 24 was used for verification).

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Without environment variables, the store displays six individual products and two outfits with preview inventory. Search, filters, galleries, variant selection, quantity controls, and local cart persistence work. Checkout and admin sign-in explicitly stay disabled until Supabase is connected. The app never creates fake orders or uses a default admin password.

## Restore the original catalog into an already connected store

Connecting Supabase switches `src/lib/products.ts` from the preview catalog to the database; it does not automatically import preview records. The original catalog is still in `src/lib/catalog.ts` (six products), `src/lib/outfits.ts` (two linked outfits), and `public/products` / `public/outfits` (the supplied photography and charts).

For the existing database with TEST CELESTIAL TEE:

1. In Supabase **SQL Editor**, confirm migrations 001, 002 and 003 have already been applied. If this installation already supports the complete admin editor, do **not** rerun them.
2. Open **`supabase/restore-original-catalog.sql`**, copy the entire file into a new SQL Editor query, and click **Run**. If Supabase prompts, choose **Run without RLS**. The script creates no helper tables and does not alter existing RLS policies. Replace any older SQL Editor copy with this updated file; do not reuse the automatic RLS statements from the failed attempt. This is the only restoration SQL you need to run on that schema.
3. Refresh `/shop` without query parameters, then check Tops, Bottoms and Outfits. The script also returns product/stock and outfit rows for inspection.

This imports Cursed Blood Manipulation Shirt, Sakura Long Sleeve, Sakura Shirt, Slim Fit Shirt Blue Navy, Sakura Jeans, Serpent Hunter Bootcut, BOOTCUT + SLIM SHIRT COMBO and SAKURA OUTFIT SUMMER. It preserves exact source prices, ordered image paths, descriptions, categories, variants, colors, badges, chart assets and outfit component overrides. No image reupload is needed; deploy the existing `public` assets with the app.

The import is transactional and repeatable. It never deletes or updates existing records, including TEST CELESTIAL TEE. Matching slugs reuse existing product IDs; missing size/color variants are inserted without resetting existing stock. Existing unpublished products/outfits stay unpublished and existing edits win. Conflicting IDs or cross-category route slugs abort the transaction for review rather than overwrite records. No retired placeholder products are restored.

Newly inserted variants retain the original **demo stock of 12 each** (20 variants total). These are demo quantities, not confirmed physical inventory; review them in Admin before accepting real orders. Existing stock, including zero, stays unchanged. The older `seed.sql` intentionally used zero inventory, so use this restore script for the requested demo-catalog preservation instead.

With just the existing test tee plus the restored catalog, expect **9 All pieces**, **5 Tops** (if the tee is a Top), **2 Bottoms**, **2 Outfits**. Explicit search/size/color/price/new-arrival/in-stock filters still apply. Outfit records appear only when both referenced products are active. The restored original outfits have no New Arrival badge, matching their original data.

Regenerate the checked-in SQL from the repository sources with `npm run catalog:restore:generate`. The generator verifies every referenced local image exists. `tests/catalog-restore.test.ts` tests exact catalog preservation, category filters through database reads, public catalog access, owner-record preservation, repeatability, and alternate IDs for matching slugs.

## Connect Supabase

1. Create a project at https://supabase.com/dashboard. Save the database password privately.
2. Open **SQL Editor**. Run `supabase/migrations/001_store.sql` once, followed by `supabase/migrations/002_outfits.sql`. These create the tables, transactional functions, access policies, and `product-images` bucket, including bundle inventory and order support.
3. Run `supabase/seed.sql`, then `supabase/outfits-seed.sql` to load the current collection. Then run `supabase/migrations/003_admin_management.sql` once to enable the complete admin editor. For an existing database that already has migrations 001 and 002 and the collection, run ONLY migration 003. These seeds do not reset existing stock or product edits. Enter actual inventory before accepting real orders.
4. Copy `.env.example` to `.env.local`. In the project settings, find the API URL and API keys, then set:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The URL and anon/publishable key may be public. **The service-role key must remain server-only.** It bypasses RLS and must never appear in a `NEXT_PUBLIC_` variable, a client component, a screenshot, or a committed file. The server database module imports `server-only` to enforce this boundary. The same private key signs short-lived order receipts.

5. Under **Authentication → Users**, create the owner account with a strong password and confirmed email. Copy its user UUID. Run this in SQL Editor, replacing the UUID:

```sql
insert into public.admin_users (user_id)
values ('YOUR_AUTH_USER_UUID')
on conflict do nothing;
```

6. Disable public user sign-ups in Supabase Auth settings. There is no customer account requirement. Configure the Auth Site URL for localhost now and your real site when deploying. The admin uses password authentication; no OAuth callback route is needed. Password changes/recovery can be managed from Supabase while customer support tooling is being configured.
7. Restart `npm run dev`. Visit `/admin/login`, sign in, and manage the collection and orders.

Removing an administrator from `admin_users` revokes dashboard and mutation access on the next request. Admin membership cannot be changed using the public API. Every administrative server action independently verifies the session and membership.

Implementation references: [Supabase cookie-based server authentication](https://supabase.com/docs/guides/auth/server-side) and [Next.js authorization guidance](https://nextjs.org/docs/app/guides/authentication).

## Storefront languages

EN (default), FR, and AR are available in the navbar's custom language menu. Arabic uses the Algerian flag. The choice is saved in a one-year `celestials-language` cookie; server rendering and client components share the same language without adding or duplicating routes. The document's `lang` and `dir` update with the choice. Arabic storefront layout uses RTL, while photos/logos stay unmirrored, phone numbers use LTR, and customer-entered names/addresses detect their own text direction. The admin area remains English and LTR.

Translations live in `src/lib/i18n/messages.ts` as English/French/Arabic entries, with named placeholders such as `{count}`. Server components use `getTranslator()` and client components use `useLanguage().t()`. Add new UI copy to that central file; English is the fallback for unknown text. `node scripts/audit-translations.cjs` checks the extracted storefront copy for translation coverage. Product names, SKUs, stored category/variant values, API payloads, and database fields remain unchanged. Custom catalog descriptions and newly introduced color/category names use their original text unless a translation is added; the included sample descriptions and color/category labels are translated.

On mobile, the rounded navbar contains the supplied logo, language selector, and hamburger. Search and the bag (with its item counter) are available in the mobile menu. Desktop search and bag links remain in the navbar. The language menu supports pointer/touch, outside-click dismissal, Escape, arrow keys, Home/End, and keyboard selection.

## Database and order behavior

| Table | Purpose | Public access |
| --- | --- | --- |
| `products` | Names, slugs, categories, whole-DZD prices, descriptions, ordered image URLs, badges, publication | Read active products |
| `product_variants` | Product + size + color + hex + stock | Read variants of active products |
| `orders` | Customer and delivery details, reference, idempotency key, totals, status | None |
| `order_items` | Immutable product/variant/price snapshots and quantity | None |
| `admin_users` | Explicit owner-managed authorization list | An authenticated user can read only their membership |

`POST /api/orders` validates the complete payload with Zod, rejects cross-origin requests and oversized payloads, and calls `place_order` through the server-only client. The function locks inventory, checks quantities and publication, calculates prices and delivery charges from server data, reserves stock, and writes the order and snapshots in one transaction. Failure rolls everything back. A unique idempotency key makes retries safe. A phone-based database rate limit allows at most five orders per hour, normalizing local and international phone formats. This is a basic abuse limit, not a replacement for a production WAF if the store attracts automated abuse.

Confirmation requires an HttpOnly, signed receipt cookie valid for 24 hours. Query parameters alone cannot create a confirmation. No customer address or phone is put into the receipt URL. The browser cart contains product details only; delivery information is not stored in localStorage.

Order transitions:

```text
pending → confirmed → shipped → delivered
   ↘ cancelled  ↙
```

Only pending or confirmed orders can be cancelled. Cancellation restores stock exactly once. Terminal statuses cannot be reopened; shipped returns need a separate operational process. Products with open orders cannot be deleted; unpublish them instead. Variant deletions are blocked when pending/confirmed orders still need them for potential restocking. Historical order descriptions and prices survive catalog edits/deletions.

Admin image uploads accept JPEG, PNG, and WebP up to 3 MB. Images can also use HTTPS URLs. Existing `/products/`, `/outfits/`, and `/celestials/` image paths are accepted. Upload multiple images, reorder with arrows or URL lines, and remove associations. The first image is the cover. Size-guide images are separate from galleries. Unreferenced storage files are retained to avoid deleting images used elsewhere and can be removed manually in Supabase Storage.

## Configure before opening orders

- Preserve the supplied CELESTIALS product photography; review descriptions, colors and real inventory before launch. The homepage uses the supplied campaign artwork at `public/celestials/hero.jpg` and supplied category photos and logo in the same directory; asset provenance is documented in `ASSETS.md`. Edit the hero/category images in `src/app/page.tsx`, the brand image in `src/app/about/page.tsx`, and products in admin.
- Add your actual support email/phone, business details, delivery estimates, return/exchange terms, and privacy information to `src/app/contact/page.tsx`. Launch-state notices deliberately avoid inventing contact details or policies.
- Set real descriptions, material/care information, size measurements, prices, and available inventory. Publish only products ready to sell.
- Confirm courier coverage. Checkout includes the current 69 wilayas; communes are free-text. The additional wilayas follow the [2026 Official Journal list](https://www.joradp.dz/FTP/jo-francais/2026/F2026026.pdf) and [territorial organization decree](https://www.joradp.dz/FTP/jo-francais/2026/F2026040.pdf). Confirm how your courier handles the new wilayas during its transition.
- Delivery defaults to **600 DZD**, free at **15,000 DZD**. If changing this, update `src/lib/types.ts`, the `place_order` function through a new migration, and delivery copy in the header/contact/product pages together.
- Order fulfillment is manual through the admin dashboard. Automated SMS/email and courier integrations are not included. The dashboard counts all orders and the Orders tab pages through history in groups of 50. Search/status filters apply to the current page.

## Deploy on Vercel

1. Push this directory to your own Git repository and import it into Vercel using the Next.js preset.
2. Use `npm run build` as the build command; keep the framework's default output directory. Use Node.js 24.x (or a supported Node version at least 20.9).
3. Add the three Supabase variables above in Vercel project settings, plus `NEXT_PUBLIC_SITE_URL=https://your-domain`. Scope the service key only to environments that should access the corresponding database. Use a separate staging project for preview deployments that accept test orders.
4. Deploy, connect your domain, and update Supabase's Auth Site URL.
5. Complete the live smoke test below before promoting the store. Never seed over your real inventory; the provided seed is optional sample data.

The app uses Node route handlers and Supabase HTTP APIs. No local filesystem database or background worker is required in production.

Supabase configuration is read at request time through the shared server-only `src/lib/supabase-config.ts`, including catalog loading, checkout readiness, admin authentication and session refresh. Only readiness booleans reach the login/checkout components. If both buttons report that the store is disconnected, the familiar catalog may be the built-in preview catalog. Check the environment values on the **active deployment**, not only the project settings, and create a new deployment after changing them. Keep `NEXT_PUBLIC_SITE_URL` set to the exact production HTTPS origin; origin validation remains enforced.

## Verification

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser suite starts the production server on port 3002. Run it **without Supabase environment variables** for the unconfigured-store assertions. Desktop Chromium and mobile Chromium with an iPhone 13 viewport cover browsing, search/filters, size/color selection, out-of-stock options, cart persistence, quantities/removal, checkout fields, disabled unconfigured checkout, protected admin routing, invalid API requests, and forged confirmations. Screenshots and failure traces are written under `test-results/`.

`npm test` runs Zod validation tests and the application SQL against an embedded PostgreSQL engine (PGlite). Supabase-owned auth/storage schemas are represented by local fixtures, with a random-byte fixture for pgcrypto. Tests cover order creation, totals, stock reservation and rollback, idempotency, phone rate limits, RLS permissions, admin catalog CRUD, status changes, and cancellation restocking. **These tests do not verify live Supabase Auth, Storage, or a deployed Vercel environment.**

On Windows, if the sandbox prevents `tsx` from reading user information, run the commands in a normal authorized terminal.

### Live smoke test after connecting your project

1. Add two sizes/colors of a test product. Reload and confirm the bag retains both. Change quantity and remove a line.
2. Submit one low-value test COD order using your own phone/address. Confirm the receipt, empty bag, exact database totals, and corresponding stock decrement.
3. Retry the same request/idempotency key and verify only one order exists. Try a sold-out variant and verify that no order or stock change is saved.
4. Sign in as the authorized admin. Confirm customer phone/address and order contents. Move pending → confirmed → shipped → delivered on one order. Cancel a second order and verify inventory restores once.
5. Create/edit/unpublish/delete a disposable product and upload a real image. Check the storefront reflects edits and unpublished products disappear.
6. Sign out. Confirm `/admin` redirects to login, a non-admin account is rejected, and the public key cannot query customer/order tables.
7. Repeat the shopping flow on a physical mobile device against the deployed HTTPS site.

No live Supabase project was provided during implementation, so live authentication, image upload, and end-to-end persisted checkout must be verified after setup.


### Cursed Blood Manipulation catalog update

The local catalog contains the Cursed Blood Manipulation Shirt and the two existing Bottoms products. Its five original photos are served from `public/products/cursed-blood-manipulation/`.

For a new Supabase project, use the updated `supabase/seed.sql`. For a previously seeded project, run `supabase/catalog-update.sql` once in the SQL editor: it removes old Tops/Hoodies/T-Shirts/Outerwear catalog records and adds the new shirt while preserving Bottoms and historical order snapshots. No schema changes are required.

The local preview uses 12 units per shirt size for interaction testing. Production seed stock is zero until actual S / M-L / XL counts are entered through the existing admin inventory controls. The SQL update has not been applied remotely because this workspace has no configured Supabase project.


### Sakura Long Sleeve

Sakura is one Tops / New Arrival entry, with five product photos and a separate size-chart image rendered only in its Size Guide. For an existing Supabase project, run `supabase/sakura-update.sql` once; new projects use the updated seed. This additive script leaves all existing products unchanged. As with the previous shirt, local preview stock is 12 per size and production seed stock is zero pending confirmed S / M-L / XL inventory. No remote SQL has been applied.

For a database already containing Sakura, apply `supabase/sakura-category-update.sql` to change only its category to Tops.


### Sakura Shirt

Sakura Shirt is a separate Tops / New Arrival product at 3,700 DZD with exactly four photos in `public/products/sakura-shirt/`. Its Size Guide reuses `public/products/sakura-long-sleeve/size-chart.jpeg`; this asset is not in its gallery. For existing Supabase catalogs, `supabase/sakura-shirt-update.sql` adds only this product; new projects use the updated seed. Local preview stock is 12 per size, while production stock starts at zero until actual quantities are confirmed. No remote database has been modified.


### Slim Fit Shirt Blue Navy

The navy shirt is an additional Tops / New Arrival entry at 2,000 DA, with three original photos and its own description. Existing Supabase installations can apply `supabase/navy-shirt-update.sql`; it inserts only this product and its variants. No remote database has been changed. Preview sizes S / M / L / XL and 12 units each are provisional; production stock is zero until actual sizes and inventory are confirmed.


### Sakura Jeans / Bottoms replacement

Sakura Jeans (6,000 DZD) is the only current Bottoms product. The old cargo and denim products are removed from the local catalog and seeds; their old URLs resolve to the not-found page, and saved carts discard those retired entries. Tops records are unchanged. The jeans use three photos plus their own separate size chart in `public/products/sakura-jeans/`.

For an already configured Supabase catalog, apply `supabase/sakura-jeans-update.sql` once to remove old Bottoms and add Sakura Jeans while retaining historical order snapshots. No remote database is configured here, so this SQL has not been applied remotely. Local preview inventory is 12 units per S / M-L / XL size; production inventory starts at zero until actual stock is confirmed.

Sakura Jeans XL uses the unchanged supplied S / M-L chart; no XL measurements are asserted. Existing databases can add the variant using `supabase/sakura-jeans-xl.sql`.

### Outfits (current catalog)

The catalog now has six individual products and two outfits. Serpent Hunter Bootcut is an additional Bottoms product, priced at 5,900 DA from the specified 7,900 DA combined price minus the 2,000 DA navy shirt. Existing five individual products are unchanged. The earlier Bottoms replacement instructions above describe a previous update; do not rerun those deletion scripts on the current catalog.

`src/lib/outfits.ts` defines the two preview outfits by existing product IDs. Live outfits come from `public.outfits`. Each definition contains two component references, optional component thumbnails/chart overrides, a main image, the original price and an authoritative discounted price. Components use their actual variants and inventory; outfits have no synthetic size variants. Existing admin product management remains available for component inventory; no outfit editor was added.

New Supabase setup order:
1. `supabase/migrations/001_store.sql`
2. `supabase/migrations/002_outfits.sql`
3. `supabase/seed.sql`
4. `supabase/outfits-seed.sql`

For an existing database with the current five products, apply only `002_outfits.sql`, then `outfits-seed.sql`. The latter adds Serpent Hunter Bootcut and both outfits without overwriting existing records. Configure actual variant inventory before opening orders: seed stock is zero, while the disconnected local preview uses 12 units per size. No live Supabase project was configured or modified during this implementation.

The order RPC validates each outfit's two variants against its component IDs, reads the discounted price from the database, locks and reserves aggregate inventory across both outfits and individual products, and saves one order line plus two component snapshots. Cancellation restores both variants exactly once. Component sizes also appear in the existing admin order-line size field. Pending outfit variants cannot be deleted, and products referenced by an outfit must be unpublished instead of deleted until the outfit reference is removed.

Outfit #2 intentionally displays the supplied S/M, L, XL shirt chart unchanged while its size selectors remain S, M-L, XL as requested. It uses an outfit-specific chart override; the existing individual Sakura Shirt and Long Sleeve charts are unchanged. The Sakura Jeans chart is reused and does not invent XL measurements.


## Admin handover (migration 003)

Visit `/admin`; unauthenticated visitors are redirected to `/admin/login`. Use the Supabase Auth email/password account whose UUID is in `admin_users`. There are no default credentials, customer accounts or local admin bypasses.

- **Dashboard:** total individual products, outfits, all orders, and recent orders.
- **Products:** add/edit, publish/unpublish, guarded deletion, Tops/Bottoms, selling price and optional original price, badges, ordered galleries, uploaded size chart with descriptive text, sizes/colors and real stock. Blank original price means no sale. Stock zero disables that variant.
- **Outfits:** choose one existing Top and one Bottom, upload/order hero images, set the combined normal price and selling price, badge and publication. Component sizes, stock and charts remain linked to the products. Existing supplied thumbnail/chart overrides are preserved when editing an outfit; selecting a replacement component uses that product's assets. No independent bundle stock is created.
- **Orders:** customer/contact/address, exact item and outfit-component snapshots, quantities, subtotal, delivery, total, date, and status. The label **New** maps to the existing `pending` database state. Status changes use the existing transaction and inventory-restoration logic.

All saves use the existing authenticated server actions and security-definer RPCs with an administrator membership check; public database writes remain denied. Supabase Postgres persists catalog and orders, Supabase Storage stores uploads, and Supabase Auth handles passwords and sessions. Storefront queries use the same database. Refresh an already open browser tab to see another administrator's changes; this does not add realtime subscriptions.

Migration 003 extends the existing tables without resetting inventory, photos, names, prices or order history. It moves the legacy Sakura chart references into editable product fields, adds optional product original prices and outfit galleries/badges, adds protected outfit mutations and cross-catalog slug checks. Back up production before applying migrations. Do not rerun earlier cleanup scripts against an operating store.

### Verification and staging smoke test

`npm test` includes PostgreSQL integration checks for migration compatibility, admin authorization, product/outfit edits, storefront filters, mixed product/bundle checkout, exact component snapshots, authoritative totals, stock restoration, and persistence after closing/reopening the test database. `npm run typecheck`, `npm run build`, and `npm run test:e2e` cover compilation and storefront regressions. No lint script is configured.

A separate **opt-in staging browser test** is in `tests/e2e/admin-live.spec.ts`. Connect a staging Supabase database, apply all migrations, start the site, and set `RUN_ADMIN_LIVE=1`, `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD` and `PLAYWRIGHT_PORT` in your local shell (never commit credentials). Then run:

```sh
npm run test:e2e -- --project desktop --grep "staging admin"
```

It creates uniquely named test products/outfit, edits and reloads them, checks the storefront/cart, submits a cash-on-delivery test order, verifies its sizes/total in admin, changes status and reloads, then cancels the order and removes its catalog fixtures. It retains the cancelled order audit trail. If interrupted, cancel the clearly named staging order and remove its test fixtures manually. Use staging only; never fulfill these test orders. Without the opt-in and credentials this test skips, and local preview does not pretend to authenticate or accept orders.

The existing checkout charge (600 DZD, free from 15,000 DZD) and shared Zr Express delivery-range copy are preserved. They are not a wilaya-specific tariff calculator; confirm that operating policy before launch. No courier or online-payment integration has been added.


### Checkout request origin

`POST /api/orders` checks the browser Origin against `NEXT_PUBLIC_SITE_URL` rather than Next's internal bind address or forwarded host headers. Development additionally permits exactly `http://localhost:3000`. Missing, null and foreign origins are rejected. Production accepts only the configured site origin and fails closed if configuration is missing/invalid. For localhost keep `NEXT_PUBLIC_SITE_URL=http://localhost:3000`; set the actual HTTPS storefront URL in production and restart/redeploy after changing it. This requires no database migration.

`node --env-file=.env.local scripts/verify-live-checkout.mjs` creates two labelled DO NOT SHIP orders through the localhost API, retries each idempotency key, and verifies totals and component stock changes using the public catalog. It retains those test orders for admin review/cancellation. If the server role lacks direct table read grants, it reports that limitation rather than changing permissions; an authenticated administrator must inspect the saved order details. The local PostgreSQL tests verify component snapshots, one bundle line, idempotency and persistence across database restart.
