import { useEffect } from "react";
import { initialiseMarketing } from "../lib/marketing";

// Tracking starts automatically when the visitor opens the page.
export function AdvertisingConsent() {
  useEffect(() => { initialiseMarketing(); }, []);
  return null;
}
