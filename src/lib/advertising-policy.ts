export type AdvertisingPolicy = { mode: "notice" | "consent" };

// Only runtime-provided edge geolocation is trusted. Visitor-supplied headers
// never enable advertising. Missing geography uses prior consent.
export function advertisingPolicy(request: Request): AdvertisingPolicy {
  const geo = (request as Request & { cf?: { country?: string; regionCode?: string } }).cf;
  const country = geo?.country?.toUpperCase();
  const region = geo?.regionCode?.toUpperCase();
  const canadianNoticeRegions = new Set([
    "AB",
    "BC",
    "MB",
    "NB",
    "NL",
    "NS",
    "NT",
    "NU",
    "ON",
    "PE",
    "SK",
    "YT",
  ]);
  if (country === "AU" || (country === "CA" && region && canadianNoticeRegions.has(region)))
    return { mode: "notice" };
  return { mode: "consent" };
}
