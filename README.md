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

The landing page presents the benefit, teaching workflow and deliverables before the first offer action in section four. Interactive activity previews, three locally hosted videos, sample enlargements and FAQ explain the product. Every sales action outside the offer links to `#offer`. Only the offer's checkout action mounts Hotmart; its native link also works before JavaScript hydration. No timed coupon popup or hidden price gate interrupts reading.

Offer settings are in `src/lib/offer.ts`. CAD 35 is labelled as a bundle reference value, not a historical selling price. The launch price is CAD 14.90 and is visible in the offer without a coupon code. The supplied Hotmart checkout was observed showing that base price for Canada before GST. Hotmart controls final totals, taxes, access and refund terms.

UTMify loads once using the owner-supplied configuration. Recognised campaign parameters are passed into the embedded checkout. Advertising policy, opt-out choices, regional consent and server CAPI configuration are described in `docs/meta-measurement.md`. No Purchase event is inferred from a click or iframe load.

## Branding and publication

Page title, description, favicon, touch icon and social preview artwork are configured in `src/routes/__root.tsx` and `public/alphabet/`. The public Lovable subdomain is a hosting setting; editing this repository does not rename it. The connected project is `3d3072d7-9ecf-421e-b096-e2e1293daab4`. The current published address is `https://alphabetactivity.lovable.app`. The canonical and social image URLs now use `https://alphabetactivity.lovable.app`.

The uploaded feedback screenshots mention multiplication and maths resources, so they are not displayed as testimonials for this alphabet bundle. Actual sample pages remain visible as product evidence.

Never commit API access tokens or other secrets. Configure server-only secrets in the hosting environment. Previously committed credentials should be revoked because removing current source files does not erase Git history.
