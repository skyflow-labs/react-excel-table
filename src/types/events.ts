import type { CellValue, ModifiedCells } from './cell';
import type { RowData } from './column';

/**
 * Cell edit event handler
 */
export type OnCellEdit = (
  rowId: string,
  columnId: string,
  value: CellValue
) => void;

/**
 * Save operation result
 */
export interface SaveResult<TData extends RowData> {
  /** Newly created rows */
  newlyCreated: TData[];

  /** Updated existing rows */
  updatedData: TData[];
}

/**
 * Save event handler
 */
export type OnSave<TData extends RowData> = (
  data: TData[],
  modifiedCells: ModifiedCells
) => Promise<SaveResult<TData>>;

/**
 * Delete operation result
 */
export interface DeleteResult {
  /** Number of successfully deleted rows */
  totalDeleted: number;

  /** Total number of rows attempted to delete */
  total: number;
}

/**
 * Delete event handler
 */
export type OnDelete = (ids: string[]) => Promise<DeleteResult>;

/**
 * Row add event handler
 * Should return the new row or null if cancelled
 */
export type OnRowAdd<TData extends RowData> = () => TData | null;

/**
 * Data change event handler
 */
export type OnDataChange = () => void;

/**
 * Modified cells change event handler
 */
export type OnModifiedCellsChange = (modifiedCells: ModifiedCells) => void;

/**
 * Keyboard navigation event
 */
export interface KeyboardNavigationEvent {
  /** Target cell position */
  targetRowIndex: number;
  targetColumnIndex: number;

  /** Source cell position */
  sourceRowIndex: number;
  sourceColumnIndex: number;

  /** Key that triggered the navigation */
  key: string;

  /** Whether to start editing the target cell */
  startEditing: boolean;
}

/**
 * Keyboard navigation event handler
 */
export type OnKeyboardNavigate = (event: KeyboardNavigationEvent) => void;

/**
 * Cell focus event
 */
export interface CellFocusEvent {
  rowId: string;
  columnId: string;
  rowIndex: number;
  columnIndex: number;
}

/**
 * Cell focus event handler
 */
export type OnCellFocus = (event: CellFocusEvent) => void;

/**
 * Cell blur event handler
 */
export type OnCellBlur = (event: CellFocusEvent) => void;

/**
 * Row selection change event
 */
export interface RowSelectionEvent {
  /** Selected row IDs */
  selectedIds: string[];

  /** Previously selected row IDs */
  previousSelectedIds: string[];
}

/**
 * Row selection change handler
 */
export type OnRowSelectionChange = (event: RowSelectionEvent) => void;

/**
 * Fullscreen change event handler
 */
export type OnFullscreenChange = (isFullscreen: boolean) => void;
