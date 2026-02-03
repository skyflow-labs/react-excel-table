import { describe, it, expect } from 'vitest';
import {
  measureTextWidth,
  calculateOptimalColumnWidth,
  calculateAutosizeWidths,
  getColumnDisplayWidth,
} from '@/utils/autosize';
import type { ColumnConfig, RowData } from '@/types';

interface TestData extends RowData {
  id: string;
  name: string;
  amount: number;
  date: string;
}

const testData: TestData[] = [
  { id: '1', name: 'Short', amount: 100, date: '2024-01-15' },
  { id: '2', name: 'Medium length name', amount: 1000, date: '2024-02-20' },
  { id: '3', name: 'This is a longer name for testing', amount: 10000, date: '2024-03-25' },
];

describe('Autosize Calculator', () => {
  describe('measureTextWidth', () => {
    it('measures text width', () => {
      const width = measureTextWidth('Hello World');
      expect(width).toBeGreaterThan(0);
    });

    it('returns larger width for longer text', () => {
      const short = measureTextWidth('Hi');
      const long = measureTextWidth('Hello World, this is a test');
      expect(long).toBeGreaterThan(short);
    });

    it('handles empty string', () => {
      const width = measureTextWidth('');
      expect(width).toBe(0);
    });
  });

  describe('calculateOptimalColumnWidth', () => {
    it('calculates width for string column', () => {
      const width = calculateOptimalColumnWidth(
        testData,
        'name',
        'Name',
        'string'
      );
      expect(width).toBeGreaterThan(80);
      expect(width).toBeLessThanOrEqual(400);
    });

    it('respects minWidth', () => {
      const width = calculateOptimalColumnWidth(
        testData,
        'name',
        'N',
        'string',
        undefined,
        150 // minWidth
      );
      expect(width).toBeGreaterThanOrEqual(150);
    });

    it('respects maxWidth', () => {
      const width = calculateOptimalColumnWidth(
        testData,
        'name',
        'Very Long Header That Should Be Constrained',
        'string',
        undefined,
        80,
        200 // maxWidth
      );
      expect(width).toBeLessThanOrEqual(200);
    });

    it('handles empty data', () => {
      const width = calculateOptimalColumnWidth(
        [],
        'name',
        'Name',
        'string'
      );
      expect(width).toBeGreaterThanOrEqual(80);
    });
  });

  describe('calculateAutosizeWidths', () => {
    const columns: ColumnConfig<TestData>[] = [
      { accessorKey: 'name', header: 'Name', autosize: true },
      { accessorKey: 'amount', header: 'Amount', dataType: 'currency', autosize: true },
      { accessorKey: 'date', header: 'Date', dataType: 'date', size: 120 },
    ];

    it('calculates widths for autosize columns', () => {
      const widths = calculateAutosizeWidths(testData, columns);
      expect(widths.name).toBeDefined();
      expect(widths.amount).toBeDefined();
    });

    it('uses fixed size for non-autosize columns', () => {
      const widths = calculateAutosizeWidths(testData, columns);
      expect(widths.date).toBe(120);
    });

    it('returns min widths for empty data', () => {
      const widths = calculateAutosizeWidths([], columns);
      // With empty data, columns have at least their min widths (header measurement may exceed minWidth)
      expect(widths.name).toBeGreaterThanOrEqual(80); // minWidth or header-derived
      expect(widths.amount).toBeGreaterThanOrEqual(80); // minWidth or header-derived
      expect(widths.date).toBe(120); // fixed size
    });
  });

  describe('getColumnDisplayWidth', () => {
    it('returns minWidth when not expanded', () => {
      const config: ColumnConfig<TestData> = {
        accessorKey: 'name',
        header: 'Name',
        autosize: true,
        minWidth: 100,
      };
      const width = getColumnDisplayWidth(config, { name: 200 }, false);
      expect(width).toBe(100);
    });

    it('returns calculated width when expanded', () => {
      const config: ColumnConfig<TestData> = {
        accessorKey: 'name',
        header: 'Name',
        autosize: true,
        minWidth: 100,
      };
      const width = getColumnDisplayWidth(config, { name: 200 }, true);
      expect(width).toBe(200);
    });

    it('returns fixed size for non-autosize columns', () => {
      const config: ColumnConfig<TestData> = {
        accessorKey: 'name',
        header: 'Name',
        size: 150,
      };
      const width = getColumnDisplayWidth(config, {}, false);
      expect(width).toBe(150);
    });
  });
});
