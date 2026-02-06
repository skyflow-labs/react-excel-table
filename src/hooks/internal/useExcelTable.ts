import { useMemo, useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  type SortingState,
  type ColumnFiltersState,
  type ColumnDef,
  type Table,
} from '@tanstack/react-table';

import type {
  RowData,
  ModifiedCells,
  CellValue,
  UseExcelTableProps,
  UseExcelTableReturn,
} from '@/types';
import { useCellEdit } from './useCellEdit';
import { useTableActions } from './useTableActions';
import { buildColumns } from '@/components/table/columns';
import { calculateOptimalColumnWidthPrecise } from '@/utils/autosize/calculator';
import type { CellDataType } from '@/types';

/**
 * Main hook for the Excel table component
 *
 * @param props - Hook configuration
 * @returns Table state and actions
 *
 * @example
 * ```tsx
 * const {
 *   table,
 *   modifiedCells,
 *   editMode,
 *   handleCellEdit,
 *   handleSaveChanges,
 *   handleAddRow,
 * } = useExcelTable({
 *   data,
 *   columns,
 *   onSave,
 *   onDelete,
 *   onAddRow,
 * });
 * ```
 */
export function useExcelTable<TData extends RowData>({
  data: externalData,
  columns: columnConfigs,
  onDataChange,
  onAddRow,
  onDelete,
  onSave,
  isReadOnlyRow,
}: UseExcelTableProps<TData>): UseExcelTableReturn<TData> {
  // Internal state
  const [internalData, setInternalData] = useState<TData[]>(externalData);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [modifiedCells, setModifiedCells] = useState<ModifiedCells>({});
  const [editMode, setEditMode] = useState(false);
  const [columnFilterFlags, setColumnFilterFlags] = useState<Record<string, boolean>>({});
  const [expandedColumns, setExpandedColumns] = useState<Record<string, boolean>>({});

  // Refs for values accessed in column render closures — avoids rebuilding
  // all column definitions (and thus all cell render functions) on every edit
  const modifiedCellsRef = useRef<ModifiedCells>(modifiedCells);
  modifiedCellsRef.current = modifiedCells;
  const internalDataRef = useRef<TData[]>(internalData);
  internalDataRef.current = internalData;

  // Ref to hold the table instance, used to break the circular dependency:
  // buildColumns needs `table` (for cell navigation), but useReactTable needs `columns`.
  // On the first render, tableRef.current is null — headers still render correctly
  // because header functions don't use `table`, and cell navigation has a null check.
  // useLayoutEffect sets tableReady=true synchronously before paint, triggering a
  // second render where columns are rebuilt with the real table reference.
  const tableRef = useRef<Table<TData>>(null!);
  const [tableReady, setTableReady] = useState(false);

  // Sync external data to internal state and clear stale modifications
  useEffect(() => {
    setInternalData(externalData);
    setModifiedCells({});
  }, [externalData]);

  // Cell edit handler
  const handleCellEdit = useCellEdit({
    setData: setInternalData,
    setModifiedCells,
  });

  // Handle column expansion toggle
  const handleColumnExpansionToggle = useCallback((columnId: string) => {
    setExpandedColumns((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  }, []);

  // Handle column filter flag
  const setColumnFilterFlag = useCallback((columnId: string, enabled: boolean) => {
    setColumnFilterFlags((prev) => ({
      ...prev,
      [columnId]: enabled,
    }));
  }, []);

  // Build columns directly — passed to useReactTable instead of being patched via useEffect.
  // This ensures getHeaderGroups() returns correct headers on every render.
  const columns = useMemo<ColumnDef<TData>[]>(
    () =>
      buildColumns({
        columns: columnConfigs,
        handleCellEdit,
        table: tableRef.current,
        modifiedCellsRef,
        editMode,
        columnFilters: columnFilterFlags,
        setColumnFilters: setColumnFilterFlag,
        expandedColumns,
        setExpandedColumns: handleColumnExpansionToggle,
        dataRef: internalDataRef,
        isReadOnlyRow,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tableReady triggers rebuild after tableRef is set; modifiedCells/internalData accessed via refs to avoid re-creating all cell closures on every edit
    [
      tableReady,
      columnConfigs,
      handleCellEdit,
      editMode,
      columnFilterFlags,
      setColumnFilterFlag,
      expandedColumns,
      handleColumnExpansionToggle,
      isReadOnlyRow,
    ]
  );

  // Create table instance with fully-built columns
  const table = useReactTable<TData>({
    data: internalData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      columnFilters,
    },
    enableRowSelection: editMode,
  });

  // Store the table reference for column rebuilds
  tableRef.current = table;

  // Compute width overrides for autosize columns.
  // This map is passed to TableHeader/TableBody so they can apply widths
  // directly via inline styles instead of relying on column.getSize().
  const columnWidthOverrides = useMemo<Record<string, number>>(() => {
    const overrides: Record<string, number> = {};
    for (const config of columnConfigs) {
      const key = String(config.accessorKey);
      if (config.autosize && expandedColumns[key]) {
        overrides[key] = calculateOptimalColumnWidthPrecise(
          internalData,
          config.accessorKey,
          config.header,
          (config.dataType || 'string') as CellDataType,
          config.dateFormat,
          config.minWidth,
          config.maxWidth
        );
      }
    }
    return overrides;
  }, [columnConfigs, expandedColumns, internalData]);

  // Compute total row width so that header/body can expand beyond the viewport
  // when autosize columns are expanded, enabling horizontal scrolling.
  const totalRowWidth = useMemo<number>(() => {
    let total = 0;
    if (editMode) total += 40; // selection column
    for (const config of columnConfigs) {
      const key = String(config.accessorKey);
      if (columnWidthOverrides[key]) {
        total += columnWidthOverrides[key];
      } else if (config.autosize) {
        total += config.minWidth ?? 80;
      } else {
        total += config.size ?? 140;
      }
    }
    return total;
  }, [columnConfigs, columnWidthOverrides, editMode]);

  // After the first render, trigger a column rebuild so that cell render
  // closures capture the real table instance (needed for keyboard navigation).
  // useLayoutEffect fires synchronously before paint, so the user never sees
  // the intermediate state.
  useLayoutEffect(() => {
    if (!tableReady) setTableReady(true);
  }, [tableReady]);

  // Table actions
  const {
    isSaving,
    isFullscreen,
    toggleFullscreen,
    showDeleteModal: _showDeleteModal,
    setShowDeleteModal,
    rowsToDelete: _rowsToDelete,
    setRowsToDelete,
    handleDeleteConfirmed: _handleDeleteConfirmed,
    handleSaveChanges: internalHandleSaveChanges,
  } = useTableActions({
    table,
    data: internalData,
    setData: setInternalData,
    modifiedCells,
    setModifiedCells,
    onDataChange,
    onDelete,
    onSave,
  });

  // Handle add row
  const handleAddRow = useCallback(() => {
    if (!onAddRow) return;

    const newRow = onAddRow();
    if (newRow) {
      setInternalData((prev) => [newRow, ...prev]);
      onDataChange?.();
    }
  }, [onAddRow, onDataChange]);

  // Handle discard changes
  const handleDiscardChanges = useCallback(() => {
    setModifiedCells({});
    setInternalData(externalData);
  }, [externalData]);

  // Handle delete selected
  const handleDeleteSelected = useCallback(async () => {
    const selectedIds = table.getSelectedRowModel().rows.map((r) => r.original.id);
    setRowsToDelete(selectedIds);
    setShowDeleteModal(true);
  }, [table, setRowsToDelete, setShowDeleteModal]);

  // Calculate modified count
  const modifiedCount = useMemo(() => {
    return Object.values(modifiedCells).reduce(
      (count, cols) => count + Object.keys(cols).length,
      0
    );
  }, [modifiedCells]);

  // Create edited cells array
  const editedCells = useMemo(
    () =>
      Object.entries(modifiedCells).flatMap(([rowId, cols]) =>
        Object.entries(cols).map(([columnId, value]) => ({
          rowId,
          columnId,
          value: value as CellValue,
        }))
      ),
    [modifiedCells]
  );

  return {
    // State
    table,
    data: internalData,
    modifiedCells,
    editMode,
    isFullscreen,
    isSaving,
    sorting,
    columnFilters,
    columnFilterFlags,
    expandedColumns,
    columnWidthOverrides,
    totalRowWidth,
    modifiedCount,
    editedCells,

    // Actions
    setModifiedCells,
    setEditMode,
    toggleFullscreen,
    handleCellEdit,
    handleAddRow,
    handleDeleteSelected,
    handleSaveChanges: async () => {
      await internalHandleSaveChanges();
    },
    handleDiscardChanges,
    handleColumnExpansionToggle,
    setColumnFilterFlag,
  };
}
