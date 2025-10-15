import { apiRequest } from "./queryClient";

const SESSION_STORAGE_KEY = "analytics_session_id";

export function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  
  return sessionId;
}

export function detectDevice(): "desktop" | "mobile" | "tablet" {
  const width = window.innerWidth;
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    return "tablet";
  }
  
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    return "mobile";
  }
  
  if (width < 768) {
    return "mobile";
  }
  
  if (width >= 768 && width < 1024) {
    return "tablet";
  }
  
  return "desktop";
}

export function detectBrowser(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes("Edg/")) {
    return "Edge";
  }
  
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
    return "Chrome";
  }
  
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    return "Safari";
  }
  
  if (userAgent.includes("Firefox")) {
    return "Firefox";
  }
  
  if (userAgent.includes("MSIE") || userAgent.includes("Trident/")) {
    return "Internet Explorer";
  }
  
  if (userAgent.includes("Opera") || userAgent.includes("OPR/")) {
    return "Opera";
  }
  
  return "Unknown";
}

export function detectOS(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes("Win")) {
    return "Windows";
  }
  
  if (userAgent.includes("Mac")) {
    return "macOS";
  }
  
  if (userAgent.includes("Linux")) {
    return "Linux";
  }
  
  if (userAgent.includes("Android")) {
    return "Android";
  }
  
  if (userAgent.includes("iOS") || userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    return "iOS";
  }
  
  return "Unknown";
}

export async function initializeSession(): Promise<void> {
  try {
    const sessionId = getOrCreateSessionId();
    const device = detectDevice();
    const browser = detectBrowser();
    const os = detectOS();
    
    await apiRequest("POST", "/api/analytics/session", {
      sessionId,
      device,
      browser,
      os,
      referrer: document.referrer || null,
      landingPage: window.location.pathname,
    });
  } catch (error) {
    console.error("Failed to initialize analytics session:", error);
  }
}

interface TrackEventParams {
  eventType: string;
  pagePath?: string;
  pageTitle?: string;
  elementId?: string;
  elementText?: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  metadata?: Record<string, any>;
}

export async function trackEvent(params: TrackEventParams): Promise<void> {
  try {
    const sessionId = getOrCreateSessionId();
    
    await apiRequest("POST", "/api/analytics/track", {
      sessionId,
      ...params,
    });
  } catch (error) {
    console.error("Failed to track event:", error);
  }
}

export async function trackPageView(
  pagePath: string,
  pageTitle: string,
  entityType?: string,
  entityId?: string,
  entityName?: string
): Promise<void> {
  await trackEvent({
    eventType: "pageview",
    pagePath,
    pageTitle,
    entityType,
    entityId,
    entityName,
  });
}
