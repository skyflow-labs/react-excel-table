import { format, parse, parseISO, isValid } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

/**
 * Default timezone for date operations
 */
const DEFAULT_TIMEZONE = 'America/Mexico_City';

/**
 * Common date formats for parsing
 */
const PARSE_FORMATS = [
  'yyyy-MM-dd',
  'dd/MM/yyyy',
  'd/M/yyyy',
  'MM/dd/yyyy',
  'M/d/yyyy',
  'yyyy-MM-dd HH:mm:ss',
  'dd/MM/yyyy HH:mm:ss',
];

/**
 * Format configuration
 */
export interface DateFormatConfig {
  /** Target timezone */
  timezone?: string;
  /** Output format string */
  format?: string;
  /** Fallback text for invalid dates */
  fallback?: string;
}

/**
 * Format a date value for display
 * Converts from UTC to the specified timezone
 *
 * @param rawDate - The date value to format (string, number, Date, or null/undefined)
 * @param config - Formatting configuration
 * @returns Formatted date string
 *
 * @example
 * ```ts
 * formatDateValue('2024-01-15T10:00:00Z', { format: 'dd/MM/yyyy' })
 * // => '15/01/2024'
 *
 * formatDateValue(new Date(), { format: 'yyyy-MM-dd HH:mm:ss', timezone: 'UTC' })
 * // => '2024-01-15 10:00:00'
 * ```
 */
export function formatDateValue(
  rawDate: string | number | Date | null | undefined,
  config: DateFormatConfig | string = {}
): string {
  // Handle string config (legacy format parameter)
  const {
    timezone = DEFAULT_TIMEZONE,
    format: dateFormat = 'dd/MM/yyyy',
    fallback = 'N/A',
  } = typeof config === 'string' ? { format: config } : config;

  if (!rawDate) return fallback;

  try {
    let date: Date;

    if (rawDate instanceof Date) {
      date = rawDate;
    } else if (typeof rawDate === 'number') {
      date = new Date(rawDate);
    } else {
      // Try parsing as ISO string first
      date = parseISO(rawDate);

      // If invalid, try other formats
      if (!isValid(date)) {
        for (const fmt of PARSE_FORMATS) {
          try {
            date = parse(rawDate, fmt, new Date());
            if (isValid(date)) break;
          } catch {
            continue;
          }
        }
      }
    }

    if (!isValid(date)) {
      return fallback;
    }

    // Convert to timezone and format
    return formatInTimeZone(date, timezone, dateFormat);
  } catch {
    return fallback;
  }
}

/**
 * Get current timestamp as ISO string (UTC)
 *
 * @returns Current timestamp in ISO format
 *
 * @example
 * ```ts
 * getCurrentTimestamp()
 * // => '2024-01-15T10:30:00.000Z'
 * ```
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Convert HTML date input value to ISO string
 *
 * @param dateString - Date string from HTML input (yyyy-MM-dd format)
 * @returns ISO string or empty string if invalid
 *
 * @example
 * ```ts
 * dateInputToISO('2024-01-15')
 * // => '2024-01-15T00:00:00.000Z'
 * ```
 */
export function dateInputToISO(dateString: string): string {
  if (!dateString) return '';

  try {
    const [year, month, day] = dateString.split('-').map(Number);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return '';
    }

    const date = new Date(Date.UTC(year, month - 1, day));
    return isValid(date) ? date.toISOString() : '';
  } catch {
    return '';
  }
}

/**
 * Convert ISO string to HTML date input format
 *
 * @param isoString - ISO date string
 * @returns Date string in yyyy-MM-dd format or empty string if invalid
 *
 * @example
 * ```ts
 * isoToDateInput('2024-01-15T10:30:00.000Z')
 * // => '2024-01-15'
 * ```
 */
export function isoToDateInput(isoString: string): string {
  if (!isoString) return '';

  try {
    const date = parseISO(isoString);
    return isValid(date) ? format(date, 'yyyy-MM-dd') : '';
  } catch {
    return '';
  }
}

/**
 * Parse a date string with various formats
 *
 * @param dateString - Date string to parse
 * @param formats - Array of format strings to try
 * @returns Parsed Date or null if invalid
 *
 * @example
 * ```ts
 * parseDateString('15/01/2024', ['dd/MM/yyyy', 'MM/dd/yyyy'])
 * // => Date object
 * ```
 */
export function parseDateString(
  dateString: string,
  formats: string[] = PARSE_FORMATS
): Date | null {
  if (!dateString) return null;

  // Try ISO format first
  const isoDate = parseISO(dateString);
  if (isValid(isoDate)) {
    return isoDate;
  }

  // Try provided formats
  for (const fmt of formats) {
    try {
      const date = parse(dateString, fmt, new Date());
      if (isValid(date)) {
        return date;
      }
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Convert a date to the specified timezone
 *
 * @param date - Date to convert
 * @param timezone - Target timezone
 * @returns Date in the specified timezone
 */
export function toTimezone(date: Date, timezone: string = DEFAULT_TIMEZONE): Date {
  return toZonedTime(date, timezone);
}

/**
 * Check if a value is a valid date
 *
 * @param value - Value to check
 * @returns True if the value is a valid date
 */
export function isValidDate(value: unknown): boolean {
  if (!value) return false;

  if (value instanceof Date) {
    return isValid(value);
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return isValid(date);
  }

  return false;
}
