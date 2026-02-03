import { useState, useEffect, useRef } from 'react';
import type { RowData, ExcelTableProps } from '@/types';
import { useExcelTable } from '@/hooks/internal/useExcelTable';
import { useKeyboardNavigation } from '@/hooks/internal/useKeyboardNavigation';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { TableControls } from '@/components/controls/TableControls';
import { SpeedDial } from '@/components/controls/SpeedDial';
import { DeleteModal } from '@/components/controls/DeleteModal';

import '@/styles/variables.css';

/**
 * Main Excel-like table component
 *
 * @example
 * ```tsx
 * <ExcelTable
 *   data={transactions}
 *   columns={columnConfigs}
 *   onSave={handleSave}
 *   onDelete={handleDelete}
 *   onAddRow={handleAddRow}
 * />
 * ```
 */
export function ExcelTable<TData extends RowData>({
  data,
  loading = false,
  columns: columnConfigs,
  onDataChange,
  onAddRow,
  onDelete,
  onSave,
  onModifiedCellsChange,
  isReadOnlyRow,
  isLinkedRow,
  defaultFullscreen: _defaultFullscreen = false,
  className = '',
}: ExcelTableProps<TData>) {
  // Main table logic — columns are built inside the hook and passed
  // directly to useReactTable, so getHeaderGroups() works on first render.
  const {
    table,
    data: internalData,
    modifiedCells,
    editMode,
    setEditMode,
    isFullscreen,
    toggleFullscreen,
    isSaving,
    handleAddRow,
    handleSaveChanges,
    handleDiscardChanges,
    editedCells,
  } = useExcelTable({
    data,
    columns: columnConfigs,
    onDataChange,
    onAddRow,
    onDelete,
    onSave,
    isReadOnlyRow,
  });

  // Keyboard shortcuts
  useKeyboardNavigation({
    isFullscreen,
    toggleFullscreen,
  });

  // Version counter that increments on data/cell changes to force
  // react-window to re-render visible items with fresh cell values.
  const dataVersionRef = useRef(0);
  const prevModifiedCellsRef = useRef(modifiedCells);
  const prevDataRef = useRef(internalData);
  if (modifiedCells !== prevModifiedCellsRef.current || internalData !== prevDataRef.current) {
    dataVersionRef.current++;
    prevModifiedCellsRef.current = modifiedCells;
    prevDataRef.current = internalData;
  }

  // Notify parent of modified cells changes
  useEffect(() => {
    onModifiedCellsChange?.(modifiedCells);
  }, [modifiedCells, onModifiedCellsChange]);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rowsToDelete, setRowsToDelete] = useState<string[]>([]);

  const handleShowDeleteModal = () => {
    const selectedIds = table.getSelectedRowModel().rows.map((r) => r.original.id);
    setRowsToDelete(selectedIds);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!onDelete || rowsToDelete.length === 0) return;

    try {
      await onDelete(rowsToDelete);
      table.resetRowSelection();
      setRowsToDelete([]);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const tableContent = (
    <>
      <TableControls
        editedCellsCount={editedCells.length}
        onDiscard={handleDiscardChanges}
        onSave={handleSaveChanges}
        isSaving={isSaving}
      />

      <div className="flex-1 flex flex-col border border-gray-300 rounded-lg overflow-hidden min-h-0">
        <TableHeader table={table} />
        <TableBody
          table={table}
          isLinkedRow={isLinkedRow}
          isReadOnlyRow={isReadOnlyRow}
          dataVersion={dataVersionRef.current}
        />
      </div>

      <SpeedDial
        onAdd={onAddRow ? handleAddRow : undefined}
        deleteMode={editMode}
        onDeleteModeToggle={(active) => {
          setEditMode(active);
          if (!active) {
            table.resetRowSelection();
            setRowsToDelete([]);
          }
        }}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {editMode && table.getSelectedRowModel().rows.length > 0 && (
        <button
          type="button"
          onClick={handleShowDeleteModal}
          className="
            fixed bottom-24 right-6 z-40
            flex items-center gap-2 px-4 py-2
            bg-red-600 text-white rounded-lg shadow-lg
            hover:bg-red-700 transition-colors
          "
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
          Delete ({table.getSelectedRowModel().rows.length})
        </button>
      )}

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirmed}
        isSaving={isSaving}
        count={rowsToDelete.length}
      />
    </>
  );

  return isFullscreen ? (
    <div className="fixed inset-0 z-50 bg-white flex flex-col p-4">
      {tableContent}
    </div>
  ) : (
    <div className={`w-full h-full flex flex-col space-y-4 relative ${className}`}>
      {tableContent}
    </div>
  );
}
