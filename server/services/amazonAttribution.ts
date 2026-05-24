// Reference: https://advertising.amazon.com/API/docs/en/reference/attribution
//
// Editorial-wide Amazon Attribution integration. Encapsulates:
//   - OAuth token lifecycle (refresh_token → short-lived access_token, cached
//     in DB so we don't have to re-fetch on every request and so it survives
//     server restarts).
//   - Tag creation per (asin, landing-type) pair.
//   - Daily report fetching.
//   - The OAuth "Login with Amazon" authorization-code dance used by the
//     admin panel to connect/disconnect the editorial account.
//
// All credentials live in the `amazon_attribution_settings` singleton row
// (one editorial-wide account), NEVER in env vars — admins manage them
// from the panel and we never want to bake them into the deployment.

import { storage } from "../storage";
import type { AmazonAttributionSettings } from "@shared/schema";

const AUTH_URL = "https://www.amazon.com/ap/oa";
const TOKEN_URL = "https://api.amazon.com/auth/o2/token";
// Amazon hosts the Attribution API on the regional advertising endpoint.
// `eu` (Europe) is the right choice for an editorial selling on
// amazon.es / amazon.it / amazon.de / amazon.fr. North America accounts
// would need `na` and Far East `fe`; this can be promoted to a setting
// later if the editorial expands.
const ADS_API_BASE = process.env.AMAZON_ADS_API_BASE || "https://advertising-api-eu.amazon.com";
// LWA scope required to call the Attribution endpoints. See "Login with
// Amazon" + "Amazon Ads API" docs.
const OAUTH_SCOPE = "advertising::campaign_management";
// Tokens last 3600s; refresh a bit early to absorb clock skew + network lag.
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

export interface CreateTagInput {
  asin: string;
  publisher: string;   // e.g. "landing_libro"
  campaign: string;    // e.g. "el-duque-y-la-institutriz"
  name?: string;       // optional override, defaults to `${campaign}_${ts}`
}

export interface CreateTagResult {
  tagId: string;
  clickUrl: string;
}

export interface AttributionReportRow {
  date: string;            // YYYY-MM-DD
  tagId: string;
  clicks: number;
  detailPageViews: number;
  addToCart: number;
  purchases: number;
  salesAmount: number;
}

export class AmazonAttributionDisabledError extends Error {
  constructor() {
    super("Amazon Attribution is not configured or disabled");
    this.name = "AmazonAttributionDisabledError";
  }
}

export class AmazonAttributionService {
  // ---- Configuration & token plumbing --------------------------------------

  async getSettings(): Promise<AmazonAttributionSettings | undefined> {
    return await storage.getAmazonAttributionSettings();
  }

  async isEnabled(): Promise<boolean> {
    const s = await this.getSettings();
    return !!(
      s &&
      s.isEnabled &&
      s.clientId &&
      s.clientSecret &&
      s.refreshToken &&
      s.profileId
    );
  }

