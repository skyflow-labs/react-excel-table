import { describe, it, expect } from 'vitest';
import {
  validateFile,
  sanitizeCellValue,
  sanitizeRow,
  sanitizeImportData,
  isSuspiciousFilename,
} from '../utils/security/sanitizer';
import { DEFAULT_IMPORT_SECURITY } from '../config/ExcelTableProvider';

describe('Security Utils', () => {
  describe('validateFile', () => {
    it('rejects files that are too large', () => {
      const file = new File(['x'.repeat(20 * 1024 * 1024)], 'test.csv', {
        type: 'text/csv',
      });
      const result = validateFile(file, {
        ...DEFAULT_IMPORT_SECURITY,
        maxFileSize: 10 * 1024 * 1024,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('size');
    });

    it('rejects disallowed file extensions', () => {
      const file = new File(['test'], 'test.exe', {
        type: 'application/octet-stream',
      });
      const result = validateFile(file, {
        ...DEFAULT_IMPORT_SECURITY,
        allowedExtensions: ['.csv', '.xlsx'],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('accepts valid files', () => {
      const file = new File(['col1,col2\nval1,val2'], 'test.csv', {
        type: 'text/csv',
      });
      const result = validateFile(file, DEFAULT_IMPORT_SECURITY);
      expect(result.valid).toBe(true);
    });

    it('rejects when import is disabled', () => {
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      const result = validateFile(file, {
        ...DEFAULT_IMPORT_SECURITY,
        enabled: false,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('disabled');
    });
  });

  describe('sanitizeCellValue', () => {
    it('blocks formula injection with = prefix', () => {
      const result = sanitizeCellValue('=SUM(A1:A10)', DEFAULT_IMPORT_SECURITY);
      expect(result).toBe("'=SUM(A1:A10)");
    });

    it('blocks formula injection with + prefix', () => {
      const result = sanitizeCellValue('+1+2', DEFAULT_IMPORT_SECURITY);
      expect(result).toBe("'+1+2");
    });

    it('blocks formula injection with - prefix', () => {
      const result = sanitizeCellValue('-1-2', DEFAULT_IMPORT_SECURITY);
      expect(result).toBe("'-1-2");
    });

    it('blocks formula injection with @ prefix', () => {
      const result = sanitizeCellValue('@SUM(A1)', DEFAULT_IMPORT_SECURITY);
      expect(result).toBe("'@SUM(A1)");
    });

    it('strips HTML tags', () => {
      const result = sanitizeCellValue(
        '<script>alert("xss")</script>Hello',
        DEFAULT_IMPORT_SECURITY
      );
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    it('removes javascript: protocol', () => {
      const result = sanitizeCellValue(
        'javascript:alert(1)',
        DEFAULT_IMPORT_SECURITY
      );
      expect(result).not.toContain('javascript:');
    });

    it('removes event handlers', () => {
      const result = sanitizeCellValue('onclick=alert(1)', DEFAULT_IMPORT_SECURITY);
      expect(result).not.toContain('onclick=');
    });

    it('trims whitespace when enabled', () => {
      const result = sanitizeCellValue('  hello  ', DEFAULT_IMPORT_SECURITY);
      expect(result).toBe('hello');
    });

    it('truncates long strings', () => {
      const longString = 'x'.repeat(20000);
      const result = sanitizeCellValue(longString, {
        ...DEFAULT_IMPORT_SECURITY,
        maxCellLength: 1000,
      });
      expect((result as string).length).toBe(1000);
    });

    it('preserves numbers', () => {
      const result = sanitizeCellValue(12345, DEFAULT_IMPORT_SECURITY);
      expect(result).toBe(12345);
    });

    it('preserves booleans', () => {
      const result = sanitizeCellValue(true, DEFAULT_IMPORT_SECURITY);
      expect(result).toBe(true);
    });

    it('preserves null/undefined', () => {
      expect(sanitizeCellValue(null, DEFAULT_IMPORT_SECURITY)).toBe(null);
      expect(sanitizeCellValue(undefined, DEFAULT_IMPORT_SECURITY)).toBe(undefined);
    });

    it('does not block formulas when disabled', () => {
      const result = sanitizeCellValue('=SUM(A1)', {
        ...DEFAULT_IMPORT_SECURITY,
        blockFormulaInjection: false,
      });
      expect(result).toBe('=SUM(A1)');
    });
  });

  describe('sanitizeRow', () => {
    it('sanitizes all values in a row', () => {
      const row = {
        name: '  John  ',
        formula: '=MALICIOUS()',
        html: '<b>Bold</b>',
        number: 100,
      };
      const result = sanitizeRow(row, DEFAULT_IMPORT_SECURITY);

      expect(result.name).toBe('John');
      expect(result.formula).toBe("'=MALICIOUS()");
      expect(result.html).toBe('Bold');
      expect(result.number).toBe(100);
    });
  });

  describe('sanitizeImportData', () => {
    it('sanitizes all rows and returns stats', () => {
      const data = [
        { id: '1', name: '=FORMULA', value: '<script>bad</script>' },
        { id: '2', name: 'Normal', value: 'Safe' },
      ];
      const result = sanitizeImportData(data, DEFAULT_IMPORT_SECURITY);

      expect(result.data.length).toBe(2);
      expect(result.stats.sanitizedRows).toBe(2);
      expect(result.stats.formulasBlocked).toBeGreaterThan(0);
      expect(result.stats.htmlStripped).toBeGreaterThan(0);
    });

    it('truncates data beyond maxRows', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        id: String(i),
        name: `Row ${i}`,
      }));
      const result = sanitizeImportData(data, {
        ...DEFAULT_IMPORT_SECURITY,
        maxRows: 50,
      });

      expect(result.data.length).toBe(50);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('isSuspiciousFilename', () => {
    it('detects path traversal', () => {
      expect(isSuspiciousFilename('../etc/passwd')).toBe(true);
      expect(isSuspiciousFilename('..\\windows\\system32')).toBe(true);
    });

    it('detects absolute paths', () => {
      expect(isSuspiciousFilename('/etc/passwd')).toBe(true);
      expect(isSuspiciousFilename('C:\\Windows')).toBe(true);
    });

    it('accepts normal filenames', () => {
      expect(isSuspiciousFilename('data.csv')).toBe(false);
      expect(isSuspiciousFilename('my-file_2024.xlsx')).toBe(false);
    });
  });
});
