# HarvestLink — Kenyan produce marketplace MVP

A responsive React + Vite marketplace concept for connecting Kenyan smallholder farmers with restaurants, retailers, caterers and institutional buyers. Designed for deployment on Vercel.

## What works now

- Responsive landing page and marketplace layout.
- Search produce by name, category, description or location; filter by category and sort listings.
- Product cards, request list/cart, quote-request form and order reference.
- Buyer-demand board: authenticated buyers can publish specific needs; farmers can submit available quantities and proposed unit prices.
- A workspace for quote requests, farmer listings and submitted supply offers.
- Farmer, buyer and institution account entry points.
- Demo account creation/sign-in and a simple workspace for quote requests.
- Farmers can add local demo listings; listing availability and quote terms are made explicit.
- Interactive USSD menu preview.
- Pricing, workflow, pilot-interest and contact flows.
- Consent-aware visual demo labels and no fake payment confirmation.

## Modes and important limits

### Demo mode (default)

Without environment variables, the app works immediately. Accounts, listings and quote requests use `localStorage` in the current browser only. This is ideal for checking the user experience, but it is **not shared data** and is not suitable for real customer transactions. Resetting browser storage removes demo data.

### Supabase-connected mode

A Supabase project is needed for real sign-in and shared products, buyer demand, farmer offers and quote records. Apply `supabase-schema.sql` to the project's SQL Editor, enable email/password auth, and configure the environment variables below. RLS policies are included as a starting point and must be reviewed and tested before a commercial launch.

Create `.env.local` from `.env.example`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Use the **publishable/anon key only** in the browser. Never expose a service-role secret in a Vite `VITE_` variable. In Vercel, add both variables under **Project → Settings → Environment Variables**, then redeploy.

Supabase note: email confirmation may be enabled by default. The app will ask users to confirm email before signing in if the project requires it. The starter schema supports active produce listings, buyer-demand posts, farmer supply offers and quote requests. In connected mode, the produce catalogue starts empty until real farmer listings are added; demo sample listings are not mixed into live data. Subscription billing, payment execution, status notifications, logistics allocation and full dispute management remain separate launch increments, not enabled by this MVP.

## Run locally

Requires Node.js 22.12+ and npm (matches the project engine setting).

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). To test a production build:

```bash
npm run build
npm run preview
```

## Deploy to Vercel

### Easiest: GitHub import

1. Extract this project folder and push its contents to a new GitHub repository.
2. In Vercel, choose **Add New → Project**, import that repository and accept the Vite settings.
3. For demo mode, no environment variables are required. For multi-user data, configure Supabase first and add the environment variables above.
4. Deploy. Vercel will run `npm install` and `npm run build`, then serve the `dist` folder.

### Vercel CLI

```bash
npm install
npm run build
npx vercel
```

Follow the CLI prompts to link or create a Vercel project. Run `npx vercel --prod` when ready for production.

## Content and images

Product images are referenced from Unsplash. A production version should use licensed/owned farm photography and store image assets in a controlled media bucket. Sample produce listings and pilot pricing are illustrative; confirm suppliers, regions, quality definitions and prices before launch.

## Before a real commercial launch

- Test all database policies with farmer, buyer, institutional and unauthenticated users.
- Add buyer demand posts so farmers can respond to buyer requests at scale.
- Add subscriptions and billing through a selected payment provider; this project does not charge users.
- Implement live SMS/USSD through a mobile network/value-added service provider and use the assigned short code; the displayed menu is a preview only.
- Add terms, privacy policy, customer-support ownership, order dispute handling, data retention and operational procedures.
- Verify fulfilment, weight/grade recording, transport responsibilities, payment deadlines and any applicable Kenyan business, tax and data-protection requirements with qualified advisers.
# Harvest_Link
# Harvest_Link
