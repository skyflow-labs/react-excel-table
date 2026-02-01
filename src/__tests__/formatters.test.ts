import { describe, it, expect } from 'vitest';
import {
  formatDateValue,
  dateInputToISO,
  isoToDateInput,
  formatCurrency,
  parseCurrency,
  formatNumber,
  parseNumber as parseNumberUtil,
  formatPercent,
  formatBytes,
} from '@/utils/formatters';

describe('Date Formatters', () => {
  describe('formatDateValue', () => {
    it('formats ISO date string', () => {
      const result = formatDateValue('2024-01-15T10:30:00.000Z', 'dd/MM/yyyy');
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('returns fallback for null/undefined', () => {
      expect(formatDateValue(null)).toBe('N/A');
      expect(formatDateValue(undefined)).toBe('N/A');
    });

    it('returns fallback for invalid date', () => {
      expect(formatDateValue('not-a-date')).toBe('N/A');
    });

    it('handles Date object', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      const result = formatDateValue(date, 'yyyy-MM-dd');
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('dateInputToISO', () => {
    it('converts HTML date input to ISO', () => {
      const result = dateInputToISO('2024-01-15');
      expect(result).toContain('2024-01-15');
    });

    it('returns empty string for empty input', () => {
      expect(dateInputToISO('')).toBe('');
    });

    it('returns empty string for invalid input', () => {
      expect(dateInputToISO('invalid')).toBe('');
    });
  });

  describe('isoToDateInput', () => {
    it('converts ISO to HTML date input format', () => {
      const result = isoToDateInput('2024-01-15T10:30:00.000Z');
      expect(result).toBe('2024-01-15');
    });

    it('returns empty string for empty input', () => {
      expect(isoToDateInput('')).toBe('');
    });

    it('returns empty string for invalid input', () => {
      expect(isoToDateInput('invalid')).toBe('');
    });
  });
});

describe('Currency Formatters', () => {
  describe('formatCurrency', () => {
    it('formats number as USD currency', () => {
      const result = formatCurrency(1234.56);
      expect(result).toBe('$1,234.56');
    });

    it('formats string number', () => {
      const result = formatCurrency('1234.56');
      expect(result).toBe('$1,234.56');
    });

    it('returns empty string for null/undefined', () => {
      expect(formatCurrency(null)).toBe('');
      expect(formatCurrency(undefined)).toBe('');
    });

    it('returns empty string for invalid number', () => {
      expect(formatCurrency('not-a-number')).toBe('');
    });

    it('formats with custom currency', () => {
      const result = formatCurrency(1234.56, { currency: 'EUR', locale: 'de-DE' });
      expect(result).toContain('1.234,56');
    });
  });

  describe('parseCurrency', () => {
    it('parses US formatted currency', () => {
      expect(parseCurrency('$1,234.56')).toBe(1234.56);
    });

    it('parses European formatted currency', () => {
      expect(parseCurrency('1.234,56 €')).toBe(1234.56);
    });

    it('parses plain number', () => {
      expect(parseCurrency(1234.56)).toBe(1234.56);
    });

    it('returns null for invalid input', () => {
      expect(parseCurrency('')).toBe(null);
      expect(parseCurrency(null)).toBe(null);
    });
  });
});

describe('Number Formatters', () => {
  describe('formatNumber', () => {
    it('formats number with thousands separator', () => {
      const result = formatNumber(1234567.89);
      expect(result).toBe('1,234,567.89');
    });

    it('formats string number', () => {
      const result = formatNumber('1234567.89');
      expect(result).toBe('1,234,567.89');
    });

    it('returns empty string for null/undefined', () => {
      expect(formatNumber(null)).toBe('');
      expect(formatNumber(undefined)).toBe('');
    });
  });

  describe('parseNumber', () => {
    it('parses US formatted number', () => {
      expect(parseNumberUtil('1,234.56')).toBe(1234.56);
    });

    it('parses European formatted number', () => {
      expect(parseNumberUtil('1.234,56', 'de-DE')).toBe(1234.56);
    });

    it('returns null for invalid input', () => {
      expect(parseNumberUtil('')).toBe(null);
      expect(parseNumberUtil(null)).toBe(null);
    });
  });

  describe('formatPercent', () => {
    it('formats decimal as percentage', () => {
      const result = formatPercent(0.1234);
      expect(result).toContain('12');
      expect(result).toContain('%');
    });

    it('returns empty string for null/undefined', () => {
      expect(formatPercent(null)).toBe('');
      expect(formatPercent(undefined)).toBe('');
    });
  });

  describe('formatBytes', () => {
    it('formats bytes to KB', () => {
      expect(formatBytes(1024)).toBe('1 KB');
    });

    it('formats bytes to MB', () => {
      expect(formatBytes(1048576)).toBe('1 MB');
    });

    it('formats bytes to GB', () => {
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('returns 0 Bytes for zero', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });
  });
});
