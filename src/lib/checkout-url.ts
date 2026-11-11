import { OFFER } from "./offer";

/** Forward only campaign attribution, never arbitrary customer data. */
export function checkoutUrlForSearch(search: string): string {
  const url = new URL(OFFER.checkoutUrl);
  new URLSearchParams(search).forEach((value, key) => {
    if (
      /^utm_(source|medium|campaign|content|term|id)$/.test(key) ||
      ["src", "sck", "fbclid"].includes(key)
    ) {
      url.searchParams.set(key, value);
    }
  });
  return url.href;
}
