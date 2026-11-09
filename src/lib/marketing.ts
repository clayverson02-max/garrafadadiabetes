import { META_PIXEL_ID, OFFER } from "./offer";
import type { AdvertisingPolicy } from "./advertising-policy";

type EventName = "PageView" | "ViewContent" | "InitiateCheckout" | "VideoProgress";
type VideoData = {
  video_id: "writing-demo" | "alphabet-pages-preview" | "letter-formation-preview";
  percent: 25 | 50 | 75 | 100;
};
type PixelFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded: boolean;
  version: string;
  push?: PixelFunction;
};
export type MarketingChoice = "allow" | "deny" | "notice" | null;
declare global {
  interface Window {
    fbq?: PixelFunction;
    _fbq?: PixelFunction;
    alphabetPixelReady?: boolean;
    alphabetTrackedViews?: Set<string>;
    alphabetAdvertisingPolicy?: AdvertisingPolicy;
  }
  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}
const CONSENT = "alphabet_marketing";
const cookie = (key: string) => {
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith(key + "="))
    ?.slice(key.length + 1);
  try {
    return raw ? decodeURIComponent(raw) : undefined;
  } catch {
    return undefined;
  }
};
export function marketingChoice(): MarketingChoice {
  if (typeof window === "undefined") return null;
  if (navigator.globalPrivacyControl || navigator.doNotTrack === "1") return "deny";
  const value = cookie(CONSENT);
  return value === "allow" || value === "deny" || value === "notice" ? value : null;
}
export function hasMarketingPermission() {
  const choice = marketingChoice();
  return (
    choice === "allow" ||
    (choice === "notice" && window.alphabetAdvertisingPolicy?.mode === "notice")
  );
}
function saveChoice(value: "allow" | "deny" | "notice") {
  document.cookie =
    CONSENT +
    "=" +
    value +
    "; Path=/; Max-Age=15552000; SameSite=Lax" +
    (location.protocol === "https:" ? "; Secure" : "");
}
export function setMarketingConsent(allow: boolean) {
  const enabled = allow && !navigator.globalPrivacyControl && navigator.doNotTrack !== "1";
  saveChoice(enabled ? "allow" : "deny");
  if (enabled) {
    window.fbq?.("consent", "grant");
    initialiseMarketing();
  } else {
    window.fbq?.("consent", "revoke");
    window.alphabetTrackedViews?.clear();
  }
  return enabled;
}
export function startNoticeMeasurement() {
  if (marketingChoice() === "deny" || window.alphabetAdvertisingPolicy?.mode !== "notice") return;
  if (marketingChoice() !== "allow") saveChoice("notice");
  initialiseMarketing();
}
export function createEventId(
  source: Pick<Crypto, "getRandomValues"> & Partial<Pick<Crypto, "randomUUID">> = crypto,
) {
  if (typeof source.randomUUID === "function") return source.randomUUID();
  const bytes = source.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}
export function initialiseMarketing() {
  try {
    if (!hasMarketingPermission()) return;
    if (!window.fbq) {
      const fn = ((...args: unknown[]) => {
        if (fn.callMethod) fn.callMethod(...args);
        else fn.queue.push(args);
      }) as PixelFunction;
      fn.queue = [];
      fn.loaded = true;
      fn.version = "2.0";
      fn.push = fn;
      window.fbq = fn;
      window._fbq = fn;
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(script);
    }
    if (marketingChoice() === "allow") window.fbq("consent", "grant");
    if (!window.alphabetPixelReady) {
      window.fbq("init", META_PIXEL_ID);
      window.alphabetPixelReady = true;
    }
    for (const name of ["PageView", "ViewContent"] as const) {
      const key = location.pathname + ":" + name;
      window.alphabetTrackedViews ??= new Set();
      if (!window.alphabetTrackedViews.has(key)) {
        window.alphabetTrackedViews.add(key);
        trackMarketing(name);
      }
    }
  } catch {
    /* Optional measurement must not interrupt the page. */
  }
}
export function trackMarketing(eventName: EventName, video?: VideoData) {
  try {
    if (!hasMarketingPermission() || (eventName === "VideoProgress" && !video)) return;
    const id = createEventId();
    const custom =
      eventName === "PageView"
        ? {}
        : eventName === "VideoProgress"
          ? { content_name: OFFER.name, ...video }
          : {
              content_name: OFFER.name,
              content_ids: [OFFER.id],
              content_type: "product",
              value: OFFER.price,
              currency: OFFER.currency,
              num_items: 1,
            };
    window.fbq?.(eventName === "VideoProgress" ? "trackCustom" : "track", eventName, custom, {
      eventID: id,
    });
    const explicit = marketingChoice() === "allow";
    void fetch("/api/meta", {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: eventName,
        event_id: id,
        event_source_url: location.origin + location.pathname,
        ...(explicit ? { consent: true } : { privacy_mode: "notice" }),
        ...(video ? { video } : {}),
        fbp: cookie("_fbp"),
        fbc: cookie("_fbc"),
      }),
    }).catch(() => {
      /* Measurement must never block shopping. */
    });
  } catch {
    /* Continue shopping if browser tracking APIs are unavailable. */
  }
}
