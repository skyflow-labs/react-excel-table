/**
 * Supported cell data types for the Excel table
 */
export type CellDataType = 'string' | 'number' | 'date' | 'currency' | 'boolean' | 'select';

/**
 * Legacy enum for backwards compatibility
 * @deprecated Use string literal type CellDataType instead
 */
export enum CellDataTypeEnum {
  STRING = 0,
  NUMBER = 1,
  DATE = 2,
  CURRENCY = 3,
  BOOLEAN = 4,
  SELECT = 5,
}

/**
 * Option for select-type cells
 */
export interface SelectOption {
  /** Display label */
  label: string;
  /** Actual value */
  value: string;
  /** Whether this option is disabled */
  disabled?: boolean;
}

/**
 * Extended metadata for column configuration
 */
export interface ColumnMeta<TData = unknown> {
  /** Static options for select cells */
  selectOptions?: SelectOption[];

  /**
   * Dynamic options function for select cells
   * Receives the current row ID and all modified cells to compute available options
   */
  getDynamicSelectOptions?: (
    currentRowId: string,
    modifiedCells: Record<string, Record<string, unknown>>
  ) => SelectOption[];

  /** Callback when "Add new" is clicked in select dropdown */
  onAddNew?: () => void;

  /** Search mode for searchable columns */
  searchMode?: 'select' | 'text';

  /**
   * Custom value resolver for display purposes
   * Converts the raw value to a display string
   */
  valueResolver?: (value: string, row?: TData) => string;

  /** Whether this cell allows deletion (for category-type cells) */
  isDeletable?: boolean;

  /** Callback when an item is deleted */
  onDelete?: (id: string) => void | Promise<void>;

  /** Callback when an item is selected */
  onSelect?: (id: string, rowId: string, rowData: TData) => void;

  /**
   * Callback when cell value should be locked
   * Return true to prevent editing
   */
  onLock?: (rowId: string, value: unknown) => boolean;

  /** The data type for this column */
  dataType?: CellDataType;

  /**
   * Conditional rendering based on another field's value
   */
  conditional?: {
    field: string;
    value: string;
  };

  /** Field this column depends on */
  dependsOn?: string;
}

/**
 * Column configuration for the Excel table
 */
export interface ColumnConfig<TData extends RowData = RowData> {
  /** The key to access the data from the row object */
  accessorKey: keyof TData;

  /** Column header text */
  header: string;

  /** Fixed column width in pixels */
  size?: number;

  /** Cell data type */
  dataType?: CellDataType;

  /** Enable column sorting */
  sortable?: boolean;

  /** Enable cell editing */
  editable?: boolean;

  /** Enable column filtering (non-empty values) */
  filterable?: boolean;

  /** Enable column search */
  searchable?: boolean;

  /** Enable auto-sizing based on content */
  autosize?: boolean;

  /** Minimum column width */
  minWidth?: number;

  /** Maximum column width */
  maxWidth?: number;

  /** Enable column resizing */
  enableResizing?: boolean;

  /** Extended column metadata */
  meta?: ColumnMeta<TData>;

  /** Date format string (for date columns) */
  dateFormat?: string;
}

/**
 * Base interface for row data - all rows must have an id
 */
export interface RowData {
  id: string;
  [key: string]: unknown;
}

/**
 * Utility type to extract the data type from a column config
 */
export type ColumnValue<
  TData extends RowData,
  TKey extends keyof TData
> = TData[TKey];
