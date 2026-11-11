# Meta measurement and page flow

Public pixel: `1670040038036599`. Public domain: `https://alphabetactivity.lovable.app`.

## Events

Browser and server share the same event name and UUID for deduplication. Supported events are PageView, ViewContent, InitiateCheckout and the custom VideoProgress event. Video progress is emitted at 25, 50, 75 and completion once per video and milestone in the page session. Only the three approved video identifiers and those four percentages are accepted by the server. Video events do not attach a purchase value.

The product gallery and price precede a permanently visible payment area. The official Hotmart Checkout Elements inline form mounts automatically after hydration, without an activation click. Public offer key `1p0sqjk3` was verified against the supplied checkout's public data. Hotmart manages the payment messages and frame height. Widget failures or a 15-second timeout select the original full checkout iframe; a noscript iframe is also available. The main CTA is a native `#checkout` anchor. Campaign parameters are selected from the router URL on server and client and passed into the widget at first mount, without replacing the form during hydration.

InitiateCheckout is emitted once when the visitor activates the checkout anchor or its optional fallback link. Simply rendering, scrolling to or loading the form does not emit InitiateCheckout or Purchase. The parent page does not inspect typing in Hotmart's cross-origin fields. Native checkout activity requires Hotmart's own configured integration. Completed purchases require independently verified order integration.

## Advertising preferences

GET `/api/advertising-policy` uses only runtime-provided Cloudflare Request.cf country/region data. It returns only a notice/consent mode, never a visitor address, identifier or location. Missing runtime geography, unknown regions, Quebec, the UK and other unlisted countries use prior consent. Australia and recognised Canadian provinces/territories other than Quebec use the notice and immediate persistent opt-out flow for the limited non-sensitive advertising events documented above. A deployment without trusted edge geography defaults to prior consent. The policy is conservative configuration, not a certification of legal compliance or a replacement for reviewing the operator's obligations and vendor retention practices.

Advertising preferences now live in a native, initially collapsed details element in the footer. No measurement strip appears above the product and no panel opens automatically or covers the page. A permanent footer disclosure explains optional Meta measurement, and the expanded controls explain shared data and provide allow/opt-out actions. Notice-region measurement starts automatically after the policy lookup without acceptance. Consent regions remain untracked until the visitor explicitly allows measurement in the footer; removing the popup does not enable automatic UK advertising tracking. This can reduce consent-region attribution, which must not be interpreted as an absence of page visits. Saved explicit consent continues to work. The policy request remains non-blocking with an eight-second timeout and a conservative fallback on failure.

A notice preference is never represented as explicit consent. The API independently verifies the same runtime policy and recorded choice. Saved opt-outs, Global Privacy Control and Do Not Track disable advertising measurement in both browser and server paths. Preferences remain accessible in the footer. UK advertising tracking continues to require prior consent; server-side forwarding is not a consent bypass.

## Private runtime configuration

`META_ACCESS_TOKEN` must be a private server runtime secret, never a VITE variable, client file, URL or Git commit. No real credential is included in this repository. Optional `META_GRAPH_API_VERSION` defaults to v25.0. The target pixel must match the public pixel above. The endpoint requires a server-capable TanStack Start deployment; a static-only deployment cannot run it.

POST `/api/meta` validates origin, same-origin page source, size, identifiers, choices and allowed events, strips URL queries, controls offer price/currency on the server and sanitises error responses. It forwards no email address, order details or fabricated identities. The token is sent to Meta only through the Authorization header. The API returns unavailable when the private runtime configuration is missing.

The owner reports configuring Cloud and the secret. The connected Lovable account cannot access this project, so hosting secret values and production event receipt have not been independently verified here. Check real browser/server events and deduplication in Meta Events Manager. Unit tests mock all outbound requests and never create purchases.

The supplied Hotmart checkout was observed showing CAD 14.90 before applicable GST after selecting Canada. The checkout controls country, taxes, refunds and final total; confirm its settings before changing the advertised offer price.

## Validation

`node --test tests/*.test.mjs`, `npx tsc --noEmit`, `npm run build`.
