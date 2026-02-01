/**
 * Possible values a cell can hold
 */
export type CellValue = string | number | boolean | Date | null | undefined;

/**
 * Record of modified cells by row ID and column ID
 */
export type ModifiedCells = Record<string, Record<string, CellValue>>;

/**
 * State of a single cell
 */
export interface CellState {
  /** Whether the cell is currently being edited */
  isEditing: boolean;

  /** The current value during editing */
  editValue: CellValue;

  /** Whether the cell has unsaved modifications */
  isModified: boolean;

  /** Validation error message, if any */
  error?: string;
}

/**
 * Position of a cell in the table
 */
export interface CellPosition {
  /** Row index (0-based) */
  rowIndex: number;

  /** Column index (0-based) */
  columnIndex: number;
}

/**
 * Reference to a specific cell
 */
export interface CellRef {
  /** Row ID */
  rowId: string;

  /** Column ID */
  columnId: string;
}

/**
 * Cell edit event payload
 */
export interface CellEditPayload {
  /** Row ID */
  rowId: string;

  /** Column ID */
  columnId: string;

  /** The new value */
  value: CellValue;

  /** The previous value */
  previousValue?: CellValue;
}

/**
 * Cell validation result
 */
export interface CellValidationResult {
  /** Whether the value is valid */
  isValid: boolean;

  /** Error message if invalid */
  error?: string;
}

/**
 * Cell validator function type
 */
export type CellValidator = (
  value: CellValue,
  rowId: string,
  columnId: string
) => CellValidationResult | Promise<CellValidationResult>;
