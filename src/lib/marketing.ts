import { META_PIXEL_ID, OFFER } from "./offer";

type EventName = "PageView" | "ViewContent" | "InitiateCheckout";
type PixelFunction = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue: unknown[][]; loaded: boolean; version: string; push?: PixelFunction };
declare global {
  interface Window { fbq?: PixelFunction; _fbq?: PixelFunction; alphabetPixelReady?: boolean; alphabetTrackedViews?: Set<string>; }
  interface Navigator { globalPrivacyControl?: boolean; }
}
const CONSENT = "alphabet_marketing";
const cookie = (key: string) => {
  const raw = document.cookie.split("; ").find(c => c.startsWith(key + "="))?.slice(key.length + 1);
  try { return raw ? decodeURIComponent(raw) : undefined; } catch { return undefined; }
};
export function hasMarketingConsent() {
  return typeof window !== "undefined";
}
export function marketingChoice(): "allow" | "deny" | null {
  if (typeof window === "undefined") return null;
  if (navigator.globalPrivacyControl || navigator.doNotTrack === "1") return "deny";
  const value = cookie(CONSENT);
  return value === "allow" || value === "deny" ? value : null;
}
export function setMarketingConsent(allow: boolean) {
  const enabled = allow && !navigator.globalPrivacyControl && navigator.doNotTrack !== "1";
  document.cookie = `${CONSENT}=${enabled ? "allow" : "deny"}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  if (enabled) initialiseMarketing();
  else window.fbq?.("consent", "revoke");
  return enabled;
}
export function createEventId(source: Pick<Crypto, "getRandomValues"> & Partial<Pick<Crypto, "randomUUID">> = crypto) {
  if (typeof source.randomUUID === "function") return source.randomUUID();
  const bytes = source.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join("-");
}
export function initialiseMarketing() {
  try {
  if (!hasMarketingConsent()) return;
  if (!window.fbq) {
    const fn = ((...args: unknown[]) => { if (fn.callMethod) fn.callMethod(...args); else fn.queue.push(args); }) as PixelFunction;
    fn.queue = []; fn.loaded = true; fn.version = "2.0"; fn.push = fn;
    window.fbq = fn; window._fbq = fn;
    const script = document.createElement("script"); script.async = true; script.src = "https://connect.facebook.net/en_US/fbevents.js"; document.head.appendChild(script);
  }
  window.fbq("consent", "grant");
  if (!window.alphabetPixelReady) { window.fbq("init", META_PIXEL_ID); window.alphabetPixelReady = true; }
  for (const name of ["PageView", "ViewContent"] as const) {
    const key = location.pathname + ":" + name;
    window.alphabetTrackedViews ??= new Set();
    if (!window.alphabetTrackedViews.has(key)) { window.alphabetTrackedViews.add(key); trackMarketing(name); }
  }
  } catch { /* Optional measurement must not interrupt the page. */ }
}
export function trackMarketing(eventName: EventName) {
  try {
  if (!hasMarketingConsent()) return;
  const id = createEventId();
  const custom = eventName === "PageView" ? {} : { content_name: OFFER.name, content_ids: [OFFER.id], content_type: "product", value: OFFER.price, currency: OFFER.currency, num_items: 1 };
  window.fbq?.("track", eventName, custom, { eventID: id });
  void fetch("/api/meta", {
    method: "POST", credentials: "same-origin", keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_name: eventName, event_id: id, event_source_url: location.origin + location.pathname, fbp: cookie("_fbp"), fbc: cookie("_fbc") }),
  }).catch(() => { /* Measurement must never block shopping. */ });
  } catch { /* Continue shopping if browser tracking APIs are unavailable. */ }
}
