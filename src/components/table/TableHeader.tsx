import { flexRender, type Table } from '@tanstack/react-table';
import type { RowData } from '@/types';

export interface TableHeaderProps<TData extends RowData> {
  /** Table instance */
  table: Table<TData>;

  /** Custom class name */
  className?: string;
}

/**
 * Table header component
 */
export function TableHeader<TData extends RowData>({
  table,
  className = '',
}: TableHeaderProps<TData>) {
  return (
    <div className={`bg-gray-100 border-b border-gray-300 ${className}`}>
      {table.getHeaderGroups().map((headerGroup) => (
        <div key={headerGroup.id} className="flex">
          {headerGroup.headers.map((header) => (
            <div
              key={header.id}
              style={{
                width: header.getSize(),
                minWidth: header.column.columnDef.minSize,
                maxWidth: header.column.columnDef.maxSize,
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
          ))}
        </div>
      ))}
    </div>
  );
}
