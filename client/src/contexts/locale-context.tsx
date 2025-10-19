import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SiteSettings } from '@shared/schema';

export type Locale = 'es-ES' | 'en-US' | 'ca-ES' | 'fr-FR' | 'it-IT' | 'de-DE' | 'pt-PT';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  availableLocales: { code: Locale; name: string; flag: string }[];
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'app-locale';
const FALLBACK_LOCALE: Locale = 'es-ES';

export const AVAILABLE_LOCALES = [
  { code: 'es-ES' as Locale, name: 'Español', flag: '🇪🇸' },
  { code: 'en-US' as Locale, name: 'English', flag: '🇺🇸' },
  { code: 'ca-ES' as Locale, name: 'Català', flag: '🏴' },
  { code: 'fr-FR' as Locale, name: 'Français', flag: '🇫🇷' },
  { code: 'it-IT' as Locale, name: 'Italiano', flag: '🇮🇹' },
  { code: 'de-DE' as Locale, name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt-PT' as Locale, name: 'Português', flag: '🇵🇹' },
];

// Determine initial locale based on priority:
// 1. localStorage (user choice)
// 2. auto-detect (if enabled in settings)
// 3. default_locale (from settings)
// 4. fallback locale
function determineInitialLocale(settings: SiteSettings[] | undefined): Locale {
  if (typeof window === 'undefined') return FALLBACK_LOCALE;
  
  // Priority 1: localStorage (user's explicit choice)
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && AVAILABLE_LOCALES.some(l => l.code === stored)) {
    return stored as Locale;
  }
  
  // Get first setting entry (assuming single-tenant for now)
  const firstSetting = settings?.[0];
  
  // Priority 2: auto-detect from browser (if enabled)
  if (firstSetting?.autoDetectLocale !== false) {
    const browserLang = navigator.language;
    const match = AVAILABLE_LOCALES.find(l => 
      browserLang.startsWith(l.code.split('-')[0]) || browserLang === l.code
    );
    if (match) return match.code;
  }
  
  // Priority 3: default_locale from settings
  if (firstSetting?.defaultLocale && 
      AVAILABLE_LOCALES.some(l => l.code === firstSetting.defaultLocale)) {
    return firstSetting.defaultLocale as Locale;
  }
  
  // Priority 4: fallback locale
  return FALLBACK_LOCALE;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Fetch settings to get default_locale and auto_detect_locale
  const { data: settings } = useQuery<SiteSettings[]>({
    queryKey: ['/api/settings'],
  });
  
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Initial value before settings are loaded
    return FALLBACK_LOCALE;
  });
  
  const [initialized, setInitialized] = useState(false);

  // Update locale when settings are loaded (only once on mount)
  useEffect(() => {
    if (!initialized && settings) {
      const initialLocale = determineInitialLocale(settings);
      setLocaleState(initialLocale);
      setInitialized(true);
    }
  }, [settings, initialized]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    document.documentElement.lang = newLocale.split('-')[0];
  };

  useEffect(() => {
    document.documentElement.lang = locale.split('-')[0];
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, availableLocales: AVAILABLE_LOCALES }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
}
