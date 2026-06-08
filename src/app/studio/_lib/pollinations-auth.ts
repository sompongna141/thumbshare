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
  // `state` is optional but recommended by the Pollinations docs for CSRF
  // protection. The hash callback already echoes it back; we currently
  // don't enforce it, but passing a unique value per click is harmless
  // and future-proofs the integration.
  authUrl.searchParams.set("state", `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
  return authUrl.toString();
}
