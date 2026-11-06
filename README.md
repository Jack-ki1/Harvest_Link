# HarvestLink — From Farm to Fair Market

A Kenyan agricultural marketplace connecting smallholder farmers and farmer groups with restaurants, retailers, caterers, hotels, supermarkets and institutional buyers.

## New immersive experience
- Ten-chapter scroll-driven agricultural world built with React Three Fiber and Three.js.
- GSAP ScrollTrigger camera progression, active chapter navigation, zoom, reset and optional manual orbit.
- Procedural farm, organized crop rows, farmer figures, produce crates, collection/sorting buildings, commercial kitchen, delivery vehicles, feature-phone prop and hotspots.
- Marketplace explorer reuses the existing product catalogue and backend adapter.
- Farmer listing, buyer demand, quote and account flows reuse the existing backend functions.
- Pricing/pilot, FAQ and contact sections.
- USSD and contact remain explicitly labelled previews where no live telecom/contact service exists.

## Requirements and run
Node.js 22.12+ and npm.
1. npm install
2. npm run dev
3. Open the Vite URL (normally http://localhost:5173).
4. npm run build for production build; npm run preview to inspect it.

## Environment
Copy .env.example to .env.local and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for shared Supabase data. Apply supabase-schema.sql first. Only the public anon/publishable key belongs in browser variables; never expose a service-role secret. Without both values, the existing backend runs in localStorage demo mode.

## Architecture
- src/harvestlink.jsx: new immersive app and story UI.
- src/harvestlink.css: responsive visual system.
- src/lib/backend.js: existing Supabase/local demo adapter.
- src/main.jsx and src/styles.css: retained original implementation source.
- supabase-schema.sql: existing database model and starter RLS policies.
- docs/PRODUCT_AUDIT.md and docs/ASSET_MANIFEST.md: audit and asset documentation.

## Honest feature boundaries
The 3D scene is a narrative illustration, not a live digital twin. Matching quantities are illustrative. Demo mode is local to the browser. USSD is a preview, not a live shortcode. No M-Pesa, payments, automated grading/weighing, fleet dispatch, GPS tracking or automatic delivery allocation is enabled. A quote request is not a confirmed order or payment. Contact preview does not send/store leads.

## Performance and accessibility
Canvas device pixel ratio is capped, the scene uses one shadow-casting directional light, native document scrolling and reduced-motion CSS. Repeated vegetation can be upgraded to InstancedMesh as scene density grows. Add low-end-device scene quality tiers, visibility culling and compressed GLB assets before expanding to a larger live digital twin. Use keyboard focus indicators and test with screen readers.

## Validation checklist
Run npm run build after npm install. Test desktop/mobile, ten chapter anchors, scrolling in both directions, zoom/reset, manual orbit, marketplace filters, auth, farmer listing and buyer demand in demo and Supabase modes. This change has not been browser-tested or deployed from this environment. Review/test Supabase RLS with farmer, buyer, institution and anonymous sessions before commercial launch.

## Vercel
Existing Vercel configuration is retained. Import the repository, configure Supabase public environment variables if needed, and deploy the Vite dist output.
