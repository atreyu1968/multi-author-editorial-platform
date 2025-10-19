import { AVAILABLE_LOCALES, type Locale } from "@/contexts/locale-context";

export interface LocalizedRoute {
  locale: Locale;
  path: string;
}

// Map of route names to their path patterns for each locale
export const ROUTE_PATTERNS: Record<string, Record<Locale, string>> = {
  home: {
    'es-ES': '/',
    'en-US': '/',
    'ca-ES': '/',
    'fr-FR': '/',
    'it-IT': '/',
    'de-DE': '/',
    'pt-PT': '/',
  },
  authors: {
    'es-ES': '/autores',
    'en-US': '/authors',
    'ca-ES': '/autors',
    'fr-FR': '/auteurs',
    'it-IT': '/autori',
    'de-DE': '/autoren',
    'pt-PT': '/autores',
  },
  book: {
    'es-ES': '/libro',
    'en-US': '/book',
    'ca-ES': '/llibre',
    'fr-FR': '/livre',
    'it-IT': '/libro',
    'de-DE': '/buch',
    'pt-PT': '/livro',
  },
  series: {
    'es-ES': '/serie',
    'en-US': '/series',
    'ca-ES': '/serie',
    'fr-FR': '/serie',
    'it-IT': '/serie',
    'de-DE': '/serie',
    'pt-PT': '/serie',
  },
  author: {
    'es-ES': '/autor',
    'en-US': '/author',
    'ca-ES': '/autor',
    'fr-FR': '/auteur',
    'it-IT': '/autore',
    'de-DE': '/autor',
    'pt-PT': '/autor',
  },
  blog: {
    'es-ES': '/blog',
    'en-US': '/blog',
    'ca-ES': '/bloc',
    'fr-FR': '/blog',
    'it-IT': '/blog',
    'de-DE': '/blog',
    'pt-PT': '/blogue',
  },
  blogPost: {
    'es-ES': '/blog',
    'en-US': '/blog',
    'ca-ES': '/bloc',
    'fr-FR': '/blog',
    'it-IT': '/blog',
    'de-DE': '/blog',
    'pt-PT': '/blogue',
  },
  checkout: {
    'es-ES': '/checkout',
    'en-US': '/checkout',
    'ca-ES': '/pagament',
    'fr-FR': '/paiement',
    'it-IT': '/pagamento',
    'de-DE': '/kasse',
    'pt-PT': '/checkout',
  },
  order: {
    'es-ES': '/pedido',
    'en-US': '/order',
    'ca-ES': '/comanda',
    'fr-FR': '/commande',
    'it-IT': '/ordine',
    'de-DE': '/bestellung',
    'pt-PT': '/encomenda',
  },
};

/**
 * Get the base URL for the site (used for canonical URLs and sitemaps)
 */
export function getSiteBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://mariawriter.replit.app';
}

/**
 * Generate a localized path for a given route
 * @param routeName - The route name from ROUTE_PATTERNS
 * @param locale - The target locale
 * @param params - Optional params like { id: '123', slug: 'my-book' }
 * @returns The localized path with locale prefix
 */
export function getLocalizedPath(
  routeName: string,
  locale: Locale,
  params?: Record<string, string>
): string {
  const pattern = ROUTE_PATTERNS[routeName]?.[locale];
  if (!pattern) {
    console.warn(`No pattern found for route "${routeName}" and locale "${locale}"`);
    return '/';
  }

  let path = `/${locale}${pattern}`;
  
  // Replace params in the path
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = `${path}/:${key}`.replace(`:${key}`, value);
    });
  }
  
  return path;
}

/**
 * Generate localized paths for all available locales
 * @param routeName - The route name from ROUTE_PATTERNS
 * @param params - Optional params like { id: '123', slug: 'my-book' }
 * @returns Array of LocalizedRoute objects for all locales
 */
export function getAllLocalizedPaths(
  routeName: string,
  params?: Record<string, string>
): LocalizedRoute[] {
  return AVAILABLE_LOCALES.map(({ code }) => ({
    locale: code,
    path: getLocalizedPath(routeName, code, params),
  }));
}

/**
 * Get the full URL for a localized route
 * @param routeName - The route name from ROUTE_PATTERNS
 * @param locale - The target locale
 * @param params - Optional params
 * @returns Full URL with domain
 */
export function getLocalizedUrl(
  routeName: string,
  locale: Locale,
  params?: Record<string, string>
): string {
  const path = getLocalizedPath(routeName, locale, params);
  return `${getSiteBaseUrl()}${path}`;
}

/**
 * Get all localized URLs for a route (for hreflang tags)
 * @param routeName - The route name from ROUTE_PATTERNS
 * @param params - Optional params
 * @returns Array of { locale, url } objects
 */
export function getAllLocalizedUrls(
  routeName: string,
  params?: Record<string, string>
): Array<{ locale: Locale; url: string }> {
  return AVAILABLE_LOCALES.map(({ code }) => ({
    locale: code,
    url: getLocalizedUrl(routeName, code, params),
  }));
}

/**
 * Convert locale code to hreflang format (e.g., 'es-ES' -> 'es-es')
 */
export function localeToHreflang(locale: Locale): string {
  return locale.toLowerCase();
}

/**
 * Get the current path without locale prefix
 * @param path - The current path
 * @returns The path without locale prefix
 */
export function stripLocaleFromPath(path: string): string {
  const localePattern = /^\/(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)\//;
  return path.replace(localePattern, '/');
}

/**
 * Extract locale from path
 * @param path - The current path
 * @returns The locale if found, undefined otherwise
 */
export function getLocaleFromPath(path: string): Locale | undefined {
  const match = path.match(/^\/(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/);
  return match ? (match[1] as Locale) : undefined;
}
