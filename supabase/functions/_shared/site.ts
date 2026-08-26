// Central public site URL for links generated server-side.
// Override with the SITE_URL secret if the domain changes.
export const SITE_URL = (Deno.env.get('SITE_URL') ?? 'https://beshmachot-plus.co.il').replace(/\/+$/, '')
export const SITE_DOMAIN = SITE_URL.replace(/^https?:\/\//, '')
export const SUPPORT_EMAIL = `support@${SITE_DOMAIN}`
