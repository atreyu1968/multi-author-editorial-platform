import { useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { getOrCreateSessionId } from "@/lib/analytics";

export function useAnalytics() {
  const trackPageView = useCallback(
    async (
      pagePath: string,
      pageTitle: string,
      entityType?: string,
      entityId?: string,
      entityName?: string
    ) => {
      try {
        const sessionId = getOrCreateSessionId();
        
        await apiRequest("POST", "/api/analytics/track", {
          sessionId,
          eventType: "pageview",
          pagePath,
          pageTitle,
          entityType,
          entityId,
          entityName,
        });
      } catch (error) {
        console.error("Failed to track page view:", error);
      }
    },
    []
  );

  const trackClick = useCallback(
    async (
      elementId: string,
      elementText: string,
      entityType?: string,
      entityId?: string,
      entityName?: string
    ) => {
      try {
        const sessionId = getOrCreateSessionId();
        
        await apiRequest("POST", "/api/analytics/track", {
          sessionId,
          eventType: "click",
          elementId,
          elementText,
          entityType,
          entityId,
          entityName,
        });
      } catch (error) {
        console.error("Failed to track click:", error);
      }
    },
    []
  );

  const trackConversion = useCallback(
    async (
      eventType: "download" | "newsletter_signup" | "purchase",
      entityId?: string,
      metadata?: Record<string, any>
    ) => {
      try {
        const sessionId = getOrCreateSessionId();
        
        await apiRequest("POST", "/api/analytics/track", {
          sessionId,
          eventType,
          entityId,
          metadata,
        });
      } catch (error) {
        console.error("Failed to track conversion:", error);
      }
    },
    []
  );

  return {
    trackPageView,
    trackClick,
    trackConversion,
  };
}
