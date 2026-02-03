import { useCallback, useState } from 'react';
import type { RowData, ExcelExportOptions, ColumnConfig, CellValue } from '@/types';
import { formatDateValue } from '@/utils/formatters/date';
import { formatCurrency } from '@/utils/formatters/currency';

/**
 * Return value from useExcelExport hook
 */
export interface UseExcelExportReturn {
  /** Export data to Excel */
  exportToExcel: () => Promise<void>;

  /** Whether export is in progress */
  isExporting: boolean;

  /** Last error */
  error: Error | null;
}

/**
 * Hook for exporting data to Excel format
 *
 * @param data - Data to export
 * @param options - Export configuration
 * @returns Export functions and state
 *
 * @example
 * ```tsx
 * const { exportToExcel, isExporting } = useExcelExport(transactions, {
 *   filename: 'transactions',
 *   columns: columnConfigs,
 * });
 *
 * <button onClick={exportToExcel} disabled={isExporting}>
 *   {isExporting ? 'Exporting...' : 'Export to Excel'}
 * </button>
 * ```
 */
export function useExcelExport<TData extends RowData>(
  data: TData[],
  options: ExcelExportOptions<TData> = {}
): UseExcelExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportToExcel = useCallback(async () => {
    const {
      filename = 'export',
      sheetName = 'Sheet1',
      columns,
      includeHeaders = true,
      headerLabels = {},
      excludeColumns = [],
      formatters = {},
      headerStyle,
      dataStyle,
      onExportStart,
      onExportComplete,
      onExportError,
    } = options;

    setIsExporting(true);
    setError(null);
    onExportStart?.();

    try {
      // Dynamically import exceljs
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      // Determine columns to export
      let exportColumns: Array<{ key: keyof TData; header: string; dataType?: string }> = [];

      if (columns) {
        exportColumns = columns
          .filter((col) => !excludeColumns.includes(col.accessorKey))
          .map((col) => ({
            key: col.accessorKey,
            header: headerLabels[String(col.accessorKey)] || col.header,
            dataType: col.dataType,
          }));
      } else if (data.length > 0) {
        exportColumns = Object.keys(data[0])
          .filter((key) => key !== 'id' && !excludeColumns.includes(key as keyof TData))
          .map((key) => ({
            key: key as keyof TData,
            header: headerLabels[key] || key,
          }));
      }

      // Set up worksheet columns
      worksheet.columns = exportColumns.map((col) => ({
        header: col.header,
        key: String(col.key),
        width: 15,
      }));

      // Add data rows
      for (const row of data) {
        const rowData: Record<string, unknown> = {};

        for (const col of exportColumns) {
          const value = row[col.key];

          // Apply custom formatter
          let formattedValue: unknown = value;
          if (formatters[String(col.key)]) {
            formattedValue = formatters[String(col.key)](value as CellValue, row);
          } else if (col.dataType === 'currency') {
            formattedValue = formatCurrency(value as number);
          } else if (col.dataType === 'date' && value) {
            formattedValue = formatDateValue(value as string, 'yyyy-MM-dd');
          }

          // SECURITY: Prevent formula injection in Excel export
          if (typeof formattedValue === 'string') {
            formattedValue = neutralizeFormulaInjection(formattedValue);
          }

          rowData[String(col.key)] = formattedValue;
        }

        worksheet.addRow(rowData);
      }

      // Apply header styles
      if (includeHeaders && headerStyle) {
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
          if (headerStyle.font) {
            cell.font = {
              name: headerStyle.font.name,
              size: headerStyle.font.size,
              bold: headerStyle.font.bold,
              italic: headerStyle.font.italic,
              color: headerStyle.font.color
                ? { argb: headerStyle.font.color.replace('#', '') }
                : undefined,
            };
          }
          if (headerStyle.fill) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: headerStyle.fill.fgColor.replace('#', '') },
            };
          }
          if (headerStyle.alignment) {
            cell.alignment = headerStyle.alignment;
          }
        });
      }

      // Apply data styles
      if (dataStyle) {
        for (let i = 2; i <= data.length + 1; i++) {
          const row = worksheet.getRow(i);
          row.eachCell((cell) => {
            if (dataStyle.font) {
              cell.font = {
                name: dataStyle.font.name,
                size: dataStyle.font.size,
                bold: dataStyle.font.bold,
                italic: dataStyle.font.italic,
              };
            }
            if (dataStyle.alignment) {
              cell.alignment = dataStyle.alignment;
            }
          });
        }
      }

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      // Create blob and download
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExporting(false);
      onExportComplete?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Export failed');
      setError(error);
      setIsExporting(false);
      onExportError?.(error);
      throw error;
    }
  }, [data, options]);

  return {
    exportToExcel,
    isExporting,
    error,
  };
}

