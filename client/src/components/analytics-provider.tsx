import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { initializeSession, trackPageView } from "@/lib/analytics";

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

interface EntityInfo {
  entityType?: string;
  entityId?: string;
  entityName?: string;
}

function extractEntityFromPath(path: string): EntityInfo {
  const parts = path.split("/").filter(Boolean);
  
  if (parts.length >= 2) {
    const [type, id] = parts;
    
    switch (type) {
      case "libro":
        return {
          entityType: "book",
          entityId: id,
        };
      case "autor":
        return {
          entityType: "author",
          entityId: id,
        };
      case "serie":
        return {
          entityType: "series",
          entityId: id,
        };
      case "blog":
        return {
          entityType: "blog_post",
          entityId: id,
        };
      default:
        return {};
    }
  }
  
  return {};
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const [location] = useLocation();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initializeSession();
      initialized.current = true;
    }
  }, []);

  useEffect(() => {
    const pageTitle = document.title || "Untitled Page";
    const { entityType, entityId, entityName } = extractEntityFromPath(location);
    
    trackPageView(
      location,
      pageTitle,
      entityType,
      entityId,
      entityName
    );
  }, [location]);

  return <>{children}</>;
}
