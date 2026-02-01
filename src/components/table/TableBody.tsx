import { useRef, useCallback, memo } from 'react';
import { FixedSizeList as List, areEqual } from 'react-window';
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

  /** Custom class name */
  className?: string;
}

interface RowComponentProps<TData extends RowData> {
  row: Row<TData>;
  style: React.CSSProperties;
  isLinked?: boolean;
  isReadOnly?: boolean;
}

/**
 * Memoized row component for virtualization
 */
const TableRow = memo(function TableRow<TData extends RowData>({
  row,
  style,
  isLinked,
  isReadOnly,
}: RowComponentProps<TData>) {
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
}, areEqual);

/**
 * Virtualized table body component using react-window
 */
export function TableBody<TData extends RowData>({
  table,
  rowHeight = 40,
  isLinkedRow,
  isReadOnlyRow,
  className = '',
}: TableBodyProps<TData>) {
  const listRef = useRef<List>(null);
  const rows = table.getRowModel().rows;

  // Row renderer for react-window
  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const row = rows[index];
      if (!row) return null;

      const isLinked = isLinkedRow?.(row.original) ?? false;
      const isReadOnly = isReadOnlyRow?.(row.original) ?? false;

      return (
        <TableRow
          row={row}
          style={style}
          isLinked={isLinked}
          isReadOnly={isReadOnly}
        />
      );
    },
    [rows, isLinkedRow, isReadOnlyRow]
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
            overscanCount={5}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}
