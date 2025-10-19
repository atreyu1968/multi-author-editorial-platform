/**
 * Currency Service
 * 
 * Handles currency conversion, exchange rate fetching, caching, and formatting.
 * Base currency: EUR (prices stored as cents/minor units)
 * 
 * Architecture:
 * - Prices stored in EUR cents (integer, no floating point errors)
 * - Exchange rates cached for 24 hours
 * - Fallback to manual rates if API fails
 * - Intl.NumberFormat for proper localization
 */

// Locale to Currency Mapping
export const LOCALE_TO_CURRENCY: Record<string, string> = {
  'es-ES': 'EUR',
  'ca-ES': 'EUR',
  'fr-FR': 'EUR',
  'it-IT': 'EUR',
  'de-DE': 'EUR',
  'pt-PT': 'EUR',
  'en-US': 'USD',
  'en-GB': 'GBP',
  'ja-JP': 'JPY',
  'zh-CN': 'CNY',
  'ko-KR': 'KRW',
  'pt-BR': 'BRL',
  'es-MX': 'MXN',
  'es-AR': 'ARS',
};

// Exchange Rates Type
export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

// Cache Configuration
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_KEY = 'currency_exchange_rates';
const CACHE_TIMESTAMP_KEY = 'currency_exchange_rates_timestamp';

// Fallback Manual Rates (in case API fails)
const FALLBACK_RATES: Record<string, number> = {
  EUR: 1.0,
  USD: 1.10,
  GBP: 0.85,
  JPY: 165.0,
  CNY: 7.85,
  KRW: 1450.0,
  BRL: 5.50,
  MXN: 18.50,
  ARS: 350.0,
  CAD: 1.48,
  AUD: 1.65,
  CHF: 0.95,
  SEK: 11.20,
  NOK: 11.50,
  DKK: 7.45,
  PLN: 4.35,
  CZK: 24.50,
  HUF: 390.0,
  RON: 4.95,
  BGN: 1.96,
  HRK: 7.55,
  RUB: 95.0,
  TRY: 32.0,
  INR: 91.0,
  IDR: 17200.0,
  MYR: 4.90,
  PHP: 61.0,
  SGD: 1.45,
  THB: 38.0,
  ZAR: 20.50,
  NZD: 1.80,
};

/**
 * Get currency for a given locale
 */
export function getCurrencyForLocale(locale: string): string {
  return LOCALE_TO_CURRENCY[locale] || 'EUR';
}

/**
 * Fetch exchange rates from external API
 * Uses Frankfurter API (free, no API key required)
 */
export async function fetchExchangeRates(): Promise<ExchangeRates> {
  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=EUR');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Ensure EUR is in the rates (as 1.0)
    const rates: Record<string, number> = {
      EUR: 1.0,
      ...data.rates,
    };
    
    return {
      base: 'EUR',
      date: data.date,
      rates,
    };
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // Return fallback rates
    return {
      base: 'EUR',
      date: new Date().toISOString().split('T')[0],
      rates: FALLBACK_RATES,
    };
  }
}

/**
 * Get cached exchange rates or fetch new ones if expired
 */
export async function getExchangeRates(useCache: boolean = true): Promise<ExchangeRates> {
  if (typeof window === 'undefined') {
    // Server-side: always fetch fresh rates
    return fetchExchangeRates();
  }

  if (!useCache) {
    const rates = await fetchExchangeRates();
    localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    return rates;
  }

  // Check cache
  const cachedRates = localStorage.getItem(CACHE_KEY);
  const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

  if (cachedRates && cachedTimestamp) {
    const timestamp = parseInt(cachedTimestamp, 10);
    const now = Date.now();
    const isExpired = now - timestamp > CACHE_DURATION_MS;

    if (!isExpired) {
      return JSON.parse(cachedRates) as ExchangeRates;
    }
  }

  // Fetch new rates
  const rates = await fetchExchangeRates();
  localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
  localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  return rates;
}

