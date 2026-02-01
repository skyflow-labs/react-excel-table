import { useEffect, useState, useCallback } from 'react';
import type { RowData, ColumnConfig, CellDataType } from '@/types';
import {
  calculateAutosizeWidths,
  calculateOptimalColumnWidthPrecise,
} from '@/utils/autosize/calculator';

/**
 * Options for the useAutosize hook
 */
export interface UseAutosizeOptions<TData extends RowData> {
  /** Data array to measure */
  data: TData[];

  /** Column configurations */
  columns: ColumnConfig<TData>[];

  /** Enable autosize calculation */
  enabled?: boolean;

  /** Recalculate when data changes */
  recalculateOnDataChange?: boolean;

  /** Use precise canvas measurement (slower but more accurate) */
  usePreciseMeasurement?: boolean;
}

/**
 * Return value from useAutosize hook
 */
export interface UseAutosizeReturn {
  /** Calculated column widths */
  columnWidths: Record<string, number>;

  /** Manually trigger recalculation */
  recalculateWidths: () => void;

  /** Whether calculation is in progress */
  isCalculating: boolean;
}

/**
 * Hook for calculating optimal column widths based on content
 *
 * @param options - Hook configuration
 * @returns Column widths and control functions
 *
 * @example
 * ```tsx
 * const { columnWidths, recalculateWidths, isCalculating } = useAutosize({
 *   data,
 *   columns,
 *   enabled: true,
 *   usePreciseMeasurement: false,
 * });
 * ```
 */
export function useAutosize<TData extends RowData>({
  data,
  columns,
  enabled = true,
  recalculateOnDataChange = true,
  usePreciseMeasurement = false,
}: UseAutosizeOptions<TData>): UseAutosizeReturn {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  const recalculateWidths = useCallback(async () => {
    if (!enabled || !data.length || !columns.length) {
      setColumnWidths({});
      return;
    }

    setIsCalculating(true);

    try {
      if (usePreciseMeasurement) {
        const widths: Record<string, number> = {};

        // Calculate precise widths with async batching
        for (const config of columns) {
          if (config.autosize) {
            const width = await new Promise<number>((resolve) => {
              requestAnimationFrame(() => {
                const calculatedWidth = calculateOptimalColumnWidthPrecise(
                  data,
                  config.accessorKey,
                  config.header,
                  (config.dataType || 'string') as CellDataType,
                  config.dateFormat,
                  config.minWidth,
                  config.maxWidth
                );
                resolve(calculatedWidth);
              });
            });
            widths[String(config.accessorKey)] = width;
          } else if (config.size) {
            widths[String(config.accessorKey)] = config.size;
          }
        }

        setColumnWidths(widths);
      } else {
        // Use faster estimation
        const widths = calculateAutosizeWidths(data, columns, false);
        setColumnWidths(widths);
      }
    } catch (error) {
      console.error('Error calculating column widths:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [data, columns, enabled, usePreciseMeasurement]);

  // Recalculate on data change
  useEffect(() => {
    if (recalculateOnDataChange) {
      recalculateWidths();
    }
  }, [data, recalculateWidths, recalculateOnDataChange]);

  // Recalculate on column config change
  useEffect(() => {
    recalculateWidths();
  }, [columns, recalculateWidths]);

  return {
    columnWidths,
    recalculateWidths,
    isCalculating,
  };
}

/**
 * Simple autosize hook with basic options
 *
 * @param data - Data array to measure
 * @param columns - Column configurations
 * @returns Calculated column widths
 */
export function useBasicAutosize<TData extends RowData>(
  data: TData[],
  columns: ColumnConfig<TData>[]
): Record<string, number> {
  const { columnWidths } = useAutosize({
    data,
    columns,
    enabled: true,
    recalculateOnDataChange: true,
    usePreciseMeasurement: false,
  });

  return columnWidths;
}

/**
 * Precise autosize hook with canvas measurement
 *
 * @param data - Data array to measure
 * @param columns - Column configurations
 * @returns Autosize state and functions
 */
export function usePreciseAutosize<TData extends RowData>(
  data: TData[],
  columns: ColumnConfig<TData>[]
): UseAutosizeReturn {
  return useAutosize({
    data,
    columns,
    enabled: true,
    recalculateOnDataChange: true,
    usePreciseMeasurement: true,
  });
}
