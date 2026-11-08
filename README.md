# Alphabet Activity Bundle

Canadian English storefront for printable letter tracing, writing, colouring and puzzle activities.

## Develop and verify

```sh
npm install
npm run dev
npx tsc --noEmit
npm run build
node --test tests/meta-capi.test.mjs
```

## Offer and checkout

Offer settings are in `src/lib/offer.ts`. The launch offer appears after two seconds and remembers activation for the current browser session. CAD 35 is labelled as a bundle reference value, not a historical selling price. Activation changes the displayed price to CAD 14.90; it does not create a Hotmart coupon or change Hotmart pricing.

The supplied Hotmart checkout is embedded after activation, with an external fallback. The final price, taxes and refund terms are controlled by Hotmart. Confirm that its currency and price match the storefront before sending paid traffic. No payment has been submitted during verification.

UTMify loads once, using the configuration supplied by the owner. Recognised campaign parameters are carried into the embedded checkout. Browser marketing consent and server CAPI configuration are described in `docs/meta-measurement.md`.

## Branding and publication

Page title, description, favicon, touch icon and social preview artwork are configured in `src/routes/__root.tsx` and `public/alphabet/`. The public Lovable subdomain is a hosting setting; editing this repository does not rename it. The connected project is `3d3072d7-9ecf-421e-b096-e2e1293daab4`. Use that project's hosting settings to choose an available education-related address. Set `VITE_PUBLIC_SITE_URL` to that final address so canonical and social image URLs use the correct public domain.

The uploaded feedback screenshots mention multiplication and maths resources, so they are not displayed as testimonials for this alphabet bundle. Actual sample pages remain visible as product evidence.

Never commit API access tokens or other secrets. Configure server-only secrets in the hosting environment. Previously committed credentials should be revoked because removing current source files does not erase Git history.
