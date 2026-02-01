import { type ColumnDef, type Row, type Table, type Column } from '@tanstack/react-table';
import type {
  RowData,
  ColumnConfig,
  ColumnMeta,
  CellDataType,
  CellValue,
  ModifiedCells,
} from '@/types';
import { EditableCell } from '@/components/cell/EditableCell';
import { ReadOnlyCell } from '@/components/cell/ReadOnlyCell';
import { formatDateValue } from '@/utils/formatters/date';
import { formatCurrency } from '@/utils/formatters/currency';
import { calculateOptimalColumnWidth } from '@/utils/autosize/calculator';

/**
 * Safe getter for row values
 */
function safeGet<TData>(row: Row<TData> | TData, id: string): unknown {
  try {
    if (typeof (row as Row<TData>)?.getValue === 'function') {
      return (row as Row<TData>).getValue(id);
    }
    if ((row as Row<TData>).original !== undefined) {
      return (row as Row<TData>).original[id as keyof TData];
    }
    if (typeof row === 'object' && row !== null && id in row) {
      return (row as TData)[id as keyof TData];
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Filter for non-empty values
 */
function notEmptyFilter<TData>(row: Row<TData>, id: string, flag: boolean): boolean {
  if (!flag) return true;
  const v = safeGet(row, id);
  return v !== 0 && v !== '' && v != null && !(typeof v === 'string' && v.trim() === '');
}

/**
 * Text search filter
 */
function textFilter<TData>(row: Row<TData>, id: string, query: string): boolean {
  if (!query?.trim()) return true;
  return String(safeGet(row, id) ?? '')
    .toLowerCase()
    .includes(query.trim().toLowerCase());
}

/**
 * Multi-select filter
 */
function multiFilter<TData>(row: Row<TData>, id: string, list: string[]): boolean {
  if (!Array.isArray(list) || list.length === 0 || list.includes('__ALL__')) return true;
  const rawValue = String(safeGet(row, id));

  const colMeta = (row as Row<TData>)
    .getAllCells()
    .find((c) => c.column.id === id)?.column.columnDef.meta as ColumnMeta<TData> | undefined;

  const resolved =
    typeof colMeta?.valueResolver === 'function' ? colMeta.valueResolver(rawValue) : rawValue;

  return list.includes(resolved);
}

/**
 * Options for building columns
 */
export interface BuildColumnOptions<TData extends RowData> {
  /** Cell edit handler */
  handleCellEdit: (rowId: string, columnId: string, value: CellValue) => void;

  /** Table instance */
  table: Table<TData>;

  /** Modified cells record */
  modifiedCells: ModifiedCells;

  /** Modified cells setter */
  setModifiedCells: React.Dispatch<React.SetStateAction<ModifiedCells>>;

  /** Column filter flags */
  columnFilters: Record<string, boolean>;

  /** Column filter flags setter - accepts either a string column ID or a full state update */
  setColumnFilters: ((columnId: string, enabled: boolean) => void) | React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

  /** Expanded columns for autosize */
  expandedColumns: Record<string, boolean>;

  /** Expanded columns setter - accepts either a string column ID to toggle or a full state update */
  setExpandedColumns: ((columnId: string) => void) | React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

  /** Data array for autosize calculations */
  data: TData[];

  /** Check if row is read-only */
  isReadOnlyRow?: (row: TData) => boolean;
}

/**
 * Build a single column definition
 */
export function buildColumn<TData extends RowData>(
  config: ColumnConfig<TData>,
  options: BuildColumnOptions<TData>
): ColumnDef<TData> {
  const {
    accessorKey,
    header,
    size = 140,
    dataType = 'string',
    sortable = false,
    editable = true,
    filterable = false,
    searchable = false,
    autosize = false,
    minWidth = 80,
    maxWidth = 400,
    meta,
    dateFormat,
  } = config;

  const key = accessorKey as string;
  const isExpanded = options.expandedColumns[key] ?? false;

  // Calculate column size
  const computedSize = autosize
    ? isExpanded
      ? calculateOptimalColumnWidth(
          options.data,
          accessorKey,
          header,
          dataType as CellDataType,
          dateFormat,
          minWidth,
          maxWidth
        )
      : minWidth
    : size;

  // Determine filter function
  const filterFn = searchable
    ? meta?.searchMode === 'select'
      ? multiFilter
      : textFilter
    : filterable
      ? notEmptyFilter
      : undefined;

  // Get formatter for display
  const formatter =
    dataType === 'currency'
      ? (v: CellValue) => formatCurrency(v as number)
      : dataType === 'date'
        ? (v: CellValue) => formatDateValue(v as string, dateFormat)
        : undefined;

  return {
    accessorKey: key,
    size: computedSize,
    minSize: minWidth,
    maxSize: maxWidth,
    enableResizing: true,
    meta: {
      dataType,
      selectOptions: meta?.selectOptions,
      getDynamicSelectOptions: meta?.getDynamicSelectOptions,
      onAddNew: meta?.onAddNew,
      searchMode: meta?.searchMode,
      valueResolver: meta?.valueResolver,
      isDeletable: meta?.isDeletable,
      onDelete: meta?.onDelete,
      onSelect: meta?.onSelect,
      onLock: meta?.onLock,
    } satisfies ColumnMeta<TData>,
    ...(filterFn && {
      filterFn,
      enableColumnFilter: true,
      enableGlobalFilter: false,
    }),
    cell: ({ row, column }) => {
      const value = row.getValue(key);
      const isRowReadOnly = options.isReadOnlyRow?.(row.original) ?? false;

      if (!editable || isRowReadOnly) {
        return <ReadOnlyCell value={value as CellValue} dataType={dataType as CellDataType} dateFormat={dateFormat} />;
      }

      return (
        <EditableCell
          value={value as CellValue}
          row={row}
          column={column as Column<TData, unknown>}
          onEdit={options.handleCellEdit}
          table={options.table}
          modifiedCells={options.modifiedCells}
          setModifiedCells={options.setModifiedCells}
          dataType={dataType as CellDataType}
          formatter={formatter}
        />
      );
    },
    header: ({ column }) => {
      const toggleExpand = () => {
        (options.setExpandedColumns as (columnId: string) => void)(key);
      };

      return (
        <div className="flex items-center justify-between w-full px-2 py-1">
          <span className="font-medium truncate">{header}</span>
          {autosize && (
            <button
              type="button"
              onClick={toggleExpand}
              className="ml-2 p-1 hover:bg-gray-200 rounded"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                {isExpanded ? (
                  <path d="M4 14h6v6m10-10h-6V4" />
                ) : (
                  <path d="M14 10h6V4m-10 10H4v6" />
                )}
              </svg>
            </button>
          )}
          {sortable && (
            <button
              type="button"
              onClick={() => column.toggleSorting()}
              className="ml-1 p-1 hover:bg-gray-200 rounded"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12l7-7 7 7" />
              </svg>
            </button>
          )}
        </div>
      );
    },
  };
}

/**
 * Props for building all columns
 */
export interface BuildColumnsProps<TData extends RowData> extends BuildColumnOptions<TData> {
  /** Whether edit mode is enabled */
  editMode: boolean;

  /** Column configurations */
  columns: ColumnConfig<TData>[];
}

/**
 * Build all column definitions including selection column
 */
export function buildColumns<TData extends RowData>(
  props: BuildColumnsProps<TData>
): ColumnDef<TData>[] {
  const cols: ColumnDef<TData>[] = [];

  // Add selection column in edit mode
  if (props.editMode) {
    cols.push({
      id: 'select',
      header: ({ table }) => (
        <div className="flex items-center justify-center w-full h-full">
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="cursor-pointer w-4 h-4"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center h-full">
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="cursor-pointer w-4 h-4"
          />
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: false,
      size: 40,
    });
  }

  // Build data columns
  return [...cols, ...props.columns.map((c) => buildColumn(c, props))];
}

/**
 * Alias for backwards compatibility
 */
export const getColumns = buildColumns;
