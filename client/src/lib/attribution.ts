// Frontend helper for the Amazon Attribution integration.
//
// Used by every "Comprar en Amazon" CTA on the public site. The flow is:
//
//   1. The button is rendered as a plain `<a>` with `href="#"`.
//   2. On click we call `resolveAttributionHref()` which:
//        - reads the analytics sessionId (cookie-equivalent, in localStorage)
//        - reads the optional `?sub=<preferencesToken>` from the current URL
//        - POSTs to /api/attribution/generate
//        - receives either { mode: "attribution", clickUrl: "/api/attribution/click/:id" }
//          or { mode: "fallback", fallbackUrl: "https://amazon.es/..." }
//   3. We open the resolved URL in a new tab.
//
// The hook variant returns a ready-to-use onClick handler so call sites can
// stay declarative.

import { useCallback } from "react";
import { getOrCreateSessionId } from "./analytics";

export type AttributionLandingType = "autor" | "serie" | "libro";

export interface AttributionContext {
  landingType: AttributionLandingType;
  authorId?: string;
  seriesId?: string;
  bookId?: string;
  /**
   * Plain Amazon URL to use when Attribution is disabled or no ASIN is
   * configured for the resolved entity. When omitted and Attribution is
   * unavailable, the click silently does nothing — call sites should
   * always pass the legacy `amazonUrl` here.
   */
  fallbackUrl?: string | null;
}

interface GenerateResponse {
  mode: "attribution" | "fallback";
  id?: string;
  clickUrl?: string;
  fallbackUrl?: string | null;
}

// Reads `?sub=` from the current location. Returns undefined when absent.
function readSubToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("sub");
    return v && v.length > 0 ? v : undefined;
  } catch {
    return undefined;
  }
}

export async function resolveAttributionHref(ctx: AttributionContext): Promise<string | null> {
  try {
    const sessionId = getOrCreateSessionId();
    const subToken = readSubToken();

    const res = await fetch("/api/attribution/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        landingType: ctx.landingType,
        authorId: ctx.authorId,
        seriesId: ctx.seriesId,
        bookId: ctx.bookId,
        sessionId,
        subToken,
      }),
    });

    if (!res.ok) return ctx.fallbackUrl ?? null;

    const data = (await res.json()) as GenerateResponse;
    if (data.mode === "attribution" && data.clickUrl) {
      return data.clickUrl;
    }
    return data.fallbackUrl ?? ctx.fallbackUrl ?? null;
  } catch {
    return ctx.fallbackUrl ?? null;
  }
}

/**
 * Returns an onClick handler that intercepts the click, resolves the
 * Attribution URL, and opens it in a new tab. The link's static `href`
 * should be set to the fallback Amazon URL so right-click / middle-click /
 * SEO crawlers still work even if JavaScript is disabled.
 */
export function useAttributionLink(ctx: AttributionContext) {
  return useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
      // Honour middle-click / cmd-click / shift-click: let the browser do
      // its default thing (open in new tab/window). Only intercept plain
      // left-clicks so we can swap the URL for the trackable one.
      if (e.defaultPrevented) return;
      if ((e as any).button && (e as any).button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();
      const href = await resolveAttributionHref(ctx);
      if (!href) return;
      window.open(href, "_blank", "noopener,noreferrer");
    },
    [ctx.landingType, ctx.authorId, ctx.seriesId, ctx.bookId, ctx.fallbackUrl],
  );
}