/**
 * Patterns that can trigger formula execution in spreadsheet applications
 */
const FORMULA_INJECTION_PATTERNS = /^[=+\-@\t\r]/;

/**
 * Neutralize formula injection by prefixing dangerous strings
 * This prevents CSV injection attacks when files are opened in Excel/Sheets
 */
function neutralizeFormulaInjection(value: string): string {
  if (FORMULA_INJECTION_PATTERNS.test(value)) {
    // Prefix with single quote to prevent formula execution
    return "'" + value;
  }
  return value;
}

/**
 * Options for CSV export
 */
export interface CSVExportOptions<TData extends RowData> {
  filename?: string;
  columns?: ColumnConfig<TData>[];
  excludeColumns?: Array<keyof TData>;
  headerLabels?: Record<string, string>;
  formatters?: Record<string, (value: CellValue, row: TData) => string>;
  /**
   * Prevent formula injection by prefixing dangerous values
   * @default true
   */
  preventFormulaInjection?: boolean;
}

/**
 * Export data to CSV format (simpler alternative to Excel)
 *
 * @security By default, this function prevents CSV injection attacks by
 * prefixing values that start with =, +, -, @, tab, or carriage return
 * with a single quote. Set `preventFormulaInjection: false` to disable.
 */
export function exportToCSV<TData extends RowData>(
  data: TData[],
  options: CSVExportOptions<TData> = {}
): void {
  const {
    filename = 'export',
    columns,
    excludeColumns = [],
    headerLabels = {},
    formatters = {},
    preventFormulaInjection = true,
  } = options;

  // Determine columns to export
  let exportColumns: Array<{ key: keyof TData; header: string }> = [];

  if (columns) {
    exportColumns = columns
      .filter((col) => !excludeColumns.includes(col.accessorKey))
      .map((col) => ({
        key: col.accessorKey,
        header: headerLabels[String(col.accessorKey)] || col.header,
      }));
  } else if (data.length > 0) {
    exportColumns = Object.keys(data[0])
      .filter((key) => key !== 'id' && !excludeColumns.includes(key as keyof TData))
      .map((key) => ({
        key: key as keyof TData,
        header: headerLabels[key] || key,
      }));
  }

  // Build CSV content
  const headers = exportColumns
    .map((col) => {
      let header = col.header;
      // SECURITY: Prevent formula injection in CSV headers
      if (preventFormulaInjection) {
        header = neutralizeFormulaInjection(header);
      }
      return `"${header}"`;
    })
    .join(',');
  const rows = data.map((row) => {
    return exportColumns
      .map((col) => {
        const rawValue = row[col.key];
        let formattedValue: unknown = rawValue;

        if (formatters[String(col.key)]) {
          formattedValue = formatters[String(col.key)](rawValue as CellValue, row);
        }

        // Convert to string and escape quotes
        let stringValue = String(formattedValue ?? '').replace(/"/g, '""');

        // SECURITY: Prevent formula injection attacks
        if (preventFormulaInjection) {
          stringValue = neutralizeFormulaInjection(stringValue);
        }

        return `"${stringValue}"`;
      })
      .join(',');
  });

  const csv = [headers, ...rows].join('\n');

  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