/**
 * Convert price from EUR cents to target currency cents
 * Uses integer mathematics to avoid floating point errors
 * 
 * @param amountInCents - Amount in EUR cents (e.g., 1999 for €19.99)
 * @param targetCurrency - Target currency code (e.g., 'USD')
 * @param rates - Exchange rates (optional, will fetch if not provided)
 * @returns Amount in target currency cents
 */
export async function convertPrice(
  amountInCents: number,
  targetCurrency: string,
  rates?: ExchangeRates
): Promise<number> {
  // If target is EUR, no conversion needed
  if (targetCurrency === 'EUR') {
    return amountInCents;
  }

  // Get exchange rates
  const exchangeRates = rates || await getExchangeRates();
  const rate = exchangeRates.rates[targetCurrency];

  if (!rate) {
    console.warn(`Exchange rate not found for ${targetCurrency}, using EUR`);
    return amountInCents;
  }

  // Convert using integer mathematics
  // Multiply first, then divide to maintain precision
  // rate is typically a decimal like 1.10 (EUR to USD)
  // We multiply by 10000 to work with integers, then divide back
  const rateAsInt = Math.round(rate * 10000);
  const convertedAmount = Math.round((amountInCents * rateAsInt) / 10000);

  return convertedAmount;
}

/**
 * Synchronous version of convertPrice for when rates are already available
 */
export function convertPriceSync(
  amountInCents: number,
  targetCurrency: string,
  rates: ExchangeRates
): number {
  if (targetCurrency === 'EUR') {
    return amountInCents;
  }

  const rate = rates.rates[targetCurrency];

  if (!rate) {
    console.warn(`Exchange rate not found for ${targetCurrency}, using EUR`);
    return amountInCents;
  }

  const rateAsInt = Math.round(rate * 10000);
  const convertedAmount = Math.round((amountInCents * rateAsInt) / 10000);

  return convertedAmount;
}

/**
 * Format price with proper currency symbol and locale-specific formatting
 * Uses Intl.NumberFormat for accurate localization
 * 
 * @param amountInCents - Amount in cents (e.g., 1999 for $19.99 or €19.99)
 * @param currency - Currency code (e.g., 'USD', 'EUR')
 * @param locale - Locale code (e.g., 'en-US', 'es-ES')
 * @returns Formatted price string
 */
export function formatPrice(
  amountInCents: number,
  currency: string,
  locale: string = 'es-ES'
): string {
  // Convert cents to main unit
  const amount = amountInCents / 100;

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    });

    return formatter.format(amount);
  } catch (error) {
    console.error('Error formatting price:', error);
    // Fallback to simple formatting
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Format price with conversion
 * Converts from EUR cents to target currency and formats
 * 
 * @param amountInEurCents - Amount in EUR cents
 * @param targetCurrency - Target currency code
 * @param locale - Locale code
 * @param rates - Exchange rates (optional)
 * @returns Formatted price string
 */
export async function formatPriceWithConversion(
  amountInEurCents: number,
  targetCurrency: string,
  locale: string = 'es-ES',
  rates?: ExchangeRates
): Promise<string> {
  const convertedAmount = await convertPrice(amountInEurCents, targetCurrency, rates);
  return formatPrice(convertedAmount, targetCurrency, locale);
}

/**
 * Synchronous version for when rates are already available
 */
export function formatPriceWithConversionSync(
  amountInEurCents: number,
  targetCurrency: string,
  locale: string,
  rates: ExchangeRates
): string {
  const convertedAmount = convertPriceSync(amountInEurCents, targetCurrency, rates);
  return formatPrice(convertedAmount, targetCurrency, locale);
}

/**
 * Get supported currencies
 */
export function getSupportedCurrencies(): string[] {
  return Object.keys(FALLBACK_RATES);
}

/**
 * Clear exchange rate cache
 */
export function clearRatesCache(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  }
}

/**
 * Validate currency code
 */
export function isValidCurrency(currency: string): boolean {
  return getSupportedCurrencies().includes(currency);
}
