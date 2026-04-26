import type { Request } from "express";

/**
 * Compute the canonical public URL of the deployed app for use in
 * outbound links (welcome / broadcast emails, OG tags, sitemaps, etc).
 *
 * Resolution order:
 *   1. `PUBLIC_BASE_URL` env var (operator override; always wins).
 *   2. Reverse-proxy headers (`X-Forwarded-Proto` / `X-Forwarded-Host`)
 *      — these are set by nginx in production and stripped by Express
 *      automatically thanks to `app.set('trust proxy', 1)`.
 *   3. The Express-detected request URL (`req.protocol` + `req.get('host')`),
 *      with one safety net: when the host is clearly NOT localhost we
 *      upgrade `http` → `https`. Without that, sites running behind a
 *      reverse proxy that forgets to forward `X-Forwarded-Proto` end up
 *      with `http://...` links inside HTTPS-only emails (mixed content,
 *      Resend "links don't match domain" warnings, broken images).
 *   4. `http://localhost:<PORT>` as the absolute last-resort fallback.
 *
 * Always returns a URL with no trailing slash.
 */
export function getPublicBaseUrl(req?: Request): string {
  const envOverride = process.env.PUBLIC_BASE_URL?.trim();
  if (envOverride) {
    return envOverride.replace(/\/$/, "");
  }

  if (req) {
    // Express normalises X-Forwarded-Proto into req.protocol when
    // `trust proxy` is on, but defensive parsing here costs nothing
    // and protects against partially-configured proxies.
    const fwdProtoHeader = (req.get("x-forwarded-proto") || "").split(",")[0]?.trim();
    const fwdHost = (req.get("x-forwarded-host") || "").split(",")[0]?.trim();
    const host = fwdHost || req.get("host") || `localhost:${process.env.PORT || 5000}`;
    const isLocalHost = /^(localhost|127\.|0\.0\.0\.0|\[?::1\]?)(:\d+)?$/i.test(host);

    let proto = fwdProtoHeader || req.protocol || "http";
    // Safety net: if we're clearly serving a public hostname but we
    // ended up with `http`, upgrade to `https`. Public hostnames are
    // virtually always TLS-terminated by the front proxy, so emitting
    // an http:// link there is almost certainly wrong.
    if (proto === "http" && !isLocalHost) {
      proto = "https";
    }
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  return `http://localhost:${process.env.PORT || 5000}`;
}
