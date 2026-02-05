# Performance Audit Report — react-excel-table v1.2.1

**Date:** 2026-02-05
**Scope:** Full source code review of all source files in `src/`

## Summary

| Impact | Count |
|--------|-------|
| High | 5 |
| Medium | 6 |
| Low | 9 |

The five HIGH-impact issues are interconnected: every cell edit triggers a cascade — `modifiedCells` changes rebuild all columns, giving every cell new prop references, which combined with `key={dataVersion}` and no `React.memo`, causes the entire visible table to unmount/remount. Fixing issues H1-H3 and M1 together would yield an estimated 10-50x improvement in edit responsiveness for large tables.

---

## High Impact Issues

### H1: `key={dataVersion}` destroys the entire FixedSizeList on every data change

**File:** `src/components/table/TableBody.tsx:207`

```tsx
<List key={dataVersion} ... >
```

When React sees a changed `key`, it unmounts the entire `FixedSizeList` and remounts from scratch — destroying scroll position, virtualization caches, and all rendered DOM nodes. Every cell edit increments `dataVersion`, so every keystroke tears down and rebuilds ~15-20 visible row DOM subtrees.

**Fix:** Remove the `key` prop. Rely on `itemData` changes to trigger re-renders of visible rows (react-window's designed-for pattern). Use `listRef.current?.resetAfterIndex(0)` imperatively if forced re-render is needed.

### H2: `modifiedCells` in column `useMemo` dependency causes full column rebuild on every cell edit

**File:** `src/hooks/internal/useExcelTable.ts:109-140`

Both `modifiedCells` and `internalData` are in the `useMemo` dependency array for `columns`. Every cell edit changes both references, triggering a complete rebuild of all column definitions. Each column definition contains a fresh `cell` render function closure, so every visible cell in the entire table detects new props and re-renders.

**Fix:** Store `modifiedCells` and `internalData` in refs and read from refs in cell render closures. Remove them from the `useMemo` dependency array.

### H3: Double `modifiedCells` update on every cell edit

**File:** `src/components/cell/EditableCell.tsx:224-241`

`updateCellValue` calls `onEdit(rowId, columnId, processedValue)` (which internally calls `setModifiedCells` via `useCellEdit`) AND then calls `setModifiedCells` directly. Two state updates for the same operation — even with React 18 batching, the second is pure overhead.

**Fix:** Remove the direct `setModifiedCells` call from `updateCellValue` and let `onEdit` handle it.

### H4: Canvas element created on every `measureTextWidth` call

**File:** `src/utils/autosize/calculator.ts:78-93`

A new `<canvas>` DOM element is created per call. For 5,000 rows with 5 autosize columns, that's 25,000+ canvas allocations per autosize calculation.

**Fix:** Use a module-level singleton canvas with lazy initialization.

### H5: Duplicated autosize calculation

**Files:** `src/hooks/internal/useExcelTable.ts:166-183` and `src/components/table/columns.tsx:135-147`

Both `columnWidthOverrides` (useMemo) and `buildColumn` independently call `calculateOptimalColumnWidthPrecise` for expanded columns with the same data. The entire expensive per-row canvas measurement is performed twice.

**Fix:** Have `buildColumn` read pre-calculated widths from `columnWidthOverrides` instead of recalculating.

---

## Medium Impact Issues

### M1: `TableRow` and `EditableCell` not wrapped in `React.memo`

**Files:** `src/components/table/TableBody.tsx:63-110`, `src/components/cell/EditableCell.tsx:61-559`

These are the hottest components — one per visible row and per visible cell. Without `React.memo`, they re-render whenever their parent re-renders. Combined with H2, every visible cell re-renders on every data change.

**Fix:** Wrap both in `React.memo`. Note: requires H2 fix first so that prop references are stable.

### M2: `useCellEdit` does O(N) array scan on every cell edit

**File:** `src/hooks/internal/useCellEdit.ts:104-115`

Every cell edit iterates the entire data array via `.map()`. For 10,000 rows, that's 10,000 identity comparisons per keystroke.

**Fix:** Use `findIndex` + `slice` to avoid iterating past the match:
```ts
const idx = prev.findIndex((row) => row.id === rowId);
if (idx === -1) return prev;
const next = prev.slice();
next[idx] = { ...prev[idx], ...updates };
return next;
```

### M3: `multiFilter` calls `row.getAllCells().find()` per row

**File:** `src/components/table/columns.tsx:62-64`

`getAllCells()` creates a new array of ALL cells per row, then `.find()` does a linear scan. For 10,000 rows with 15 columns, that's 150,000 cell object accesses per filter operation.

**Fix:** Access the column via `row._getAllCellsByColumnId()[id]` or cache the column meta lookup outside the filter function.

### M4: `handleDeleteConfirmed` uses `Array.includes()` for row filtering

**File:** `src/hooks/internal/useTableActions.ts:124`

```ts
setData((prev) => prev.filter((row) => !rowsToDelete.includes(row.id)));
```

O(N * M) complexity. For deleting 100 rows from 10,000, that's 1,000,000 comparisons.

**Fix:** Convert `rowsToDelete` to a `Set` first: `const deleteSet = new Set(rowsToDelete);`

### M5: Scroll event listener without throttling

**File:** `src/components/table/TableBody.tsx:185-191`

Scroll events fire 60+ times per second. The handler reads `scrollLeft` from one element and writes to another, risking layout thrashing.

**Fix:** Use `requestAnimationFrame` to batch to one update per frame, and add `{ passive: true }` to the listener.

### M6: Inline style objects recreated per cell per render

**File:** `src/components/table/TableBody.tsx:91-101`

For 15 visible rows with 10 cells, that's 150 new style objects per render cycle. Each triggers React's style diffing.

**Fix:** Extract static portions (`flexShrink: 0`) to a module-level constant. Memoize the dynamic portions.

---

## Low Impact Issues

### L1: Inline `style={{ margin: '2px 0' }}` on all cell input components

**Files:** `TextCell.tsx:62`, `NumberCell.tsx:87`, `CurrencyCell.tsx:94`, `DateCell.tsx:67`, `SelectCell.tsx:148`

Creates a new object reference on every render for an identical constant.

**Fix:** Extract to module-level constant: `const CELL_INPUT_STYLE = { margin: '2px 0' } as const;`

### L2: Event handlers not wrapped in `useCallback` in ExcelTable

**File:** `src/components/table/ExcelTable.tsx:107-124`

`handleShowDeleteModal` and `handleDeleteConfirmed` are recreated on every render, triggering child re-renders.

**Fix:** Wrap in `useCallback` with appropriate dependencies.

### L3: Inline arrow function for `onDeleteModeToggle` in SpeedDial

**File:** `src/components/table/ExcelTable.tsx:165-170`

New function reference on every render causes SpeedDial to re-render.

**Fix:** Extract to a `useCallback`.

### L4: SpeedDial rebuilds `actions` array with JSX on every render

**File:** `src/components/controls/SpeedDial.tsx:41-90`

New SVG JSX elements and onClick closures created every render.

**Fix:** Memoize the actions array with `useMemo`.

### L5: ExcelTableProvider useMemo broken by inline object props

**File:** `src/config/ExcelTableProvider.tsx:255-266`

Inline object literal props from consumers break the `useMemo`, causing context to change and all consumers to re-render.

**Fix:** Document that consumers should memoize config objects, or use deep comparison.

### L6: ReadOnlyCell is not memoized

**File:** `src/components/cell/ReadOnlyCell.tsx:22-51`

Pure display component re-renders whenever parent re-renders. Used for potentially many read-only rows.

**Fix:** Wrap in `React.memo`.

### L7: `useAutosize` fires redundantly on mount

**File:** `src/hooks/internal/useAutosize.ts:116-127`

Two separate `useEffect` hooks both call `recalculateWidths` on mount, and can trigger each other via shared `useCallback` dependencies.

**Fix:** Combine into a single `useEffect`.

### L8: `formatCurrency` creates new config object on every call

**File:** `src/utils/formatters/currency.ts:55`

Even with no custom config (the common case), `{ ...DEFAULT_CONFIG, ...config }` creates a new object. For 10,000-row autosize calculations, that's 10,000 unnecessary allocations.

**Fix:** Short-circuit when config is empty: return `DEFAULT_CONFIG` directly.

### L9: `getSelectedRowModel().rows` called multiple times without caching

**File:** `src/components/table/ExcelTable.tsx:176,192`

Called twice in the same render for `.length`. Should be extracted to a local variable.

**Fix:** `const selectedRows = editMode ? table.getSelectedRowModel().rows : [];`
