# Meta measurement setup

Public pixel: `1670040038036599`.

The browser sends PageView and ViewContent after the visitor allows advertising measurement. InitiateCheckout is sent only when the real Hotmart checkout link is clicked. Browser and server use the same event name and ID for deduplication. A purchase is not reported from a button click.

The access token must be configured as a private server runtime secret named `META_ACCESS_TOKEN`. Do not put it in Git, page HTML, client JavaScript, a VITE_ variable, a frontend setting, a URL or a screenshot. No real token is included in this repository. `META_PIXEL_ID` must match the public pixel. `META_GRAPH_API_VERSION` defaults to the supported version `v25.0`.

The server endpoint is `POST /api/meta`. It verifies origin, visitor consent, payload size, event names and IDs. It sets the product price and currency from `src/lib/offer.ts`. It does not accept arbitrary purchase claims, email addresses or order details from the browser, and does not expose Meta diagnostics or secrets in its responses. Tokens travel to Meta only in the Authorization header.

The server requires the production host to support TanStack Start server routes and private runtime environment variables. A static-only host cannot run this API. The current connected Lovable account cannot find the project referenced by this repository, and the connected Supabase account does not own its existing project. Consequently no Cloud activation, secret installation or live CAPI verification has been completed. The API fails closed until the private secret is configured in the correct production server runtime.

Before enabling live traffic, configure the new Hotmart payment link in `src/lib/offer.ts`, set the private runtime secret through the host's secure settings, and verify browser/server events and deduplication with Meta Events Manager's Test Events. This code has no Hotmart purchase webhook and does not claim to measure completed sales.

Advertising measurement is optional and respects the saved choice, Global Privacy Control and Do Not Track. A preferences control remains in the footer. An unconditional noscript tracking image is intentionally not included, because it would send an event without the visitor's advertising choice.

Validation: `node --test tests/meta-capi.test.mjs`, `npx tsc --noEmit`, `npm run build`. Tests mock all outbound requests and never send artificial purchases or use real credentials.
