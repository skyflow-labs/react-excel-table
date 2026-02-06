/**
 * Number format configuration
 */
export interface NumberFormatConfig {
  /** Locale for formatting (e.g., 'en-US', 'de-DE') */
  locale?: string;
  /** Minimum fraction digits */
  minimumFractionDigits?: number;
  /** Maximum fraction digits */
  maximumFractionDigits?: number;
  /** Use grouping separators (e.g., thousands) */
  useGrouping?: boolean;
  /** Compact display mode */
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
  /** Compact display style */
  compactDisplay?: 'short' | 'long';
}

/**
 * Default number format configuration
 */
const DEFAULT_CONFIG: Required<NumberFormatConfig> = {
  locale: 'en-US',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  useGrouping: true,
  notation: 'standard',
  compactDisplay: 'short',
};

/**
 * Format a number for display
 *
 * @param value - The number to format (can be string, number, null, or undefined)
 * @param config - Formatting configuration
 * @returns Formatted number string or empty string if invalid
 *
 * @example
 * ```ts
 * formatNumber(1234567.89)
 * // => '1,234,567.89'
 *
 * formatNumber(1234567.89, { locale: 'de-DE' })
 * // => '1.234.567,89'
 *
 * formatNumber(1234567, { notation: 'compact' })
 * // => '1.2M'
 * ```
 */
export function formatNumber(
  value: string | number | null | undefined,
  config: NumberFormatConfig = {}
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
    return parsed.toLocaleString(mergedConfig.locale, {
      minimumFractionDigits: mergedConfig.minimumFractionDigits,
      maximumFractionDigits: mergedConfig.maximumFractionDigits,
      useGrouping: mergedConfig.useGrouping,
      notation: mergedConfig.notation,
      compactDisplay: mergedConfig.compactDisplay,
    });
  } catch {
    // Fallback for unsupported options
    return parsed.toLocaleString(mergedConfig.locale, {
      minimumFractionDigits: mergedConfig.minimumFractionDigits,
      maximumFractionDigits: mergedConfig.maximumFractionDigits,
      useGrouping: mergedConfig.useGrouping,
    });
  }
}

/**
 * Parse a formatted number string to a number
 *
 * @param value - The formatted string to parse
 * @param locale - The locale used for formatting (affects decimal separator detection)
 * @returns Parsed number or null if invalid
 *
 * @example
 * ```ts
 * parseNumber('1,234.56')
 * // => 1234.56
 *
 * parseNumber('1.234,56', 'de-DE')
 * // => 1234.56
 * ```
 */
export function parseNumber(
  value: string | number | null | undefined,
  locale: string = 'en-US'
): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }

  // Remove non-numeric characters except . , - and space
  const cleanValue = String(value).replace(/[^0-9.,-\s]/g, '').trim();

  // Detect decimal separator based on locale
  const isCommaDecimal = locale.startsWith('de') ||
                         locale.startsWith('es') ||
                         locale.startsWith('fr') ||
                         locale.startsWith('it');

  let normalized: string;

  if (isCommaDecimal) {
    // European format: periods are thousands, comma is decimal
    normalized = cleanValue
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
  } else {
    // US format: commas are thousands, period is decimal
    normalized = cleanValue.replace(/\s/g, '').replace(/,/g, '');
  }

  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Format a number as a percentage
 *
 * @param value - The number to format (0.5 = 50%)
 * @param config - Formatting configuration
 * @returns Formatted percentage string
 *
 * @example
 * ```ts
 * formatPercent(0.1234)
 * // => '12.34%'
 *
 * formatPercent(0.1234, { maximumFractionDigits: 0 })
 * // => '12%'
 * ```
 */
export function formatPercent(
  value: number | null | undefined,
  config: Omit<NumberFormatConfig, 'notation' | 'compactDisplay'> = {}
): string {
  if (value === null || value === undefined) {
    return '';
  }

  const mergedConfig = {
    locale: config.locale ?? DEFAULT_CONFIG.locale,
    minimumFractionDigits: config.minimumFractionDigits ?? 0,
    maximumFractionDigits: config.maximumFractionDigits ?? 2,
    useGrouping: config.useGrouping ?? true,
  };

  try {
    return value.toLocaleString(mergedConfig.locale, {
      style: 'percent',
      minimumFractionDigits: mergedConfig.minimumFractionDigits,
      maximumFractionDigits: mergedConfig.maximumFractionDigits,
      useGrouping: mergedConfig.useGrouping,
    });
  } catch {
    return `${(value * 100).toFixed(mergedConfig.maximumFractionDigits)}%`;
  }
}

/**
 * Format bytes to human-readable size
 *
 * @param bytes - Number of bytes
 * @param decimals - Decimal places to show
 * @returns Formatted size string
 *
 * @example
 * ```ts
 * formatBytes(1024)
 * // => '1 KB'
 *
 * formatBytes(1234567890)
 * // => '1.15 GB'
 * ```
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  if (bytes < 0) return '-' + formatBytes(-bytes, decimals);
  if (!Number.isFinite(bytes)) return String(bytes);

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Create a number formatter with preset configuration
 *
 * @param config - Default configuration for the formatter
 * @returns A formatter function with the preset configuration
 */
export function createNumberFormatter(
  config: NumberFormatConfig
): (value: string | number | null | undefined) => string {
  return (value) => formatNumber(value, config);
}

/**
 * Clamp a number between min and max values
 *
 * @param value - The value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
