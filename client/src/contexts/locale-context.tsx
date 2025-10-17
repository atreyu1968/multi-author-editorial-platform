import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Locale = 'es-ES' | 'en-US' | 'ca-ES';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  availableLocales: { code: Locale; name: string; flag: string }[];
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'app-locale';
const DEFAULT_LOCALE: Locale = 'es-ES';

export const AVAILABLE_LOCALES = [
  { code: 'es-ES' as Locale, name: 'Español', flag: '🇪🇸' },
  { code: 'en-US' as Locale, name: 'English', flag: '🇺🇸' },
  { code: 'ca-ES' as Locale, name: 'Català', flag: '🏴' },
];

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return DEFAULT_LOCALE;
    
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && AVAILABLE_LOCALES.some(l => l.code === stored)) {
      return stored as Locale;
    }
    
    const browserLang = navigator.language;
    const match = AVAILABLE_LOCALES.find(l => 
      browserLang.startsWith(l.code.split('-')[0])
    );
    
    return match?.code || DEFAULT_LOCALE;
  });

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
