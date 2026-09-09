# CELESTIALS production-readiness QA — 9 September 2026

**Verdict: suitable for a staging deployment; not yet signed off for public launch.** The remaining launch decisions and authenticated-admin verification are listed below. No live database records, products, outfits, stock or orders were changed during this pass.

## Scope actually checked

- Production build served locally with the connected Supabase catalog, including owner-created records and hosted photos.
- Homepage, Shop and categories, every currently listed product/outfit page, About, Contact, empty and populated Cart/Checkout, unverified order-confirmation state and Admin login at 360, 390, 768 and 1440 pixels. No page-level horizontal overflow or broken product/gallery images in the completed sweep. Screenshots also reviewed for tablet Shop and mobile Checkout.
- Search, category switching, price sorting, size/in-stock filters, individual and independent outfit size selection, adding both item types, quantity changes, removal and cart refresh persistence.
- Language keyboard/outside-click behavior; EN/FR/AR mobile navigation at 375/390/430 pixels; reduced-motion navigation, galleries and accordions.
- Unauthenticated access to Dashboard/Products/Outfits/Orders redirects to login. Server-action authorization, SQL RLS, protected mutations, variants, publication, order snapshots, prices, inventory, cancellation and restart persistence reviewed and exercised by local PostgreSQL integration tests.
- Origin checks against configured production origin, rejection of foreign/missing/spoofed origins, server-authoritative checkout amounts, secret-key boundaries, ignored environment files and production configuration.
- Asset sizes/loading and catalog fetch path. No asset replacement or architecture rewrite was necessary.

## Issues found and fixed

1. **Checkout retry identity was lost on refresh.** If a response was lost after an order committed, refreshing checkout created a different idempotency key. The pending attempt now persists in sessionStorage and is reused for unchanged item selections. It clears after success; it stores only a random key and item selection, never customer contact/address data. Both browser tests intercept requests before the network and verify identical keys across refresh.
2. **Blank Admin image URL lines rendered empty image sources.** Empty previews are no longer rendered as images, avoiding invalid/empty-source requests and console warnings while editing URL lists. Gallery reordering/upload behavior is preserved.
3. **Metadata and page rendering both called the catalog loader.** React request-scoped memoization now shares the result within one render request, without a cross-request stock cache or delayed admin updates.

Changed application files: `src/lib/checkout-attempt.ts`, `src/components/checkout.tsx`, `src/components/admin-images.tsx`, `src/lib/products.ts`. No schema migration is required.

## Verification results

- `npm run build`: passed, including Next's TypeScript check.
- `npm run typecheck`: passed.
- `npm test`: **28 passed**, including PostgreSQL/security/lifecycle/restore tests and the new retry-key test.
- Selected production-browser checks: **13 passed**, with one intentionally skipped duplicate viewport sweep (the desktop project explicitly tests mobile and tablet widths). Two initial failures were an overly broad test alert selector matching Next's route announcer; both corrected retry tests passed on rerun. Early QA harness failures from restricted external-network access and querying streamed components before arrival were corrected before the completed sweep.
- Production dependency audit: **0 reported vulnerabilities** (`npm audit --omit=dev --json`).
- Built browser assets: **25 files scanned, 0 matches for the actual service-role key**.
- Translation audit: **238 extracted strings covered; 320 complete entries**.
- No lint script/configured lint command exists.
- Screenshots/traces: `test-results/final-qa/`; corrected checkout retries: `test-results/checkout-retry-final/`.
- Older preview-only browser scenarios assume the original fixed catalog and disabled checkout; they are not a truthful full-suite target for an owner-edited, connected store. This pass used database-independent unit tests plus the selected connected-store checks above.

## Remaining launch checks / owner decisions

1. **Contact page still has launch placeholders:** no working support phone/email, and the return/exchange policy says it will be published before orders open. Supply the actual brand contact and policy text; none was invented.
2. **Confirm delivery pricing:** checkout charges the existing 600 DZD, free at 15,000 DZD; shared delivery information advertises Zr Express home/stop-desk ranges by wilaya. There is no wilaya tariff or stop-desk price calculator. Confirm the intended operating policy before accepting orders. Existing prices/text were preserved.
3. **Authenticated Admin UI/manual smoke test:** no administrator credentials/session were available to this QA browser. Actual login, uploads, image reordering, product/outfit saves and publication, order details/status updates, and Admin layout at mobile/tablet/desktop still require an authenticated pass. Backend operations and authorization were tested locally; that is not a claim of testing the live authenticated UI. The opt-in staging test in `tests/e2e/admin-live.spec.ts` remains available.
4. Confirm physical inventory and intentional visibility of test/demo catalog records before launch. This pass did not reset demo quantities or remove any records. Verify a signed success-confirmation screen in the final hosted domain during the authenticated staging order smoke test; this read-only pass checked the unverified confirmation state and used intercepted requests for retry testing.

## Deployment configuration

Set these in the hosting provider's environment settings; never commit `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_KEY
NEXT_PUBLIC_SITE_URL=https://YOUR_ACTUAL_STOREFRONT_DOMAIN
```

- The service-role key must never have a `NEXT_PUBLIC_` prefix. The existing server-only module and RLS policies remain intact.
- Use the actual HTTPS production origin, not localhost or an internal bind address. Restart/redeploy after changing environment variables. Production accepts only the configured origin; development additionally permits `http://localhost:3000`.
- Use Node.js 24.x as tested, install from the lockfile, and build with `npm run build`. Vercel uses the Next.js preset; other Node hosting uses `npm run start` with the required port.
- Keep existing migrations 001–003, RLS policies, guarded RPCs and the `product-images` Storage bucket. No additional migration or catalog restore is needed for these QA fixes.
- Supabase Auth: set Site URL to the real deployed origin, keep public signup disabled, and use the confirmed owner account listed in `admin_users`. Uploads use the existing public product-image bucket (JPEG/PNG/WebP, 3 MB limit).
- Deploy the existing `public/` assets with the application. Do not run old cleanup/seed scripts against working inventory.

Public launch sign-off should follow the contact/policy and delivery decisions plus the authenticated hosted smoke test. The code build itself is deployable now for staging.
