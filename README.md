# Alphabet Activity Bundle

Canadian English storefront for printable letter tracing, writing, colouring and puzzle activities.

## Develop and verify

```sh
npm install
npm run dev
npx tsc --noEmit
npm run build
node --test tests/*.test.mjs
```

## Offer and checkout

The single-product storefront opens with real product photos, a selectable video preview, product details, the CAD price and a purchase action. Desktop uses two columns; mobile places the gallery above the product information. Interactive activity previews, three locally hosted videos, sample enlargements and FAQ explain the product. Every sales action outside the offer links to `#offer`. The payment area is directly below the product and automatically mounts the official Hotmart Checkout Elements inline form after hydration. The purchase action scrolls to the form. A direct iframe is used if the widget fails or times out; a noscript iframe supports browsers without JavaScript. The external checkout link is an optional troubleshooting fallback. Campaign parameters come from the router URL on the server and client, avoiding a hydration reset. No timed coupon popup or hidden price gate interrupts reading.

Offer settings are in `src/lib/offer.ts`. The configured CAD 35 reference value is not displayed as a previous selling price. The launch price is CAD 14.90 and is visible in the offer without a coupon code. The supplied Hotmart checkout was observed showing that base price for Canada before GST. Hotmart controls final totals, taxes, access and refund terms.

UTMify loads once using the owner-supplied configuration. Recognised campaign parameters are passed into the embedded checkout. Privacy controls are contained in the footer, without automatic banners or overlays. Automatic notice-region measurement and explicit consent-region measurement are retained. Advertising policy, opt-out choices, regional consent and server CAPI configuration are described in `docs/meta-measurement.md`. No Purchase event is inferred from a click or iframe load.

## Branding and publication

Page title, description, favicon, touch icon and social preview artwork are configured in `src/routes/__root.tsx` and `public/alphabet/`. The public Lovable subdomain is a hosting setting; editing this repository does not rename it. The connected project is `3d3072d7-9ecf-421e-b096-e2e1293daab4`. The current published address is `https://alphabetactivity.lovable.app`. The canonical and social image URLs now use `https://alphabetactivity.lovable.app`.

The uploaded feedback screenshots mention multiplication and maths resources, so they are not displayed as testimonials for this alphabet bundle. Actual sample pages remain visible as product evidence.

Never commit API access tokens or other secrets. Configure server-only secrets in the hosting environment. Previously committed credentials should be revoked because removing current source files does not erase Git history.
