import { useRef, useMemo, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { flexRender, type Table, type Row } from '@tanstack/react-table';
import type { RowData } from '@/types';

export interface TableBodyProps<TData extends RowData> {
  /** Table instance */
  table: Table<TData>;

  /** Row height in pixels */
  rowHeight?: number;

  /** Check if row is linked (for visual indication) */
  isLinkedRow?: (row: TData) => boolean;

  /** Check if row is read-only */
  isReadOnlyRow?: (row: TData) => boolean;

  /** Version counter that increments on data/cell changes to force react-window re-renders */
  dataVersion?: number;

  /** Custom class name */
  className?: string;
}

interface RowComponentProps {
  row: Row<RowData>;
  style: React.CSSProperties;
  isLinked?: boolean;
  isReadOnly?: boolean;
}

/**
 * Memoized row component for virtualization.
 * Uses default React.memo shallow comparison instead of react-window's areEqual,
 * which is designed for the (data, index, style) pattern and can prevent
 * necessary re-renders when used with custom props.
 */
const TableRow = memo(function TableRow({
  row,
  style,
  isLinked,
  isReadOnly,
}: RowComponentProps) {
  return (
    <div
      style={style}
      className={`
        flex border-b border-gray-200
        ${isLinked ? 'bg-blue-50' : ''}
        ${isReadOnly ? 'bg-gray-50' : ''}
        hover:bg-gray-50
      `}
    >
      {row.getVisibleCells().map((cell) => (
        <div
          key={cell.id}
          style={{
            width: cell.column.getSize(),
            minWidth: cell.column.columnDef.minSize,
            maxWidth: cell.column.columnDef.maxSize,
          }}
          className="flex items-center border-r border-gray-200 last:border-r-0 overflow-hidden"
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </div>
      ))}
    </div>
  );
});

/**
 * Item data passed through react-window's itemData prop.
 * This ensures react-window re-renders visible items when data changes,
 * rather than relying solely on children reference changes.
 */
interface ItemData {
  rows: Row<RowData>[];
  isLinkedRow?: (row: RowData) => boolean;
  isReadOnlyRow?: (row: RowData) => boolean;
  dataVersion: number;
}

/**
 * Row renderer that reads data from itemData instead of closures.
 * This avoids stale closure issues with react-window's virtualization.
 */
function RowRenderer({
  index,
  style,
  data,
}: {
  index: number;
  style: React.CSSProperties;
  data: ItemData;
}) {
  const row = data.rows[index];
  if (!row) return null;

  const isLinked = data.isLinkedRow?.(row.original) ?? false;
  const isReadOnly = data.isReadOnlyRow?.(row.original) ?? false;

  return (
    <TableRow
      row={row}
      style={style}
      isLinked={isLinked}
      isReadOnly={isReadOnly}
    />
  );
}

/**
 * Virtualized table body component using react-window
 */
export function TableBody<TData extends RowData>({
  table,
  rowHeight = 40,
  isLinkedRow,
  isReadOnlyRow,
  dataVersion = 0,
  className = '',
}: TableBodyProps<TData>) {
  const listRef = useRef<List>(null);
  const rows = table.getRowModel().rows;

  // Memoize itemData to control when react-window re-renders items.
  // When rows or dataVersion change, itemData changes, forcing react-window
  // to re-render all visible items with fresh data.
  const itemData = useMemo<ItemData>(
    () => ({
      rows: rows as unknown as Row<RowData>[],
      isLinkedRow: isLinkedRow as unknown as ((row: RowData) => boolean) | undefined,
      isReadOnlyRow: isReadOnlyRow as unknown as ((row: RowData) => boolean) | undefined,
      dataVersion,
    }),
    [rows, isLinkedRow, isReadOnlyRow, dataVersion]
  );

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className={`flex-1 min-h-0 ${className}`}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={listRef}
            height={height}
            width={width}
            itemCount={rows.length}
            itemSize={rowHeight}
            itemData={itemData}
            overscanCount={5}
          >
            {RowRenderer}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}
