import { useEffect, useRef, useState } from "react";
import { OFFER } from "../lib/offer";

type CheckoutElements = {
  init: (
    type: "inlineCheckout",
    options: {
      offer: string;
      locale: string;
      visibilityOptions: Record<string, string>;
      prefilledInfo: Record<string, string>;
      onLoad: () => void;
    },
  ) => { mount: (element: HTMLElement) => void };
};
declare global {
  interface Window {
    checkoutElements?: CheckoutElements;
  }
}
let sdkPromise: Promise<CheckoutElements> | null = null;
function loadCheckoutElements(): Promise<CheckoutElements> {
  if (window.checkoutElements) return Promise.resolve(window.checkoutElements);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.hotmart.com/lib/hotmart-checkout-elements.js";
    script.async = true;
    script.onload = () => {
      if (window.checkoutElements) resolve(window.checkoutElements);
      else {
        sdkPromise = null;
        script.remove();
        reject(new Error("Checkout unavailable"));
      }
    };
    script.onerror = () => {
      sdkPromise = null;
      script.remove();
      reject(new Error("Checkout unavailable"));
    };
    document.head.appendChild(script);
  });
  return sdkPromise;
}

/** Hotmart owns the payment fields; the storefront never receives card details. */
export function HotmartInlineCheckout({ checkoutUrl }: { checkoutUrl: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "fallback">("loading");
  useEffect(() => {
    let active = true;
    let expired = false;
    const container = host.current;
    setState("loading");
    const fallback = () => {
      if (!active) return;
      expired = true;
      container?.replaceChildren();
      setState("fallback");
    };
    const timer = window.setTimeout(fallback, 15000);
    const parameters = new URL(checkoutUrl).searchParams;
    const visibilityOptions: Record<string, string> = {};
    parameters.forEach((value, key) => {
      if (
        /^utm_(source|medium|campaign|content|term|id)$/.test(key) ||
        ["src", "fbclid"].includes(key)
      )
        visibilityOptions[key] = value;
    });
    void loadCheckoutElements()
      .then((sdk) => {
        if (!active || expired || !container) return;
        const element = sdk.init("inlineCheckout", {
          offer: OFFER.checkoutOfferCode,
          locale: "en",
          visibilityOptions,
          prefilledInfo: parameters.has("sck") ? { sck: parameters.get("sck")! } : {},
          onLoad: () => {
            if (!active || expired) return;
            window.clearTimeout(timer);
            setState("ready");
            const frame = container.querySelector("iframe");
            if (frame) {
              frame.title = "Secure Hotmart checkout";
              frame.referrerPolicy = "strict-origin-when-cross-origin";
            }
          },
        });
        element.mount(container);
        const frame = container.querySelector("iframe");
        if (frame) frame.title = "Secure Hotmart checkout";
      })
      .catch(() => {
        window.clearTimeout(timer);
        fallback();
      });
    return () => {
      active = false;
      window.clearTimeout(timer);
      container?.replaceChildren();
    };
  }, [checkoutUrl]);
  return (
    <div className="ab-inline-checkout">
      {state === "loading" && <p role="status">Loading your secure payment form…</p>}
      <div
        ref={host}
        className="ab-inline-checkout-host"
        hidden={state === "fallback"}
        aria-busy={state === "loading"}
      />
      {state === "fallback" && (
        <iframe
          className="ab-checkout-fallback"
          title="Secure Hotmart checkout"
          src={checkoutUrl}
          allow="payment *; clipboard-write"
          referrerPolicy="strict-origin-when-cross-origin"
          width="100%"
          height="1180"
        />
      )}
      <noscript>
        <iframe
          className="ab-checkout-fallback"
          title="Secure Hotmart checkout without JavaScript"
          src={checkoutUrl}
          allow="payment *; clipboard-write"
          width="100%"
          height="1180"
        />
      </noscript>
    </div>
  );
}
