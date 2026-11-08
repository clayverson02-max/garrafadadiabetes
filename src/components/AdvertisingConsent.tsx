import { useEffect, useState } from "react";
import { initialiseMarketing, marketingChoice, setMarketingConsent } from "../lib/marketing";

export function AdvertisingConsent() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(marketingChoice() === null);
    initialiseMarketing();
    const reopen = () => setOpen(true);
    window.addEventListener("alphabet-ad-preferences", reopen);
    return () => window.removeEventListener("alphabet-ad-preferences", reopen);
  }, []);
  if (!open) return null;
  const choose = (allow: boolean) => { setMarketingConsent(allow); setOpen(false); };
  return <section className="ab-consent" aria-label="Advertising preferences"><div><strong>Optional advertising measurement</strong><p>With your permission, we share visits and checkout clicks with Meta, along with browser identifiers and connection information, to measure our ads. You can change your choice in the footer.</p></div><div className="ab-consent-actions"><button onClick={() => choose(false)}>No thanks</button><button onClick={() => choose(true)}>Allow measurement</button></div></section>;
}
