import type { CellDataType, RowData, ColumnConfig } from '@/types';
import { formatDateValue } from '@/utils/formatters/date';
import { formatCurrency } from '@/utils/formatters/currency';

/**
 * Configuration for autosize calculations
 */
export interface AutosizeConfig {
  /** Default minimum column width */
  defaultMinWidth: number;
  /** Default maximum column width */
  defaultMaxWidth: number;
  /** Padding added to cell content width */
  cellPadding: number;
  /** Extra padding for header cells */
  headerPadding: number;
  /** Estimated width per character (fallback for canvas measurement) */
  charWidthEstimate: number;
  /** Default font for canvas measurement */
  defaultFont: string;
}

/**
 * Default autosize configuration
 */
const DEFAULT_AUTOSIZE_CONFIG: AutosizeConfig = {
  defaultMinWidth: 80,
  defaultMaxWidth: 400,
  cellPadding: 14,
  headerPadding: 18,
  charWidthEstimate: 6.21,
  defaultFont: '14px system-ui, -apple-system, sans-serif',
};

/**
 * Format a value for text measurement based on its data type
 */
function formatValueForMeasurement(
  value: unknown,
  dataType: CellDataType,
  dateFormat?: string
): string {
  if (value === null || value === undefined) return '';

  switch (dataType) {
    case 'date':
      return formatDateValue(value as string | Date, dateFormat || 'dd/MM/yyyy HH:mm:ss');
    case 'currency':
      return formatCurrency(value as number);
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'number':
      return value ? Number(value).toLocaleString() : '';
    default:
      return String(value || '');
  }
}

/**
 * Estimate text width using character count (fallback)
 */
function estimateTextWidth(text: string, config: AutosizeConfig = DEFAULT_AUTOSIZE_CONFIG): number {
  return text.length * config.charWidthEstimate;
}

/**
 * Measure text width using canvas (precise)
 * Falls back to estimation in SSR environments
 */
export function measureTextWidth(
  text: string,
  font: string = DEFAULT_AUTOSIZE_CONFIG.defaultFont
): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return estimateTextWidth(text);
  }

  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      return estimateTextWidth(text);
    }

    context.font = font;
    const measurement = context.measureText(text);

    return Math.ceil(measurement.width);
  } catch {
    return estimateTextWidth(text);
  }
}

/**
 * Calculate optimal column width based on content (fast estimation)
 *
 * @param data - Array of row data
 * @param accessorKey - Column accessor key
 * @param header - Column header text
 * @param dataType - Cell data type
 * @param dateFormat - Date format string (for date columns)
 * @param minWidth - Minimum column width
 * @param maxWidth - Maximum column width
 * @returns Calculated optimal width
 */
export function calculateOptimalColumnWidth<TData extends RowData>(
  data: TData[],
  accessorKey: keyof TData,
  header: string,
  dataType: CellDataType = 'string',
  dateFormat?: string,
  minWidth: number = DEFAULT_AUTOSIZE_CONFIG.defaultMinWidth,
  maxWidth: number = DEFAULT_AUTOSIZE_CONFIG.defaultMaxWidth,
  config: Partial<AutosizeConfig> = {}
): number {
  const mergedConfig = { ...DEFAULT_AUTOSIZE_CONFIG, ...config };
  let maxContentWidth = 0;

  // Measure header width
  const headerWidth = estimateTextWidth(header, mergedConfig) + mergedConfig.headerPadding;
  maxContentWidth = Math.max(maxContentWidth, headerWidth);

  // Measure content width
  for (const row of data) {
    const value = row[accessorKey];
    const formattedValue = formatValueForMeasurement(value, dataType, dateFormat);
    const contentWidth = estimateTextWidth(formattedValue, mergedConfig) + mergedConfig.cellPadding;
    maxContentWidth = Math.max(maxContentWidth, contentWidth);
  }

  return Math.min(Math.max(maxContentWidth, minWidth), maxWidth);
}

/**
 * Calculate optimal column width using precise canvas measurement
 *
 * @param data - Array of row data
 * @param accessorKey - Column accessor key
 * @param header - Column header text
 * @param dataType - Cell data type
 * @param dateFormat - Date format string (for date columns)
 * @param minWidth - Minimum column width
 * @param maxWidth - Maximum column width
 * @param font - Font to use for measurement
 * @returns Calculated optimal width
 */
export function calculateOptimalColumnWidthPrecise<TData extends RowData>(
  data: TData[],
  accessorKey: keyof TData,
  header: string,
  dataType: CellDataType = 'string',
  dateFormat?: string,
  minWidth: number = DEFAULT_AUTOSIZE_CONFIG.defaultMinWidth,
  maxWidth: number = DEFAULT_AUTOSIZE_CONFIG.defaultMaxWidth,
  font: string = DEFAULT_AUTOSIZE_CONFIG.defaultFont
): number {
  const config = DEFAULT_AUTOSIZE_CONFIG;
  let maxContentWidth = 0;

  // Measure header width precisely
  const headerWidth = measureTextWidth(header, font) + config.headerPadding;
  maxContentWidth = Math.max(maxContentWidth, headerWidth);

  // Measure content width precisely
  for (const row of data) {
    const value = row[accessorKey];
    const formattedValue = formatValueForMeasurement(value, dataType, dateFormat);
    const contentWidth = measureTextWidth(formattedValue, font) + config.cellPadding;
    maxContentWidth = Math.max(maxContentWidth, contentWidth);
  }

  return Math.min(Math.max(maxContentWidth, minWidth), maxWidth);
}

/**
 * Calculate autosize widths for multiple columns
 *
 * @param data - Array of row data
 * @param columnConfigs - Column configurations
 * @param usePreciseMeasurement - Whether to use canvas measurement
 * @returns Record of column IDs to calculated widths
 */
export function calculateAutosizeWidths<TData extends RowData>(
  data: TData[],
  columnConfigs: ColumnConfig<TData>[],
  usePreciseMeasurement: boolean = false
): Record<string, number> {
  const widths: Record<string, number> = {};
  const calculateWidth = usePreciseMeasurement
    ? calculateOptimalColumnWidthPrecise
    : calculateOptimalColumnWidth;

  for (const config of columnConfigs) {
    if (config.autosize) {
      const optimalWidth = calculateWidth(
        data,
        config.accessorKey,
        config.header,
        config.dataType || 'string',
        config.dateFormat,
        config.minWidth,
        config.maxWidth
      );
      widths[String(config.accessorKey)] = optimalWidth;
    } else if (config.size) {
      widths[String(config.accessorKey)] = config.size;
    }
  }

  return widths;
}

/**
 * Get the display width for a column
 *
 * @param config - Column configuration
 * @param calculatedWidths - Pre-calculated widths
 * @param isExpanded - Whether the column is expanded
 * @returns Column width to use
 */
export function getColumnDisplayWidth<TData extends RowData>(
  config: ColumnConfig<TData>,
  calculatedWidths: Record<string, number>,
  isExpanded: boolean = false
): number {
  const key = String(config.accessorKey);

  if (config.autosize) {
    if (isExpanded && calculatedWidths[key]) {
      return calculatedWidths[key];
    }
    return config.minWidth ?? DEFAULT_AUTOSIZE_CONFIG.defaultMinWidth;
  }

  return config.size ?? calculatedWidths[key] ?? DEFAULT_AUTOSIZE_CONFIG.defaultMinWidth;
}
