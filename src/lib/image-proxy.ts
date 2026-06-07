const ALLOWED_IMAGE_HOST = "gen.pollinations.ai";
const IMAGE_PATH_PREFIX = "/image/prompt/";
const MAX_URL_LENGTH = 10_000;

export function parseAllowedImageUrl(value: unknown): URL | null {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_URL_LENGTH) {
    return null;
  }

  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname !== ALLOWED_IMAGE_HOST ||
      url.port ||
      url.username ||
      url.password ||
      !url.pathname.startsWith(IMAGE_PATH_PREFIX)
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}
