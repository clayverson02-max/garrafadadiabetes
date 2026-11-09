import { z } from "zod";
import { META_PIXEL_ID, OFFER } from "./offer";
import { advertisingPolicy } from "./advertising-policy";

const schema = z
  .object({
    event_name: z.enum(["PageView", "ViewContent", "InitiateCheckout", "VideoProgress"]),
    event_id: z.string().uuid(),
    event_source_url: z.string().url().max(2048),
    consent: z.literal(true).optional(),
    privacy_mode: z.literal("notice").optional(),
    video: z
      .object({
        video_id: z.enum(["writing-demo", "alphabet-pages-preview", "letter-formation-preview"]),
        percent: z.union([z.literal(25), z.literal(50), z.literal(75), z.literal(100)]),
      })
      .strict()
      .optional(),
    fbp: z
      .string()
      .regex(/^fb\.\d\.\d{10,16}\.\d{1,30}$/)
      .optional(),
    fbc: z
      .string()
      .regex(/^fb\.\d\.\d{10,16}\.[A-Za-z0-9_-]{1,512}$/)
      .optional(),
  })
  .strict();
type Config = { token?: string; pixelId?: string; version?: string; fetcher?: typeof fetch };
const json = (status: number, body: Record<string, unknown>) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
async function limitedBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("empty");
  const decoder = new TextDecoder();
  let text = "";
  let size = 0;
  for (;;) {
    const next = await reader.read();
    if (next.done) break;
    size += next.value.byteLength;
    if (size > 8192) {
      await reader.cancel();
      throw new Error("large");
    }
    text += decoder.decode(next.value, { stream: true });
  }
  return JSON.parse(text + decoder.decode());
}
export async function handleMetaRequest(request: Request, config: Config = {}) {
  if (request.method !== "POST") return json(405, { ok: false });
  const own = new URL(request.url).origin;
  if (
    request.headers.get("origin") !== own ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return json(403, { ok: false });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return json(415, { ok: false });
  let data: z.infer<typeof schema>;
  try {
    data = schema.parse(await limitedBody(request));
  } catch {
    return json(400, { ok: false });
  }
  const source = new URL(data.event_source_url);
  if (source.origin !== own) return json(403, { ok: false });
  const cookie = request.headers.get("cookie") ?? "";
  const allowed = /(?:^|;\s*)alphabet_marketing=allow(?:;|$)/.test(cookie) && data.consent === true;
  const notice =
    /(?:^|;\s*)alphabet_marketing=notice(?:;|$)/.test(cookie) &&
    data.privacy_mode === "notice" &&
    advertisingPolicy(request).mode === "notice";
  if (
    request.headers.get("sec-gpc") === "1" ||
    request.headers.get("dnt") === "1" ||
    /(?:^|;\s*)alphabet_marketing=deny(?:;|$)/.test(cookie) ||
    (!allowed && !notice)
  )
    return json(403, { ok: false });
  if ((data.event_name === "VideoProgress") !== Boolean(data.video))
    return json(400, { ok: false });
  const token = config.token ?? process.env.META_ACCESS_TOKEN;
  const pixelId = config.pixelId ?? META_PIXEL_ID;
  const version = config.version ?? process.env.META_GRAPH_API_VERSION ?? "v25.0";
  if (!token || pixelId !== META_PIXEL_ID || !/^v\d+\.0$/.test(version))
    return json(503, { ok: false, code: "tracking_unavailable" });
  const agent = request.headers.get("user-agent") ?? "";
  // Only single-address proxy headers are used; no invented hashes or identities.
  const address =
    request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? undefined;
  const ip = address && /^[a-fA-F0-9:.]{3,45}$/.test(address) ? address : undefined;
  if (!data.fbp && !data.fbc && !ip)
    return json(202, { ok: false, code: "insufficient_matching_data" });
  const user = {
    ...(data.fbp ? { fbp: data.fbp } : {}),
    ...(data.fbc ? { fbc: data.fbc } : {}),
    ...(ip ? { client_ip_address: ip } : {}),
    ...(agent ? { client_user_agent: agent } : {}),
  };
  const event = {
    event_name: data.event_name,
    event_id: data.event_id,
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    event_source_url: source.origin + source.pathname,
    user_data: user,
    ...(data.event_name === "VideoProgress"
      ? { custom_data: { content_name: OFFER.name, ...data.video } }
      : data.event_name !== "PageView"
        ? {
            custom_data: {
              content_name: OFFER.name,
              content_ids: [OFFER.id],
              content_type: "product",
              currency: OFFER.currency,
              value: OFFER.price,
              num_items: 1,
            },
          }
        : {}),
  };
  try {
    const result = await (config.fetcher ?? fetch)(
      `https://graph.facebook.com/${version}/${META_PIXEL_ID}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ data: [event] }),
        signal: AbortSignal.timeout(4500),
      },
    );
    if (!result.ok) return json(502, { ok: false });
    const response = (await result.json()) as { events_received?: number };
    return response.events_received === 1 ? json(200, { ok: true }) : json(502, { ok: false });
  } catch {
    return json(502, { ok: false });
  }
}
