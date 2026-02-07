import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SiteSettings, EditorialSettings } from "@shared/schema";

const CSS_DEFAULTS = {
  primary: '222.2 47.4% 11.2%',
  secondary: '210 40% 96.1%',
  accent: '210 40% 96.1%',
  background: '0 0% 100%',
  foreground: '222.2 47.4% 11.2%'
};

function applyThemeColors(colors: {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
}) {
  const root = document.documentElement;

  if (colors.primaryColor) {
    root.style.setProperty('--primary', hexToHSL(colors.primaryColor));
  } else {
    root.style.setProperty('--primary', CSS_DEFAULTS.primary);
  }

  if (colors.secondaryColor) {
    root.style.setProperty('--secondary', hexToHSL(colors.secondaryColor));
  } else {
    root.style.setProperty('--secondary', CSS_DEFAULTS.secondary);
  }

  if (colors.accentColor) {
    root.style.setProperty('--accent', hexToHSL(colors.accentColor));
  } else {
    root.style.setProperty('--accent', CSS_DEFAULTS.accent);
  }

  if (colors.backgroundColor) {
    root.style.setProperty('--background', hexToHSL(colors.backgroundColor));
  } else {
    root.style.setProperty('--background', CSS_DEFAULTS.background);
  }

  if (colors.textColor) {
    root.style.setProperty('--foreground', hexToHSL(colors.textColor));
  } else {
    root.style.setProperty('--foreground', CSS_DEFAULTS.foreground);
  }
}

function resetToDefaults() {
  const root = document.documentElement;
  root.style.setProperty('--primary', CSS_DEFAULTS.primary);
  root.style.setProperty('--secondary', CSS_DEFAULTS.secondary);
  root.style.setProperty('--accent', CSS_DEFAULTS.accent);
  root.style.setProperty('--background', CSS_DEFAULTS.background);
  root.style.setProperty('--foreground', CSS_DEFAULTS.foreground);
}

interface DynamicThemeProps {
  children: ReactNode;
  authorId?: string;
}

export function DynamicTheme({ children, authorId }: DynamicThemeProps) {
  const { data: settings = [] } = useQuery<SiteSettings[]>({
    queryKey: authorId ? ["/api/settings", { authorId }] : ["/api/settings"],
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
      link.href = '/favicon.ico';
    }
  }, [settingsMap.faviconUrl]);

  useEffect(() => {
    applyThemeColors({
      primaryColor: settingsMap.primaryColor,
      secondaryColor: settingsMap.secondaryColor,
      accentColor: settingsMap.accentColor,
      backgroundColor: settingsMap.backgroundColor,
      textColor: settingsMap.textColor,
    });
  }, [
    settingsMap.primaryColor,
    settingsMap.secondaryColor,
    settingsMap.accentColor,
    settingsMap.backgroundColor,
    settingsMap.textColor
  ]);

  return <>{children}</>;
}

interface EditorialThemeProps {
  children: ReactNode;
}

export function EditorialTheme({ children }: EditorialThemeProps) {
  const { data: settings } = useQuery<EditorialSettings>({
    queryKey: ["/api/editorial-settings"],
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    resetToDefaults();
    if (settings) {
      applyThemeColors({
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        accentColor: settings.accentColor,
        backgroundColor: settings.backgroundColor,
        textColor: settings.textColor,
      });
    }
  });

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
