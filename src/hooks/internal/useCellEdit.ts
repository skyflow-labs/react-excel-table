import { useCallback } from 'react';
import type { CellValue, ModifiedCells, RowData } from '@/types';

/**
 * Configuration for cell edit behavior
 */
export interface CellEditConfig {
  /**
   * Linked amount columns - when one is set, the other is cleared
   * e.g., { deposit_amount: 'withdrawal_amount' }
   */
  linkedAmountColumns?: Record<string, string>;

  /**
   * Category columns that should also update a common field
   * e.g., { categoryIngreso: 'category_id', categoryEgreso: 'category_id' }
   */
  categoryColumns?: Record<string, string>;

  /**
   * Custom value transformer for specific columns
   */
  transformers?: Record<string, (value: CellValue, columnId: string) => CellValue>;
}

/**
 * Props for the useCellEdit hook
 */
export interface UseCellEditProps<TData extends RowData> {
  /** Callback to update the data array */
  setData?: React.Dispatch<React.SetStateAction<TData[]>>;

  /** Callback to update modified cells */
  setModifiedCells: React.Dispatch<React.SetStateAction<ModifiedCells>>;

  /** Configuration for edit behavior */
  config?: CellEditConfig;

  /** Callback when a cell is edited */
  onCellEdit?: (rowId: string, columnId: string, value: CellValue) => void;
}

/**
 * Hook for handling cell edits with linked columns and transformations
 *
 * @param props - Hook configuration
 * @returns Cell edit handler function
 *
 * @example
 * ```tsx
 * const handleCellEdit = useCellEdit({
 *   setModifiedCells,
 *   config: {
 *     linkedAmountColumns: {
 *       deposit_amount: 'withdrawal_amount',
 *       withdrawal_amount: 'deposit_amount',
 *     },
 *   },
 * });
 *
 * // Later in EditableCell
 * handleCellEdit(rowId, 'deposit_amount', 100);
 * // This will also clear withdrawal_amount
 * ```
 */
export function useCellEdit<TData extends RowData>({
  setData,
  setModifiedCells,
  config = {},
  onCellEdit,
}: UseCellEditProps<TData>) {
  const { linkedAmountColumns = {}, categoryColumns = {}, transformers = {} } = config;

  return useCallback(
    (rowId: string, columnId: string, value: CellValue) => {
      // Apply custom transformer if available
      let processedValue = value;
      if (transformers[columnId]) {
        processedValue = transformers[columnId](value, columnId);
      }

      // Handle amount columns - clear linked column if setting a non-zero value
      const linkedColumn = linkedAmountColumns[columnId];
      const isSettingAmount = linkedColumn && typeof processedValue === 'number';
      const shouldClearLinked = isSettingAmount && (processedValue as number) > 0;

      // Handle category columns - sync to common field
      const commonCategoryField = categoryColumns[columnId];

      // Build the updates object
      const updates: Record<string, CellValue> = {
        [columnId]: processedValue,
      };

      if (shouldClearLinked) {
        updates[linkedColumn] = null;
      }

      if (commonCategoryField) {
        updates[commonCategoryField] = processedValue;
      }

      // Update data array if provided
      if (setData) {
        setData((prev: TData[]) =>
          prev.map((row) =>
            row.id === rowId
              ? {
                  ...row,
                  ...updates,
                }
              : row
          )
        );
      }

      // Update modified cells tracking
      setModifiedCells((prev: ModifiedCells) => ({
        ...prev,
        [rowId]: {
          ...(prev[rowId] || {}),
          ...updates,
        },
      }));

      // Call external callback if provided
      onCellEdit?.(rowId, columnId, processedValue);
    },
    [setData, setModifiedCells, linkedAmountColumns, categoryColumns, transformers, onCellEdit]
  );
}

/**
 * Create a simple cell edit handler without data updates
 *
 * @param setModifiedCells - Function to update modified cells
 * @returns Cell edit handler function
 */
export function useSimpleCellEdit(
  setModifiedCells: React.Dispatch<React.SetStateAction<ModifiedCells>>
) {
  return useCallback(
    (rowId: string, columnId: string, value: CellValue) => {
      setModifiedCells((prev) => ({
        ...prev,
        [rowId]: {
          ...(prev[rowId] || {}),
          [columnId]: value,
        },
      }));
    },
    [setModifiedCells]
  );
}
