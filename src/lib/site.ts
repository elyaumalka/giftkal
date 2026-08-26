// Central place for the public site identity.
// Change these two constants if the domain ever changes again.
export const SITE_DOMAIN = "beshmachot-plus.co.il";
export const SITE_URL = `https://${SITE_DOMAIN}`;
export const SUPPORT_EMAIL = `support@${SITE_DOMAIN}`;

/**
 * Builds a public, shareable URL.
 * Uses the current origin when the app runs on a real domain, and falls back to
 * the production domain when running inside a Lovable preview/staging surface,
 * so copied links are never preview-only.
 */
export function publicUrl(path = "/"): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  if (typeof window === "undefined") return `${SITE_URL}${suffix}`;
  const host = window.location.hostname;
  const isPreview =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovableproject.com") ||
    host.endsWith(".gptengineer.run");
  return `${isPreview ? SITE_URL : window.location.origin}${suffix}`;
}
