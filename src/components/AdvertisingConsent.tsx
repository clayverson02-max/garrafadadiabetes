import { useEffect, useRef, useState } from "react";
import {
  initialiseMarketing,
  marketingChoice,
  setMarketingConsent,
  startNoticeMeasurement,
  type MarketingChoice,
} from "../lib/marketing";
import type { AdvertisingPolicy } from "../lib/advertising-policy";

/** Inline footer preferences: never covers the product or opens itself. */
export function AdvertisingConsent() {
  const details = useRef<HTMLDetailsElement>(null);
  const [mode, setMode] = useState<AdvertisingPolicy["mode"] | null>(null);
  const [choice, setChoice] = useState<MarketingChoice>(null);
  useEffect(() => {
    let mounted = true;
    const current = marketingChoice();
    setChoice(current);
    const reopen = () => {
      setChoice(marketingChoice());
      if (details.current) {
        details.current.open = true;
        details.current.scrollIntoView({ block: "nearest" });
      }
    };
    window.addEventListener("alphabet-ad-preferences", reopen);
    if (current === "allow") initialiseMarketing();
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    void fetch("/api/advertising-policy", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Policy unavailable");
        const policy = (await response.json()) as AdvertisingPolicy;
        if (policy.mode !== "notice" && policy.mode !== "consent")
          throw new Error("Invalid policy");
        return policy;
      })
      .catch(() => ({ mode: "consent" as const }))
      .then((policy) => {
        window.clearTimeout(timer);
        if (!mounted) return;
        window.alphabetAdvertisingPolicy = policy;
        setMode(policy.mode);
      });
    return () => {
      mounted = false;
      controller.abort();
      window.clearTimeout(timer);
      window.removeEventListener("alphabet-ad-preferences", reopen);
    };
  }, []);
  // The footer disclosure exists before notice-region measurement can start.
  useEffect(() => {
    if (mode === "notice" && choice !== "deny" && choice !== "allow") startNoticeMeasurement();
  }, [mode, choice]);
  const choose = (enabled: boolean) => {
    const allowed = setMarketingConsent(enabled);
    setChoice(allowed ? "allow" : "deny");
  };
  return (
    <div className="ab-footer-privacy">
      <p>We use Meta for optional advertising measurement. You can manage your choice below.</p>
      <details ref={details}>
        <summary>Privacy & advertising preferences</summary>
        <p>
          Advertising measurement shares visits, checkout clicks and video views with Meta, using
          browser identifiers and connection information. Your choice does not affect access to the
          activities or checkout.
        </p>
        <p role="status">
          {choice === "deny"
            ? "Advertising measurement is off."
            : choice === "allow"
              ? "Advertising measurement is allowed."
              : mode === "notice"
                ? "Advertising measurement starts automatically in your region. You can turn it off."
                : "Advertising measurement stays off until you allow it."}
        </p>
        <div className="ab-footer-privacy-actions">
          <button type="button" onClick={() => choose(false)}>
            Turn off measurement
          </button>
          <button type="button" onClick={() => choose(true)}>
            Allow measurement
          </button>
        </div>
      </details>
    </div>
  );
}
