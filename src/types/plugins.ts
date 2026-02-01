import type { RowData, ColumnConfig } from './column';
import type { CellValue } from './cell';

/**
 * Excel import plugin options
 */
export interface ExcelImportOptions<TData extends RowData = RowData> {
  /**
   * Column mapping from CSV headers to data keys
   * Key is the CSV header name, value is the data key
   */
  columnMapping?: Record<string, keyof TData>;

  /**
   * Custom date formats to try when parsing dates
   */
  dateFormats?: string[];

  /**
   * Whether to skip empty rows
   * @default true
   */
  skipEmptyRows?: boolean;

  /**
   * Maximum number of rows to import
   */
  maxRows?: number;

  /**
   * Custom value transformer for specific columns
   */
  transformers?: Record<string, (value: unknown) => CellValue>;

  /**
   * Validator function to run on each imported row
   * Return an error message to reject the row
   */
  validator?: (row: Partial<TData>, index: number) => string | null;

  /**
   * Callback when import starts
   */
  onImportStart?: () => void;

  /**
   * Callback when import completes
   */
  onImportComplete?: (rows: TData[]) => void;

  /**
   * Callback when import fails
   */
  onImportError?: (error: Error) => void;
}

/**
 * Excel import result
 */
export interface ExcelImportResult<TData extends RowData> {
  /** Successfully imported rows */
  rows: TData[];

  /** Rows that failed validation */
  errors: Array<{
    index: number;
    error: string;
    data: Partial<TData>;
  }>;

  /** Warnings during import */
  warnings: string[];
}

/**
 * Excel export plugin options
 */
export interface ExcelExportOptions<TData extends RowData = RowData> {
  /** Filename for the exported file (without extension) */
  filename?: string;

  /** Sheet name */
  sheetName?: string;

  /** Column configurations for export */
  columns?: ColumnConfig<TData>[];

  /**
   * Whether to include headers
   * @default true
   */
  includeHeaders?: boolean;

  /**
   * Custom header labels (key is column accessor, value is label)
   */
  headerLabels?: Record<string, string>;

  /**
   * Columns to exclude from export
   */
  excludeColumns?: Array<keyof TData>;

  /**
   * Custom value formatter for specific columns
   */
  formatters?: Record<string, (value: CellValue, row: TData) => string | number>;

  /**
   * Header row style
   */
  headerStyle?: ExcelCellStyle;

  /**
   * Data row style
   */
  dataStyle?: ExcelCellStyle;

  /**
   * Callback when export starts
   */
  onExportStart?: () => void;

  /**
   * Callback when export completes
   */
  onExportComplete?: () => void;

  /**
   * Callback when export fails
   */
  onExportError?: (error: Error) => void;
}

/**
 * Excel cell style options
 */
export interface ExcelCellStyle {
  /** Font configuration */
  font?: {
    name?: string;
    size?: number;
    bold?: boolean;
    italic?: boolean;
    color?: string;
  };

  /** Fill/background configuration */
  fill?: {
    type: 'pattern';
    pattern: 'solid';
    fgColor: string;
  };

  /** Border configuration */
  border?: {
    top?: ExcelBorderStyle;
    bottom?: ExcelBorderStyle;
    left?: ExcelBorderStyle;
    right?: ExcelBorderStyle;
  };

  /** Alignment configuration */
  alignment?: {
    horizontal?: 'left' | 'center' | 'right';
    vertical?: 'top' | 'middle' | 'bottom';
    wrapText?: boolean;
  };

  /** Number format */
  numFmt?: string;
}

/**
 * Excel border style
 */
export interface ExcelBorderStyle {
  style: 'thin' | 'medium' | 'thick' | 'dotted' | 'dashed';
  color?: string;
}

/**
 * Notification adapter interface for plugins
 */
export interface NotificationAdapter {
  /** Show a success message */
  success: (message: string) => void;

  /** Show an error message */
  error: (message: string) => void;

  /** Show a warning message */
  warning: (message: string) => void;

  /** Show an info message */
  info: (message: string) => void;

  /**
   * Show a promise-based notification
   * Shows pending, success, and error states
   */
  promise?: <T>(
    promise: Promise<T>,
    messages: {
      pending: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => Promise<T>;
}

/**
 * Default console-based notification adapter
 */
export const consoleNotificationAdapter: NotificationAdapter = {
  success: (message) => console.log(`[SUCCESS] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  warning: (message) => console.warn(`[WARNING] ${message}`),
  info: (message) => console.info(`[INFO] ${message}`),
};
