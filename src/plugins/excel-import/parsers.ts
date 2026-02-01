import { parse, isValid } from 'date-fns';
import type { CellValue, RowData } from '@/types';

/**
 * Common date formats for parsing
 */
export const DEFAULT_DATE_FORMATS = [
  'yyyy-MM-dd',
  'dd/MM/yyyy',
  'd/M/yyyy',
  'MM/dd/yyyy',
  'M/d/yyyy',
  'yyyy-MM-dd HH:mm:ss',
  'dd/MM/yyyy HH:mm:ss',
  'yyyy/MM/dd',
  'dd-MM-yyyy',
];

/**
 * Parse a numeric value from various formats
 */
export function parseNumericValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }

  if (typeof value === 'string') {
    // Remove currency symbols, spaces, and thousands separators
    const clean = value.replace(/[^0-9.,-]+/g, '').trim();

    // Handle European format (comma as decimal)
    const lastComma = clean.lastIndexOf(',');
    const lastPeriod = clean.lastIndexOf('.');

    let normalized = clean;
    if (lastComma > lastPeriod) {
      // European: 1.234,56
      normalized = clean.replace(/\./g, '').replace(',', '.');
    } else {
      // US: 1,234.56
      normalized = clean.replace(/,/g, '');
    }

    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? null : parsed;
  }

  return null;
}

/**
 * Parse a date value from various formats
 */
export function parseDateValue(
  value: unknown,
  formats: string[] = DEFAULT_DATE_FORMATS
): Date | null {
  if (!value) return null;

  // Already a Date
  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  // Try each format
  for (const format of formats) {
    try {
      const parsed = parse(trimmed, format, new Date());
      if (isValid(parsed)) {
        return parsed;
      }
    } catch {
      continue;
    }
  }

  // Try native Date parsing as fallback
  try {
    const native = new Date(trimmed);
    if (isValid(native)) {
      return native;
    }
  } catch {
    // Ignore
  }

  return null;
}

/**
 * Parse a boolean value from various formats
 */
export function parseBooleanValue(value: unknown): boolean | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (['true', 'yes', 'si', '1', 'on'].includes(lower)) {
      return true;
    }
    if (['false', 'no', '0', 'off'].includes(lower)) {
      return false;
    }
  }

  return null;
}

/**
 * Normalize a header name for matching
 */
export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Auto-detect column mapping from CSV headers
 */
export function autoDetectColumnMapping<TData extends RowData>(
  csvHeaders: string[],
  targetKeys: Array<keyof TData>
): Record<string, keyof TData> {
  const mapping: Record<string, keyof TData> = {};
  const normalizedTargets = new Map(
    targetKeys.map((key) => [normalizeHeader(String(key)), key])
  );

  for (const header of csvHeaders) {
    const normalized = normalizeHeader(header);
    const match = normalizedTargets.get(normalized);

    if (match) {
      mapping[header] = match;
    }
  }

  return mapping;
}

/**
 * Transform a raw CSV row to typed data
 */
export function transformRow<TData extends RowData>(
  rawRow: Record<string, unknown>,
  mapping: Record<string, keyof TData>,
  transformers?: Record<string, (value: unknown) => CellValue>
): Partial<TData> {
  const result: Partial<TData> = {};

  for (const [csvKey, dataKey] of Object.entries(mapping)) {
    let value = rawRow[csvKey];

    // Apply custom transformer if provided
    if (transformers?.[String(dataKey)]) {
      value = transformers[String(dataKey)](value);
    }

    result[dataKey as keyof TData] = value as TData[keyof TData];
  }

  return result;
}
