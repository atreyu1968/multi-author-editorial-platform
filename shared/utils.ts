export function getTranslatedField<T>(
  translations: Array<{locale: string, [key: string]: any}>,
  field: string,
  preferredLocale: string,
  fallbackValue: T
): T {
  // 1. Try preferred locale
  const preferred = translations.find(t => t.locale === preferredLocale)?.[field];
  if (preferred) return preferred;
  
  // 2. Try default locale (es-ES)
  const defaultLoc = translations.find(t => t.locale === 'es-ES')?.[field];
  if (defaultLoc) return defaultLoc;
  
  // 3. Fallback to source
  return fallbackValue;
}
