import type { Table, Row, Column, SortingState, ColumnFiltersState } from '@tanstack/react-table';
import type { RowData, ColumnConfig } from './column';
import type { CellValue, ModifiedCells } from './cell';

/**
 * State of the Excel table
 */
export interface TableState<TData extends RowData> {
  /** The underlying TanStack table instance */
  table: Table<TData>;

  /** Current data array */
  data: TData[];

  /** Record of all modified cells */
  modifiedCells: ModifiedCells;

  /** Whether in edit/selection mode */
  editMode: boolean;

  /** Whether the table is in fullscreen mode */
  isFullscreen: boolean;

  /** Whether a save operation is in progress */
  isSaving: boolean;

  /** Current sorting state */
  sorting: SortingState;

  /** Current column filters state */
  columnFilters: ColumnFiltersState;

  /** Custom column filter flags */
  columnFilterFlags: Record<string, boolean>;

  /** Expanded columns for autosize */
  expandedColumns: Record<string, boolean>;

  /** Width overrides from autosize (column id → pixel width) */
  columnWidthOverrides: Record<string, number>;

  /** Total row width accounting for column overrides (enables horizontal scroll) */
  totalRowWidth: number;
}

/**
 * Actions available on the Excel table
 */
export interface TableActions<TData extends RowData = RowData> {
  /** Set the modified cells state */
  setModifiedCells: React.Dispatch<React.SetStateAction<ModifiedCells>>;

  /** Toggle edit/selection mode */
  setEditMode: (enabled: boolean) => void;

  /** Toggle fullscreen mode */
  toggleFullscreen: () => void;

  /** Handle cell edit */
  handleCellEdit: (rowId: string, columnId: string, value: CellValue) => void;

  /** Add a new row - returns the created row or null */
  handleAddRow: () => TData | null | void;

  /** Delete selected rows */
  handleDeleteSelected: () => Promise<void>;

  /** Save all changes */
  handleSaveChanges: () => Promise<void>;

  /** Discard all changes */
  handleDiscardChanges: () => void;

  /** Toggle column expansion */
  handleColumnExpansionToggle: (columnId: string) => void;

  /** Set column filter flag */
  setColumnFilterFlag: (columnId: string, enabled: boolean) => void;
}

/**
 * Combined table state and actions
 */
export interface UseExcelTableReturn<TData extends RowData>
  extends TableState<TData>,
    TableActions<TData> {
  /** Number of modified cells */
  modifiedCount: number;

  /** Array of edited cell references */
  editedCells: Array<{
    rowId: string;
    columnId: string;
    value: CellValue;
  }>;
}

/**
 * Props for the main ExcelTable component
 */
export interface ExcelTableProps<TData extends RowData> {
  /** Data array to display */
  data: TData[];

  /** Whether data is loading */
  loading?: boolean;

  /** Column configurations */
  columns: ColumnConfig<TData>[];

  /** Callback when data changes externally */
  onDataChange?: () => void;

  /**
   * Factory function to create a new row
   * Should return null if row creation is cancelled
   */
  onAddRow?: () => TData | null;

  /**
   * Delete handler for selected rows
   * Returns the result of the delete operation
   */
  onDelete?: (ids: string[]) => Promise<{ totalDeleted: number; total: number }>;

  /**
   * Save handler for modified data
   * Returns the newly created and updated rows
   */
  onSave?: (
    data: TData[],
    modifiedCells: ModifiedCells
  ) => Promise<{ newlyCreated: TData[]; updatedData: TData[] }>;

  /**
   * Callback when modified cells change
   * Useful for live formula calculations
   */
  onModifiedCellsChange?: (modifiedCells: ModifiedCells) => void;

  /**
   * Determine if a row should be read-only
   */
  isReadOnlyRow?: (row: TData) => boolean;

  /**
   * Determine if a row is linked (for visual indication)
   */
  isLinkedRow?: (row: TData) => boolean;

  /** Initial fullscreen state */
  defaultFullscreen?: boolean;

  /** Custom class name for the table container */
  className?: string;
}

/**
 * Props for table hooks
 */
export interface UseExcelTableProps<TData extends RowData> {
  /** External data array */
  data: TData[];

  /** Column configurations */
  columns: ColumnConfig<TData>[];

  /** Callback when data changes */
  onDataChange?: () => void;

  /** Factory function to create a new row */
  onAddRow?: () => TData | null;

  /** Delete handler */
  onDelete?: (ids: string[]) => Promise<{ totalDeleted: number; total: number }>;

  /** Save handler */
  onSave?: (
    data: TData[],
    modifiedCells: ModifiedCells
  ) => Promise<{ newlyCreated: TData[]; updatedData: TData[] }>;

  /** Read-only row checker */
  isReadOnlyRow?: (row: TData) => boolean;
}

/**
 * Context value for the table
 */
export interface TableContextValue<TData extends RowData> {
  table: Table<TData>;
  modifiedCells: ModifiedCells;
  setModifiedCells: React.Dispatch<React.SetStateAction<ModifiedCells>>;
  handleCellEdit: (rowId: string, columnId: string, value: CellValue) => void;
  editMode: boolean;
  isReadOnlyRow?: (row: TData) => boolean;
}

/**
 * Re-export TanStack types for convenience
 */
export type { Table, Row, Column, SortingState, ColumnFiltersState };
