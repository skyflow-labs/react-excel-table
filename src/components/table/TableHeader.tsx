import { type RefObject } from 'react';
import { flexRender, type Table } from '@tanstack/react-table';
import type { RowData } from '@/types';

export interface TableHeaderProps<TData extends RowData> {
  /** Table instance */
  table: Table<TData>;

  /** Width overrides from autosize (column id → pixel width) */
  columnWidthOverrides?: Record<string, number>;

  /** Total row width for horizontal scroll support */
  totalRowWidth?: number;

  /** Ref for the scrollable header container (used for horizontal scroll sync) */
  headerRef?: RefObject<HTMLDivElement>;

  /** Custom class name */
  className?: string;
}

/**
 * Table header component
 */
export function TableHeader<TData extends RowData>({
  table,
  columnWidthOverrides = {},
  totalRowWidth = 0,
  headerRef,
  className = '',
}: TableHeaderProps<TData>) {
  return (
    <div
      ref={headerRef}
      className={`bg-gray-100 border-b border-gray-300 overflow-hidden ${className}`}
    >
      {table.getHeaderGroups().map((headerGroup) => (
        <div
          key={headerGroup.id}
          className="flex"
          style={totalRowWidth > 0 ? { minWidth: totalRowWidth } : undefined}
        >
          {headerGroup.headers.map((header) => {
            const overrideWidth = columnWidthOverrides[header.column.id];
            return (
              <div
                key={header.id}
                style={{
                  width: overrideWidth ?? header.getSize(),
                  minWidth: header.column.columnDef.minSize,
                  maxWidth: overrideWidth ?? header.column.columnDef.maxSize,
                  flexShrink: 0,
                }}
                className="
                  flex items-center border-r border-gray-300 last:border-r-0
                  font-semibold text-gray-700 text-sm
                  bg-gray-100 select-none
                "
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
