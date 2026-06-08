// Pollinations BYOP authorization endpoint.
// Note: there is no `auth.pollinations.ai` host — the real flow lives at
// `enter.pollinations.ai/authorize` and returns the temporary API key in
// the URL fragment as `api_key=...` (no `scope` / `response_type` params).
// Docs: https://github.com/pollinations/pollinations/blob/main/BRING_YOUR_OWN_POLLEN.md
const POLLINATIONS_AUTH_URL = "https://enter.pollinations.ai/authorize";

export function extractPollinationsKey(hash: string): string | null {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(fragment);
  const key = params.get("api_key");
  return key?.trim() || null;
}

export function buildPollinationsLoginUrl(appKey: string, origin: string): string {
  if (!appKey.trim() || !origin.trim()) return "";
  const authUrl = new URL(POLLINATIONS_AUTH_URL);
  authUrl.searchParams.set("client_id", appKey.trim());
  authUrl.searchParams.set("redirect_uri", new URL("/studio", origin).toString());
  // Keep this deterministic because the URL is rendered during SSR and
  // hydration. Add real nonce validation only when the callback checks it.
  authUrl.searchParams.set("state", "thumbsnare");
  return authUrl.toString();
}
