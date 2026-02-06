import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { Row, Column, Table } from '@tanstack/react-table';
import type {
  CellDataType,
  CellValue,
  ModifiedCells,
  ColumnConfig,
  SelectOption,
  RowData,
} from '@/types';
import { dateInputToISO, isoToDateInput } from '@/utils/formatters/date';
import { TextCell } from './TextCell';
import { NumberCell } from './NumberCell';
import { CurrencyCell } from './CurrencyCell';
import { DateCell } from './DateCell';
import { SelectCell } from './SelectCell';
import { BooleanCell } from './BooleanCell';
import { canNavigateHorizontally } from '@/hooks/internal/useKeyboardNavigation';

export interface EditableCellProps<TData extends RowData> {
  /** Initial cell value */
  value: CellValue;

  /** Row instance */
  row: Row<TData>;

  /** Column instance */
  column: Column<TData, unknown>;

  /** Cell edit handler */
  onEdit: (rowId: string, columnId: string, value: CellValue) => void;

  /** Table instance */
  table: Table<TData>;

  /** Modified cells record */
  modifiedCells: ModifiedCells;

  /** Modified cells setter */
  setModifiedCells: React.Dispatch<React.SetStateAction<ModifiedCells>>;

  /** Value formatter for display */
  formatter?: (value: CellValue) => string;

  /** Cell data type */
  dataType?: CellDataType;
}

/**
 * Parse a numeric value from string or number
 */
function parseNumber(value: CellValue): number {
  if (value === null || value === undefined || value === '') return 0;
  return typeof value === 'number' ? value : parseFloat(String(value)) || 0;
}

/**
 * Main editable cell component
 * Handles all cell types and keyboard navigation
 */
export function EditableCell<TData extends RowData>({
  value: initialValue,
  row,
  column,
  onEdit,
  table,
  modifiedCells,
  setModifiedCells,
  formatter,
  dataType = 'string',
}: EditableCellProps<TData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [_searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Ref to track locally saved values before modifiedCells prop catches up
  // This fixes a react-window virtualization issue where the column definition
  // closure captures a stale modifiedCells reference (due to useEffect delay),
  // causing the cell to briefly display the old value after blur.
  const hasSavedValueRef = useRef(false);
  const savedValueRef = useRef<CellValue>(null);

  // Computed properties
  const rowId = row.original.id;
  const columnId = column.id;
  const columnIndex = column.getIndex();
  const rowIndex = row.index;
  const columnDef = column.columnDef as ColumnConfig<TData>;
  const meta = columnDef?.meta;

  // Cell type checks
  const cellTypes = useMemo(
    () => ({
      isCurrencyColumn: dataType === 'currency',
      isNumberColumn: dataType === 'number' || dataType === 'currency',
      isSelectColumn: dataType === 'select',
      isDateColumn: dataType === 'date',
      isBooleanColumn: dataType === 'boolean',
    }),
    [dataType]
  );

  // Check if cell is modified - accounts for stale modifiedCells from column closures
  const modifiedValue = modifiedCells[rowId]?.[columnId];
  const hasModifiedEntry = modifiedValue !== undefined;

  let currentValue: CellValue;
  if (hasModifiedEntry) {
    if (hasSavedValueRef.current && savedValueRef.current !== modifiedValue) {
      // We have a newer saved value that modifiedCells hasn't caught up to yet
      currentValue = savedValueRef.current;
    } else {
      // modifiedCells is current - use it and clear the saved ref
      currentValue = modifiedValue;
      hasSavedValueRef.current = false;
    }
  } else if (hasSavedValueRef.current) {
    // modifiedCells doesn't have our entry yet (stale closure) - use saved value
    currentValue = savedValueRef.current;
  } else {
    currentValue = initialValue;
  }

  const isCellModified = hasModifiedEntry || hasSavedValueRef.current;

  // Get select options
  const selectOptions = useMemo<SelectOption[]>(() => {
    if (!cellTypes.isSelectColumn) return [];

    // Check for dynamic options function
    const getDynamicOptions = meta?.getDynamicSelectOptions;
    if (getDynamicOptions && typeof getDynamicOptions === 'function') {
      return getDynamicOptions(rowId, modifiedCells);
    }

    return meta?.selectOptions || [];
  }, [cellTypes.isSelectColumn, meta, rowId, modifiedCells]);

  // Safe value helper
  const safeValue = useCallback(
    (val: CellValue): CellValue => {
      if (val === null || val === undefined) {
        return cellTypes.isNumberColumn ? 0 : '';
      }
      return val;
    },
    [cellTypes.isNumberColumn]
  );

  // Get initial editing value
  const getInitialValue = useCallback((): string | number => {
    if (cellTypes.isSelectColumn) return String(safeValue(currentValue));
    if (cellTypes.isDateColumn) return isoToDateInput(String(currentValue || ''));
    if (cellTypes.isBooleanColumn) return currentValue ? 1 : 0;
    return safeValue(currentValue) as string | number;
  }, [cellTypes, currentValue, safeValue]);

  const [editValue, setEditValue] = useState<string | number>(getInitialValue());

  // Re-sync editValue when currentValue changes externally (e.g., discard, external data update)
  // but only when the cell is NOT being edited to avoid overwriting user input
  useEffect(() => {
    if (!isEditing) {
      setEditValue(getInitialValue());
    }
  }, [currentValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (cellTypes.isSelectColumn) {
        setSearchTerm('');
      } else if (inputRef.current.select) {
        inputRef.current.select();
      }
    }
  }, [isEditing, cellTypes.isSelectColumn]);

  // Navigation helper
  const navigateToCell = useCallback(
    (newRowIndex: number, newColumnIndex: number) => {
      if (!table?.getRowModel) return;

      const rows = table.getRowModel().rows;
      const columns = table.getAllColumns();

      const isValidCell =
        newRowIndex >= 0 &&
        newRowIndex < rows.length &&
        newColumnIndex >= 0 &&
        newColumnIndex < columns.length;

      if (isValidCell) {
        requestAnimationFrame(() => {
          const nextCell = document.querySelector(
            `[data-row="${newRowIndex}"][data-col="${newColumnIndex}"]`
          ) as HTMLElement;
          if (nextCell) nextCell.click();
        });
      }
    },
    [table]
  );

  // Process value for saving
  const processValue = useCallback(
    (rawValue: CellValue): CellValue => {
      if (rawValue === null || rawValue === undefined) {
        return cellTypes.isNumberColumn ? 0 : '';
      }
      if (cellTypes.isCurrencyColumn || cellTypes.isNumberColumn) {
        return parseNumber(rawValue);
      }
      if (cellTypes.isDateColumn) {
        return dateInputToISO(String(rawValue));
      }
      return rawValue;
    },
    [cellTypes]
  );

  // Update cell value
  const updateCellValue = useCallback(
    (newValue: CellValue) => {
      const processedValue = processValue(newValue);

      // Store the saved value locally so we can display it immediately,
      // even before modifiedCells prop catches up from the parent
      hasSavedValueRef.current = true;
      savedValueRef.current = processedValue;

      onEdit(rowId, columnId, processedValue);
      setModifiedCells((prev) => ({
        ...prev,
        [rowId]: { ...prev[rowId], [columnId]: processedValue },
      }));
      setEditValue(processedValue as string | number);
    },
    [processValue, onEdit, rowId, columnId, setModifiedCells]
  );

  // Reset editing state
  const resetState = useCallback(() => {
    setIsEditing(false);
    setSearchTerm('');
  }, []);

  // Auto save and optionally navigate
  const autoSave = useCallback(
    (shouldNavigate = false, nextRow?: number, nextCol?: number) => {
      updateCellValue(editValue);
      resetState();
      if (shouldNavigate && nextRow !== undefined && nextCol !== undefined) {
        navigateToCell(nextRow, nextCol);
      }
    },
    [editValue, updateCellValue, resetState, navigateToCell]
  );

  // Handle select option selection
  const handleSelect = useCallback(
    (newValue: string) => {
      updateCellValue(newValue);

      // Call onSelect callback if available
      if (meta?.onSelect) {
        const currentRowData = {
          ...row.original,
          ...modifiedCells[rowId],
          [columnId]: newValue,
        };
        meta.onSelect(newValue, rowId, currentRowData as TData);
      }

      resetState();
      navigateToCell(rowIndex, columnIndex + 1);
    },
    [
      updateCellValue,
      meta,
      row.original,
      modifiedCells,
      rowId,
      columnId,
      resetState,
      navigateToCell,
      rowIndex,
      columnIndex,
    ]
  );

  // Handle cell click
  const handleCellClick = useCallback(() => {
    setIsEditing(true);
    if (cellTypes.isSelectColumn) {
      setSearchTerm('');
    } else if (cellTypes.isDateColumn) {
      setSearchTerm(isoToDateInput(String(editValue || '')));
    } else {
      setSearchTerm(String(editValue ?? ''));
    }
  }, [cellTypes, editValue]);

  // Keyboard handlers
  const handleNonEditingKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          setIsEditing(true);
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigateToCell(rowIndex, columnIndex + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          navigateToCell(rowIndex, columnIndex - 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          navigateToCell(rowIndex + 1, columnIndex);
          break;
        case 'ArrowUp':
          e.preventDefault();
          navigateToCell(rowIndex - 1, columnIndex);
          break;
      }
    },
    [navigateToCell, rowIndex, columnIndex]
  );

  const handleEditingKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (cellTypes.isSelectColumn) {
            // SelectCell handles its own Enter key — don't double-fire
            return;
          } else if (cellTypes.isBooleanColumn) {
            // BooleanCell handles its own toggle via onChange — just navigate
            resetState();
            navigateToCell(rowIndex, columnIndex + 1);
            return;
          } else {
            autoSave(true, rowIndex, columnIndex + 1);
          }
          break;

        case 'Tab':
          e.preventDefault();
          autoSave(true, rowIndex, columnIndex + (e.shiftKey ? -1 : 1));
          break;

        case 'ArrowUp':
          e.preventDefault();
          autoSave(true, rowIndex - 1, columnIndex);
          break;

        case 'ArrowDown':
          e.preventDefault();
          autoSave(true, rowIndex + 1, columnIndex);
          break;

        case 'ArrowLeft':
          if (canNavigateHorizontally(e.target as HTMLInputElement, 'left', cellTypes.isSelectColumn)) {
            e.preventDefault();
            autoSave(true, rowIndex, columnIndex - 1);
          }
          break;

        case 'ArrowRight':
          if (canNavigateHorizontally(e.target as HTMLInputElement, 'right', cellTypes.isSelectColumn)) {
            e.preventDefault();
            autoSave(true, rowIndex, columnIndex + 1);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setEditValue(getInitialValue());
          resetState();
          break;
      }
    },
    [
      cellTypes.isSelectColumn,
      cellTypes.isBooleanColumn,
      autoSave,
      rowIndex,
      columnIndex,
      getInitialValue,
      resetState,
      navigateToCell,
    ]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isEditing) {
        handleEditingKeyDown(e);
      } else {
        handleNonEditingKeyDown(e);
      }
    },
    [isEditing, handleEditingKeyDown, handleNonEditingKeyDown]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (newValue: string) => {
      if (cellTypes.isCurrencyColumn || cellTypes.isNumberColumn) {
        const cleanValue = newValue.replace(/[^0-9.]/g, '');
        setEditValue(cleanValue);
        setSearchTerm(cleanValue);
      } else {
        setEditValue(newValue);
        setSearchTerm(newValue);
      }
    },
    [cellTypes]
  );

  // Render editing cell
  const renderEditingCell = () => {
    if (cellTypes.isSelectColumn) {
      return (
        <SelectCell
          ref={inputRef}
          value={String(editValue)}
          options={selectOptions}
          onChange={handleSelect}
          onBlur={() => autoSave()}
          onKeyDown={handleKeyDown}
          isModified={isCellModified}
          showAddNew={!!meta?.onAddNew}
          onAddNew={meta?.onAddNew}
          allowDelete={meta?.isDeletable}
          onDeleteOption={
            meta?.onDelete
              ? (opt) => meta.onDelete?.(opt.value)
              : undefined
          }
        />
      );
    }

    if (cellTypes.isDateColumn) {
      return (
        <DateCell
          ref={inputRef}
          value={String(editValue)}
          onChange={(val) => setEditValue(val)}
          onBlur={() => autoSave()}
          onKeyDown={handleKeyDown}
          isModified={isCellModified}
        />
      );
    }

    if (cellTypes.isBooleanColumn) {
      return (
        <BooleanCell
          ref={inputRef}
          value={Boolean(currentValue)}
          onChange={(val) => {
            updateCellValue(val);
          }}
          onKeyDown={handleKeyDown}
          isModified={isCellModified}
        />
      );
    }

    if (cellTypes.isCurrencyColumn) {
      return (
        <CurrencyCell
          ref={inputRef}
          value={editValue}
          onChange={handleInputChange}
          onBlur={() => autoSave()}
          onKeyDown={handleKeyDown}
          isModified={isCellModified}
        />
      );
    }

    if (cellTypes.isNumberColumn) {
      return (
        <NumberCell
          ref={inputRef}
          value={editValue}
          onChange={handleInputChange}
          onBlur={() => autoSave()}
          onKeyDown={handleKeyDown}
          isModified={isCellModified}
        />
      );
    }

    return (
      <TextCell
        ref={inputRef}
        value={String(editValue ?? '')}
        onChange={handleInputChange}
        onBlur={() => autoSave()}
        onKeyDown={handleKeyDown}
        isModified={isCellModified}
      />
    );
  };

  // Render display cell
  const renderDisplayCell = () => {
    let displayValue: string | number = '';

    if (cellTypes.isSelectColumn) {
      // Use valueResolver if available
      const valueResolver = meta?.valueResolver;
      if (valueResolver) {
        displayValue = valueResolver(String(currentValue || ''), row.original);
      } else {
        // Find label in options
        displayValue =
          selectOptions.find((opt) => String(opt.value) === String(currentValue))?.label ??
          '— Unassigned —';
      }
    } else if (cellTypes.isBooleanColumn) {
      displayValue = currentValue ? 'Yes' : 'No';
    } else if (formatter && currentValue !== null) {
      displayValue = formatter(currentValue);
    } else {
      displayValue = (currentValue as string | number) ?? '';
    }

    return (
      <div
        data-row={rowIndex}
        data-col={columnIndex}
        tabIndex={0}
        className={`
          px-2 w-full py-2 h-full cursor-pointer
          overflow-hidden text-ellipsis whitespace-nowrap
          focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500
          ${isCellModified ? 'sheet-table-cell--modified' : ''}
        `}
        onClick={handleCellClick}
        onKeyDown={handleKeyDown}
        title={currentValue === null ? '' : String(currentValue)}
      >
        {displayValue}
      </div>
    );
  };

  return isEditing ? renderEditingCell() : renderDisplayCell();
}
