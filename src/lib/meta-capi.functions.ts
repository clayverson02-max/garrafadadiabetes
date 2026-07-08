import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  event_name: z.string().min(1),
  event_id: z.string().min(1),
  event_source_url: z.string().url().optional(),
  custom_data: z.record(z.any()).optional(),
  user_data: z
    .object({
      client_user_agent: z.string().optional(),
      fbp: z.string().optional(),
      fbc: z.string().optional(),
    })
    .optional(),
});

async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text.trim().toLowerCase());
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const sendMetaEvent = createServerFn({ method: "POST" })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;
    if (!pixelId || !accessToken) {
      return { ok: false, error: "missing_credentials" };
    }

    const ipHash = data.user_data?.client_user_agent
      ? await sha256(data.user_data.client_user_agent)
      : undefined;

    const payload = {
      data: [
        {
          event_name: data.event_name,
          event_time: Math.floor(Date.now() / 1000),
          event_id: data.event_id,
          action_source: "website",
          event_source_url: data.event_source_url,
          user_data: {
            client_user_agent: data.user_data?.client_user_agent,
            fbp: data.user_data?.fbp,
            fbc: data.user_data?.fbc,
            ...(ipHash ? { external_id: ipHash } : {}),
          },
          custom_data: data.custom_data ?? {},
        },
      ],
    };

    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      return { ok: res.ok, status: res.status, response: json };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });