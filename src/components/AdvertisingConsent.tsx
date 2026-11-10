import { useEffect, useState } from "react";
import {
  initialiseMarketing,
  marketingChoice,
  setMarketingConsent,
  startNoticeMeasurement,
  type MarketingChoice,
} from "../lib/marketing";
import type { AdvertisingPolicy } from "../lib/advertising-policy";

export function AdvertisingConsent() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AdvertisingPolicy["mode"] | null>(null);
  const [choice, setChoice] = useState<MarketingChoice>(null);
  useEffect(() => {
    let mounted = true;
    const current = marketingChoice();
    setChoice(current);
    const reopen = () => {
      setChoice(marketingChoice());
      setOpen(true);
    };
    window.addEventListener("alphabet-ad-preferences", reopen);
    if (current === "allow") initialiseMarketing();
    const controller = new AbortController();
    // Policy lookup never blocks shopping; allow time for a server cold start.
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
        if (current !== "allow" && current !== "deny") setOpen(policy.mode === "consent");
      });
    return () => {
      mounted = false;
      controller.abort();
      window.clearTimeout(timer);
      window.removeEventListener("alphabet-ad-preferences", reopen);
    };
  }, []);
  // The inline notice renders before this effect starts automatic measurement.
  useEffect(() => {
    if (mode === "notice" && choice !== "deny" && choice !== "allow") startNoticeMeasurement();
  }, [mode, choice]);
  const choose = (enabled: boolean) => {
    const allowed = setMarketingConsent(enabled);
    setChoice(allowed ? "allow" : "deny");
    setOpen(false);
  };
  return (
    <>
      {mode === "notice" && (
        <aside className="ab-measurement-notice" aria-label="Advertising measurement notice">
          <p>
            {choice === "deny"
              ? "Advertising measurement is off."
              : "We use Meta to measure visits, checkout clicks and video views."}
          </p>
          <div>
            {choice !== "deny" && (
              <button type="button" onClick={() => choose(false)}>
                Turn off measurement
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setChoice(marketingChoice());
                setOpen(true);
              }}
            >
              {choice === "deny" ? "Preferences" : "Details"}
            </button>
          </div>
        </aside>
      )}
      {open && (
        <section className="ab-privacy" aria-label="Privacy and advertising preferences">
          <h2>Privacy & advertising</h2>
          <p>
            {mode === "notice" && choice !== "deny"
              ? "We use Meta to measure visits, checkout clicks and video viewing, using browser identifiers and connection information. You can turn this off below or in the footer."
              : "With your permission, we share visits, checkout clicks, video viewing, browser identifiers and connection information with Meta to measure our advertising. Your choice does not affect access to this page."}
          </p>
          <div className="ab-privacy-actions">
            <button onClick={() => choose(false)}>Turn off advertising measurement</button>
            {mode === "notice" && choice !== "deny" ? (
              <button
                onClick={() => {
                  setChoice(marketingChoice());
                  setOpen(false);
                }}
              >
                Close notice
              </button>
            ) : (
              <button onClick={() => choose(true)}>Allow advertising measurement</button>
            )}
          </div>
        </section>
      )}
    </>
  );
}
