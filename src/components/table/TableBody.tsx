import { useRef, useMemo, useEffect, forwardRef, createContext, useContext, memo } from 'react';
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

  /** Width overrides from autosize (column id → pixel width) */
  columnWidthOverrides?: Record<string, number>;

  /** Total row width for horizontal scroll support */
  totalRowWidth?: number;

  /** Callback when body scrolls horizontally (for header sync) */
  onHorizontalScroll?: (scrollLeft: number) => void;

  /** Custom class name */
  className?: string;
}

// Context to pass totalRowWidth to the custom inner element
const TotalWidthContext = createContext<number>(0);

/**
 * Custom inner element for FixedSizeList that expands beyond viewport width
 * when columns are wider than the container (enables horizontal scroll).
 */
const InnerElement = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ style, ...rest }, ref) => {
    const totalWidth = useContext(TotalWidthContext);
    return (
      <div
        ref={ref}
        style={{
          ...style,
          width: totalWidth > 0 ? totalWidth : style?.width,
        }}
        {...rest}
      />
    );
  }
);
InnerElement.displayName = 'InnerElement';

/**
 * Row component for virtualization.
 * Wrapped in React.memo to skip re-renders when props are unchanged.
 */
const TableRow = memo(function TableRow({
  row,
  style,
  isLinked,
  isReadOnly,
  widthOverrides,
  totalRowWidth,
}: {
  row: Row<RowData>;
  style: React.CSSProperties;
  isLinked?: boolean;
  isReadOnly?: boolean;
  widthOverrides: Record<string, number>;
  totalRowWidth: number;
}) {
  // Override react-window's width (which is constrained to viewport) with totalRowWidth
  const rowStyle = totalRowWidth > 0 ? { ...style, width: totalRowWidth } : style;

  return (
    <div
      style={rowStyle}
      className={`
        flex border-b border-gray-200
        ${isLinked ? 'bg-blue-50' : ''}
        ${isReadOnly ? 'bg-gray-50' : ''}
        hover:bg-gray-50
      `}
    >
      {row.getVisibleCells().map((cell) => {
        const overrideWidth = widthOverrides[cell.column.id];
        return (
          <div
            key={cell.id}
            style={{
              width: overrideWidth ?? cell.column.getSize(),
              minWidth: cell.column.columnDef.minSize,
              maxWidth: overrideWidth ?? cell.column.columnDef.maxSize,
              flexShrink: 0,
            }}
            className="flex items-center border-r border-gray-200 last:border-r-0 overflow-hidden"
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        );
      })}
    </div>
  );
});

/**
 * Item data passed through react-window's itemData prop.
 */
interface ItemData {
  rows: Row<RowData>[];
  isLinkedRow?: (row: RowData) => boolean;
  isReadOnlyRow?: (row: RowData) => boolean;
  dataVersion: number;
  widthOverrides: Record<string, number>;
  totalRowWidth: number;
}

/**
 * Row renderer that reads data from itemData instead of closures.
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
      widthOverrides={data.widthOverrides}
      totalRowWidth={data.totalRowWidth}
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
  columnWidthOverrides = {},
  totalRowWidth = 0,
  onHorizontalScroll,
  className = '',
}: TableBodyProps<TData>) {
  const listRef = useRef<List>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;

  const itemData = useMemo<ItemData>(
    () => ({
      rows: rows as unknown as Row<RowData>[],
      isLinkedRow: isLinkedRow as unknown as ((row: RowData) => boolean) | undefined,
      isReadOnlyRow: isReadOnlyRow as unknown as ((row: RowData) => boolean) | undefined,
      dataVersion,
      widthOverrides: columnWidthOverrides,
      totalRowWidth,
    }),
    [rows, isLinkedRow, isReadOnlyRow, dataVersion, columnWidthOverrides, totalRowWidth]
  );

  // Forward horizontal scroll events to parent for header sync.
  // Throttled to one update per animation frame to avoid layout thrashing.
  useEffect(() => {
    const el = outerRef.current;
    if (!el || !onHorizontalScroll) return;
    let rafId = 0;
    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        onHorizontalScroll(el.scrollLeft);
        rafId = 0;
      });
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [onHorizontalScroll]);

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className={`flex-1 min-h-0 ${className}`}>
      <TotalWidthContext.Provider value={totalRowWidth}>
        <AutoSizer>
          {({ height, width }) => (
            <List
              ref={listRef}
              outerRef={outerRef}
              height={height}
              width={width}
              itemCount={rows.length}
              itemSize={rowHeight}
              itemData={itemData}
              overscanCount={5}
              innerElementType={InnerElement}
            >
              {RowRenderer}
            </List>
          )}
        </AutoSizer>
      </TotalWidthContext.Provider>
    </div>
  );
}
