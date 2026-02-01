/**
 * Currency format configuration
 */
export interface CurrencyFormatConfig {
  /** Currency code (e.g., 'USD', 'EUR', 'MXN') */
  currency?: string;
  /** Locale for formatting (e.g., 'en-US', 'es-MX') */
  locale?: string;
  /** Minimum fraction digits */
  minimumFractionDigits?: number;
  /** Maximum fraction digits */
  maximumFractionDigits?: number;
  /** Whether to show the currency symbol */
  showSymbol?: boolean;
}

/**
 * Default currency format configuration
 */
const DEFAULT_CONFIG: Required<CurrencyFormatConfig> = {
  currency: 'USD',
  locale: 'en-US',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  showSymbol: true,
};

/**
 * Format a number as currency
 *
 * @param value - The number to format (can be string, number, null, or undefined)
 * @param config - Formatting configuration
 * @returns Formatted currency string or empty string if invalid
 *
 * @example
 * ```ts
 * formatCurrency(1234.56)
 * // => '$1,234.56'
 *
 * formatCurrency(1234.56, { currency: 'EUR', locale: 'de-DE' })
 * // => '1.234,56 €'
 *
 * formatCurrency(1234.56, { currency: 'MXN', locale: 'es-MX' })
 * // => '$1,234.56'
 * ```
 */
export function formatCurrency(
  value: string | number | null | undefined,
  config: CurrencyFormatConfig = {}
): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const parsed = typeof value === 'number' ? value : parseFloat(String(value));

  if (isNaN(parsed)) {
    return '';
  }

  try {
    if (mergedConfig.showSymbol) {
      return parsed.toLocaleString(mergedConfig.locale, {
        style: 'currency',
        currency: mergedConfig.currency,
        minimumFractionDigits: mergedConfig.minimumFractionDigits,
        maximumFractionDigits: mergedConfig.maximumFractionDigits,
      });
    } else {
      return parsed.toLocaleString(mergedConfig.locale, {
        minimumFractionDigits: mergedConfig.minimumFractionDigits,
        maximumFractionDigits: mergedConfig.maximumFractionDigits,
      });
    }
  } catch {
    // Fallback for unsupported locales
    return `$${parsed.toFixed(mergedConfig.minimumFractionDigits)}`;
  }
}

/**
 * Parse a currency string to a number
 *
 * @param value - The currency string to parse
 * @returns Parsed number or null if invalid
 *
 * @example
 * ```ts
 * parseCurrency('$1,234.56')
 * // => 1234.56
 *
 * parseCurrency('1.234,56 €')
 * // => 1234.56
 * ```
 */
export function parseCurrency(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }

  // Remove currency symbols, spaces, and thousands separators
  const cleanValue = String(value)
    .replace(/[^0-9.,-]/g, '')
    .trim();

  // Handle both comma and period as decimal separators
  // Determine which is the decimal separator based on position
  const lastComma = cleanValue.lastIndexOf(',');
  const lastPeriod = cleanValue.lastIndexOf('.');

  let normalized = cleanValue;

  if (lastComma > lastPeriod) {
    // European format: 1.234,56
    normalized = cleanValue.replace(/\./g, '').replace(',', '.');
  } else {
    // US format: 1,234.56
    normalized = cleanValue.replace(/,/g, '');
  }

  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Create a currency formatter with preset configuration
 *
 * @param config - Default configuration for the formatter
 * @returns A formatter function with the preset configuration
 *
 * @example
 * ```ts
 * const formatMXN = createCurrencyFormatter({ currency: 'MXN', locale: 'es-MX' });
 * formatMXN(1234.56)
 * // => '$1,234.56'
 * ```
 */
export function createCurrencyFormatter(
  config: CurrencyFormatConfig
): (value: string | number | null | undefined) => string {
  return (value) => formatCurrency(value, config);
}

/**
 * Pre-configured formatters for common currencies
 */
export const currencyFormatters = {
  USD: createCurrencyFormatter({ currency: 'USD', locale: 'en-US' }),
  EUR: createCurrencyFormatter({ currency: 'EUR', locale: 'de-DE' }),
  GBP: createCurrencyFormatter({ currency: 'GBP', locale: 'en-GB' }),
  MXN: createCurrencyFormatter({ currency: 'MXN', locale: 'es-MX' }),
  JPY: createCurrencyFormatter({
    currency: 'JPY',
    locale: 'ja-JP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }),
};
