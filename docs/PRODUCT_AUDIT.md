# HarvestLink product audit

Audit date: 6 November 2026. Sources inspected: README.md, package.json, src/main.jsx, src/lib/backend.js, src/styles.css, supabase-schema.sql, .env.example, vite.config.js, vercel.json and index.html. The deployed Vercel URL was opened as an additional reference, but the client-rendered page did not expose readable content to the inspection tool; therefore no live click-by-click behavior is claimed.

## Architecture
React 19 + Vite 8 SPA; JavaScript; Supabase JS client when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured; otherwise localStorage demo mode. PostgreSQL/Supabase schema. Vercel static deployment. Lucide React icons.

## Existing data structures
- profiles: auth user ID, full name, role (farmer, buyer, institution), phone, created_at.
- products: farmer owner, name/category, unit, optional price, location, available quantity, minimum quantity, description, image URL, availability, active flag and timestamp.
- quote_requests: buyer, optional product, buyer contact, quantity/unit, delivery location/date, notes, status and timestamp.
- buyer_demands: buyer, product/category, quantity/unit, location/date, grade notes, status and timestamp.
- farmer_responses: demand, farmer, offered quantity/unit/price, notes, status and timestamp.

## User journeys
- Farmer: sign up/sign in → publish local or shared listing → view open demand → submit a supply offer → inspect workspace.
- Buyer: sign up/sign in → search/filter catalogue → add produce to request list → submit quote → post demand → inspect workspace.
- Institution: buyer-style demand flow and institutional account entry point.
- Public visitor: browse catalogue, search/filter/sort, view workflow and plans, interact with USSD preview, contact/pilot forms and policy summaries.

## Feature classification
| Feature | Class | Notes |
|---|---|---|
| Responsive landing/navigation | A | Present in main.jsx and responsive CSS. |
| Catalogue/search/category/sort | A | Reads backend product collection and filters client-side. |
| Request list and quote form | A | Creates separate quote records for selected items. |
| Buyer demand publishing | A | Supabase or local demo adapter. |
| Farmer supply response | A | Supabase or local demo adapter. |
| Account registration/sign-in/out | B | Demo auth is browser-local; Supabase path supports email/password. |
| Farmer listings | A | Local demo and Supabase insert paths exist; no media upload pipeline. |
| Farmer/buyer workspace | B | Quote/offer records exist; no complete order lifecycle. |
| Institutional workflow | B | Role and demand entry exist; limited separate procurement features. |
| USSD preview | A | Interactive simulation only; no live short code/gateway. |
| Pricing and pilot/contact | B | Contact is prototype-only and does not deliver an email. |
| Privacy/terms | B | Summaries only, not reviewed legal terms. |
| Supabase and RLS | B | Starter schema/policies exist; production role testing is required. |
| Payments/M-Pesa | D | Not implemented. |
| Live USSD/SMS | D | Not implemented. |
| Fleet dispatch/GPS tracking | D | Not implemented. |
| Automated grading/weighing | D | Not implemented. |
| Subscription billing/disputes/notifications | D | Not implemented. |

Class C (designed but not implemented): no such pre-existing feature was evidenced in the source files inspected; concepts that appear only in the new narrative experience are not classified as existing MVP capabilities. They remain clearly labelled simulations or future opportunities.

## Shortcomings and opportunities
- Original entry point concentrates page composition, state and dialogs in a large component.
- Demo mode is browser-local and not shared; live catalogue intentionally does not mix sample listings with real supply.
- RLS policies require adversarial tests for every role before commercial use.
- Contact/pilot forms have no delivery backend.
- USSD preview is not connected to telecom.
- Existing product photos are remote Unsplash URLs; production should use owned/licensed images or a controlled media bucket.
- Schema does not yet model verified farm identity, harvest lots, grade evidence, weigh tickets, delivery handoffs, disputes or payment settlement.
- The new procedural scene is an explanatory visualization, not a live digital twin or real-time fleet/supply map.

## New experience boundary
The new 3D experience reuses existing backend functions for product reads, account entry, farmer listings, buyer demand and quote creation. Illustrative matching quantities are labelled. Demo data remains local. The original marketplace source, backend adapter and SQL schema are retained.