  // Returns a valid access_token, refreshing it if it's missing or about to
  // expire. Persists the renewed token to the singleton settings row so
  // other workers / restarts can reuse it.
  private async getAccessToken(): Promise<string> {
    const s = await this.getSettings();
    if (!s || !s.clientId || !s.clientSecret || !s.refreshToken) {
      throw new AmazonAttributionDisabledError();
    }

    const now = Date.now();
    const expiresAt = s.accessTokenExpiresAt ? Date.parse(s.accessTokenExpiresAt) : 0;
    if (s.accessToken && expiresAt > now + TOKEN_REFRESH_BUFFER_MS) {
      return s.accessToken;
    }

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: s.refreshToken,
      client_id: s.clientId,
      client_secret: s.clientSecret,
    });

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Amazon OAuth refresh failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as { access_token: string; expires_in: number };
    const newExpiresAt = new Date(now + (data.expires_in - 60) * 1000).toISOString();

    await storage.updateAmazonAttributionSettings({
      accessToken: data.access_token,
      accessTokenExpiresAt: newExpiresAt,
    });

    return data.access_token;
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const [token, settings] = await Promise.all([
      this.getAccessToken(),
      this.getSettings(),
    ]);
    if (!settings?.profileId) {
      throw new AmazonAttributionDisabledError();
    }
    return {
      Authorization: `Bearer ${token}`,
      "Amazon-Advertising-API-ClientId": settings.clientId!,
      "Amazon-Advertising-API-Scope": String(settings.profileId),
      "Content-Type": "application/json",
    };
  }

  // ---- OAuth authorization-code flow (admin connect button) ----------------

  // Builds the URL the admin must visit to authorize the editorial's Amazon
  // Ads account. `redirectUri` MUST match the one registered on the Amazon
  // Developer Console for the Login-with-Amazon app, AND match what we'll
  // send to the token endpoint below — otherwise Amazon returns 400.
  buildAuthorizationUrl(opts: { clientId: string; redirectUri: string; state?: string }): string {
    const params = new URLSearchParams({
      client_id: opts.clientId,
      scope: OAUTH_SCOPE,
      response_type: "code",
      redirect_uri: opts.redirectUri,
    });
    if (opts.state) params.set("state", opts.state);
    return `${AUTH_URL}?${params.toString()}`;
  }

  // Exchanges the authorization-code returned by Amazon's redirect for a
  // long-lived refresh_token + initial access_token. Persists everything to
  // the singleton settings row.
  async exchangeCodeForRefreshToken(opts: {
    code: string;
    redirectUri: string;
    clientId: string;
    clientSecret: string;
  }): Promise<{ refreshToken: string; accessToken: string; expiresIn: number }> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: opts.code,
      redirect_uri: opts.redirectUri,
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
    });

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Amazon OAuth code exchange failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    const expiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000).toISOString();
    await storage.updateAmazonAttributionSettings({
      clientId: opts.clientId,
      clientSecret: opts.clientSecret,
      refreshToken: data.refresh_token,
      accessToken: data.access_token,
      accessTokenExpiresAt: expiresAt,
    });

    return {
      refreshToken: data.refresh_token,
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  }

  // Lists the Amazon Ads "profiles" (accounts × marketplaces) the connected
  // user has access to. The admin picks one and we persist its profileId.
  async listProfiles(): Promise<Array<{ profileId: number; countryCode: string; accountInfo?: { name?: string } }>> {
    const token = await this.getAccessToken();
    const s = await this.getSettings();
    const res = await fetch(`${ADS_API_BASE}/v2/profiles`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Amazon-Advertising-API-ClientId": s?.clientId || "",
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`List profiles failed (${res.status}): ${text}`);
    }
    return (await res.json()) as any[];
  }

  // ---- Attribution tag creation --------------------------------------------

  // Creates a new Attribution tag for the given ASIN. Returns Amazon's
  // tagId (used as the join key with the daily reports) and the clickUrl
  // we hand to the browser.
  async createTag(input: CreateTagInput): Promise<CreateTagResult> {
    if (!(await this.isEnabled())) {
      throw new AmazonAttributionDisabledError();
    }

    const headers = await this.authHeaders();
    const ts = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
    const name = input.name || `${input.campaign}_${ts}`;

    // Payload shape per Amazon's Attribution v3 "tag" creation endpoint.
    // Some accounts still operate on v2; both accept the same body — we
    // hit v3 first and you can change the path here if your account is on
    // v2 only.
    const payload = {
      name,
      publisher: input.publisher,
      campaign: input.campaign,
      destination: {
        asin: input.asin,
        type: "DETAIL_PAGE",
      },
    };

    const res = await fetch(`${ADS_API_BASE}/v2/attribution/tags`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Create attribution tag failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as { tagId?: string; clickUrl?: string };
    if (!data.tagId || !data.clickUrl) {
      throw new Error(`Create attribution tag returned malformed response: ${JSON.stringify(data)}`);
    }
    return { tagId: data.tagId, clickUrl: data.clickUrl };
  }

  // ---- Daily reports --------------------------------------------------------

  async getReports(startDate: string, endDate: string): Promise<AttributionReportRow[]> {
    if (!(await this.isEnabled())) {
      throw new AmazonAttributionDisabledError();
    }

    const headers = await this.authHeaders();
    const params = new URLSearchParams({
      startDate,
      endDate,
      granularity: "DAILY",
      reportType: "PERFORMANCE",
    });

    const res = await fetch(`${ADS_API_BASE}/v2/attribution/report?${params.toString()}`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Attribution report fetch failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as any;
    // Amazon may return either a flat array or { reports: [...] }; normalize.
    const rows: any[] = Array.isArray(data) ? data : data?.reports || data?.data || [];

    return rows.map((r: any) => ({
      date: String(r.date || r.reportDate || ""),
      tagId: String(r.tagId || r.attributionTagId || ""),
      clicks: Number(r.clicks ?? 0),
      detailPageViews: Number(r.detailPageViews ?? r.detailPageView ?? 0),
      addToCart: Number(r.addToCarts ?? r.addToCart ?? 0),
      purchases: Number(r.purchases ?? r.unitsSold ?? 0),
      salesAmount: Number(r.salesAmount ?? r.attributedSales ?? 0),
    })).filter((r) => r.tagId && r.date);
  }
}

export const amazonAttributionService = new AmazonAttributionService();
