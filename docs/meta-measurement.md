# Meta measurement and page flow

Public pixel: `1670040038036599`. Public domain: `https://alphabetactivity.lovable.app`.

## Events

Browser and server share the same event name and UUID for deduplication. Supported events are PageView, ViewContent, InitiateCheckout and the custom VideoProgress event. Video progress is emitted at 25, 50, 75 and completion once per video and milestone in the page session. Only the three approved video identifiers and those four percentages are accepted by the server. Video events do not attach a purchase value.

InitiateCheckout is emitted only when the visitor activates the offer's actual checkout action. Links elsewhere in the page point to the offer rather than directly to payment. The first three sections contain no action buttons. Interactive product previews and the first offer link begin in section four. The offer link retains a native payment URL so a visitor can still proceed if client JavaScript has not hydrated; after hydration it opens the embedded checkout. No purchase is reported from a click, video view or iframe load. Completed purchases require independently verified Hotmart order integration.

## Advertising preferences

GET `/api/advertising-policy` uses only runtime-provided Cloudflare Request.cf country/region data. It returns only a notice/consent mode, never a visitor address, identifier or location. Missing runtime geography, unknown regions, Quebec, the UK and other unlisted countries use prior consent. Australia and recognised Canadian provinces/territories other than Quebec use the notice and immediate persistent opt-out flow for the limited non-sensitive advertising events documented above. A deployment without trusted edge geography defaults to prior consent. The policy is conservative configuration, not a certification of legal compliance or a replacement for reviewing the operator's obligations and vendor retention practices.

The notice is displayed before automatic events are enabled. A notice preference is never represented as explicit consent. The API independently verifies the same runtime policy and recorded choice. Saved opt-outs, Global Privacy Control and Do Not Track disable advertising measurement in both browser and server paths. Preferences remain accessible in the footer. UK advertising tracking continues to require prior consent; server-side forwarding is not a consent bypass.

## Private runtime configuration

`META_ACCESS_TOKEN` must be a private server runtime secret, never a VITE variable, client file, URL or Git commit. No real credential is included in this repository. Optional `META_GRAPH_API_VERSION` defaults to v25.0. The target pixel must match the public pixel above. The endpoint requires a server-capable TanStack Start deployment; a static-only deployment cannot run it.

POST `/api/meta` validates origin, same-origin page source, size, identifiers, choices and allowed events, strips URL queries, controls offer price/currency on the server and sanitises error responses. It forwards no email address, order details or fabricated identities. The token is sent to Meta only through the Authorization header. The API returns unavailable when the private runtime configuration is missing.

The owner reports configuring Cloud and the secret. The connected Lovable account cannot access this project, so hosting secret values and production event receipt have not been independently verified here. Check real browser/server events and deduplication in Meta Events Manager. Unit tests mock all outbound requests and never create purchases.

The supplied Hotmart checkout was observed showing CAD 14.90 before applicable GST after selecting Canada. The checkout controls country, taxes, refunds and final total; confirm its settings before changing the advertised offer price.

## Validation

`node --test tests/meta-capi.test.mjs`, `npx tsc --noEmit`, `npm run build`.
