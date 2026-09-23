import "server-only";

const API_VERSION = "2025-01";

/**
 * Fetches a shop's real storefront domain (custom domain if connected,
 * otherwise falls back to the myshopify.com domain) via the Admin GraphQL API.
 */
export async function fetchShopPrimaryDomain(
  shopDomain: string,
  accessToken: string,
): Promise<string | null> {
  const res = await fetch(`https://${shopDomain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query: `{ shop { primaryDomain { host } } }` }),
  });

  if (!res.ok) return null;

  const json = await res.json();
  const host: string | undefined = json?.data?.shop?.primaryDomain?.host;
  return host ?? null;
}
