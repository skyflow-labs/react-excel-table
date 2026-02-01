import { describe, it, expect } from 'vitest';
import {
  parseNumericValue,
  parseDateValue,
  parseBooleanValue,
  normalizeHeader,
  autoDetectColumnMapping,
} from '@/plugins/excel-import/parsers';

describe('Excel Import Parsers', () => {
  describe('parseNumericValue', () => {
    it('parses plain number', () => {
      expect(parseNumericValue(123.45)).toBe(123.45);
    });

    it('parses string number', () => {
      expect(parseNumericValue('123.45')).toBe(123.45);
    });

    it('parses US formatted number', () => {
      expect(parseNumericValue('$1,234.56')).toBe(1234.56);
    });

    it('parses European formatted number', () => {
      expect(parseNumericValue('1.234,56')).toBe(1234.56);
    });

    it('returns null for empty values', () => {
      expect(parseNumericValue(null)).toBe(null);
      expect(parseNumericValue(undefined)).toBe(null);
      expect(parseNumericValue('')).toBe(null);
    });

    it('returns null for invalid string', () => {
      expect(parseNumericValue('not a number')).toBe(null);
    });
  });

  describe('parseDateValue', () => {
    it('parses ISO date string', () => {
      const result = parseDateValue('2024-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
    });

    it('parses dd/MM/yyyy format', () => {
      const result = parseDateValue('15/01/2024');
      expect(result).toBeInstanceOf(Date);
    });

    it('parses MM/dd/yyyy format', () => {
      const result = parseDateValue('01/15/2024');
      expect(result).toBeInstanceOf(Date);
    });

    it('returns null for empty values', () => {
      expect(parseDateValue(null)).toBe(null);
      expect(parseDateValue('')).toBe(null);
    });

    it('returns null for invalid date', () => {
      expect(parseDateValue('not a date')).toBe(null);
    });

    it('handles Date object', () => {
      const date = new Date('2024-01-15');
      const result = parseDateValue(date);
      expect(result).toEqual(date);
    });
  });

  describe('parseBooleanValue', () => {
    it('returns boolean as-is', () => {
      expect(parseBooleanValue(true)).toBe(true);
      expect(parseBooleanValue(false)).toBe(false);
    });

    it('parses truthy strings', () => {
      expect(parseBooleanValue('true')).toBe(true);
      expect(parseBooleanValue('yes')).toBe(true);
      expect(parseBooleanValue('YES')).toBe(true);
      expect(parseBooleanValue('1')).toBe(true);
      expect(parseBooleanValue('si')).toBe(true);
    });

    it('parses falsy strings', () => {
      expect(parseBooleanValue('false')).toBe(false);
      expect(parseBooleanValue('no')).toBe(false);
      expect(parseBooleanValue('NO')).toBe(false);
      expect(parseBooleanValue('0')).toBe(false);
    });

    it('returns null for empty values', () => {
      expect(parseBooleanValue(null)).toBe(null);
      expect(parseBooleanValue('')).toBe(null);
    });

    it('parses number 0 and 1', () => {
      expect(parseBooleanValue(0)).toBe(false);
      expect(parseBooleanValue(1)).toBe(true);
    });
  });

  describe('normalizeHeader', () => {
    it('lowercases header', () => {
      expect(normalizeHeader('Name')).toBe('name');
    });

    it('replaces spaces with underscores', () => {
      expect(normalizeHeader('First Name')).toBe('first_name');
    });

    it('removes special characters', () => {
      expect(normalizeHeader('Name (Required)')).toBe('name_required');
    });

    it('handles multiple underscores', () => {
      expect(normalizeHeader('First   Name')).toBe('first_name');
    });

    it('trims leading/trailing underscores', () => {
      expect(normalizeHeader('_Name_')).toBe('name');
    });
  });

  describe('autoDetectColumnMapping', () => {
    interface TestData {
      id: string;
      first_name: string;
      email: string;
      amount: number;
    }

    it('maps matching headers', () => {
      const csvHeaders = ['First Name', 'Email', 'Amount'];
      const targetKeys: Array<keyof TestData> = ['first_name', 'email', 'amount'];

      const mapping = autoDetectColumnMapping(csvHeaders, targetKeys);

      expect(mapping['First Name']).toBe('first_name');
      expect(mapping['Email']).toBe('email');
      expect(mapping['Amount']).toBe('amount');
    });

    it('handles case insensitivity', () => {
      const csvHeaders = ['EMAIL', 'AMOUNT'];
      const targetKeys: Array<keyof TestData> = ['email', 'amount'];

      const mapping = autoDetectColumnMapping(csvHeaders, targetKeys);

      expect(mapping['EMAIL']).toBe('email');
      expect(mapping['AMOUNT']).toBe('amount');
    });

    it('ignores non-matching headers', () => {
      const csvHeaders = ['Unknown Column', 'Email'];
      const targetKeys: Array<keyof TestData> = ['email', 'amount'];

      const mapping = autoDetectColumnMapping(csvHeaders, targetKeys);

      expect(mapping['Unknown Column']).toBeUndefined();
      expect(mapping['Email']).toBe('email');
    });
  });
});
