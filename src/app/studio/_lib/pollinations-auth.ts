const POLLINATIONS_AUTH_URL = "https://auth.pollinations.ai/auth";

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
  authUrl.searchParams.set("scope", "api_key");
  authUrl.searchParams.set("response_type", "token");
  return authUrl.toString();
}
