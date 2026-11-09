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
  const [mode, setMode] = useState<AdvertisingPolicy["mode"]>("consent");
  const [choice, setChoice] = useState<MarketingChoice>(null);
  useEffect(() => {
    let mounted = true;
    const current = marketingChoice();
    setChoice(current);
    const reopen = () => setOpen(true);
    window.addEventListener("alphabet-ad-preferences", reopen);
    if (current === "allow") initialiseMarketing();
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2500);
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
        if (!mounted) return;
        window.alphabetAdvertisingPolicy = policy;
        setMode(policy.mode);
        if (current !== "allow" && current !== "deny")
          setOpen(policy.mode === "consent" || current !== "notice");
        if (current === "notice" && policy.mode === "notice") startNoticeMeasurement();
      });
    return () => {
      mounted = false;
      controller.abort();
      window.clearTimeout(timer);
      window.removeEventListener("alphabet-ad-preferences", reopen);
    };
  }, []);
  // For notice regions, render the notice before starting measurement.
  useEffect(() => {
    if (mode === "notice" && open && choice !== "deny" && choice !== "allow")
      startNoticeMeasurement();
  }, [mode, open, choice]);
  if (!open) return null;
  const choose = (enabled: boolean) => {
    const allowed = setMarketingConsent(enabled);
    setChoice(allowed ? "allow" : "deny");
    setOpen(false);
  };
  return (
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
  );
}
