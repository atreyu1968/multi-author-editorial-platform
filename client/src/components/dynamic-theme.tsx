import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SiteSettings } from "@shared/schema";

interface DynamicThemeProps {
  children: ReactNode;
}

export function DynamicTheme({ children }: DynamicThemeProps) {
  const { data: settings = [] } = useQuery<SiteSettings[]>({
    queryKey: ["/api/settings"],
    staleTime: 1000 * 60 * 5,
  });

  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);

  useEffect(() => {
    const faviconUrl = settingsMap.faviconUrl;
    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    
    if (faviconUrl) {
      link.href = faviconUrl;
    } else {
      // Restore default favicon if removed
      link.href = '/favicon.ico';
    }
  }, [settingsMap.faviconUrl]);

  useEffect(() => {
    const root = document.documentElement;
    
    if (settingsMap.primaryColor) {
      const hsl = hexToHSL(settingsMap.primaryColor);
      root.style.setProperty('--primary', hsl);
    }
    
    if (settingsMap.secondaryColor) {
      const hsl = hexToHSL(settingsMap.secondaryColor);
      root.style.setProperty('--secondary', hsl);
    }
    
    if (settingsMap.accentColor) {
      const hsl = hexToHSL(settingsMap.accentColor);
      root.style.setProperty('--accent', hsl);
    }

    if (settingsMap.backgroundColor) {
      const hsl = hexToHSL(settingsMap.backgroundColor);
      root.style.setProperty('--background', hsl);
    }

    if (settingsMap.textColor) {
      const hsl = hexToHSL(settingsMap.textColor);
      root.style.setProperty('--foreground', hsl);
    }
  }, [
    settingsMap.primaryColor,
    settingsMap.secondaryColor,
    settingsMap.accentColor,
    settingsMap.backgroundColor,
    settingsMap.textColor
  ]);

  return <>{children}</>;
}

function hexToHSL(hex: string): string {
  hex = hex.replace('#', '');
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${h} ${s}% ${lPercent}%`;
}
