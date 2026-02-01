import { useMemo, useState, useEffect, useCallback } from 'react';
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
  columns: _columnConfigs,
  onDataChange,
  onAddRow,
  onDelete,
  onSave,
  isReadOnlyRow: _isReadOnlyRow,
}: UseExcelTableProps<TData>): UseExcelTableReturn<TData> {
  // Internal state
  const [internalData, setInternalData] = useState<TData[]>(externalData);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [modifiedCells, setModifiedCells] = useState<ModifiedCells>({});
  const [editMode, setEditMode] = useState(false);
  const [columnFilterFlags, setColumnFilterFlags] = useState<Record<string, boolean>>({});
  const [expandedColumns, setExpandedColumns] = useState<Record<string, boolean>>({});

  // Sync external data to internal state
  useEffect(() => {
    setInternalData(externalData);
  }, [externalData]);

  // Cell edit handler
  const handleCellEdit = useCellEdit({
    setData: setInternalData,
    setModifiedCells,
  });

  // Create empty columns array (will be set after table creation)
  const emptyColumns: ColumnDef<TData>[] = useMemo(() => [], []);

  // Create table instance
  const table = useReactTable<TData>({
    data: internalData,
    columns: emptyColumns,
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
