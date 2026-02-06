import { useState, useCallback, useRef } from 'react';
import type { Table, RowData, ModifiedCells, NotificationAdapter } from '@/types';
import { consoleNotificationAdapter } from '@/types/plugins';

/**
 * Props for the useTableActions hook
 */
export interface UseTableActionsProps<TData extends RowData> {
  /** TanStack table instance */
  table: Table<TData>;

  /** Current data array */
  data: TData[];

  /** Setter for data array */
  setData: React.Dispatch<React.SetStateAction<TData[]>>;

  /** Modified cells record */
  modifiedCells: ModifiedCells;

  /** Setter for modified cells */
  setModifiedCells: React.Dispatch<React.SetStateAction<ModifiedCells>>;

  /** Callback when data changes */
  onDataChange?: () => void;

  /** Delete handler */
  onDelete?: (ids: string[]) => Promise<{ totalDeleted: number; total: number }>;

  /** Save handler */
  onSave?: (
    data: TData[],
    modifiedCells: ModifiedCells
  ) => Promise<{ newlyCreated: TData[]; updatedData: TData[] }>;

  /** Notification adapter for showing messages */
  notifications?: NotificationAdapter;
}

/**
 * Return value from useTableActions hook
 */
export interface UseTableActionsReturn<TData extends RowData> {
  /** Whether a save operation is in progress */
  isSaving: boolean;

  /** Whether the table is in fullscreen mode */
  isFullscreen: boolean;

  /** Toggle fullscreen mode */
  toggleFullscreen: () => void;

  /** Whether the delete modal is shown */
  showDeleteModal: boolean;

  /** Setter for delete modal visibility */
  setShowDeleteModal: (show: boolean) => void;

  /** IDs of rows to delete */
  rowsToDelete: string[];

  /** Setter for rows to delete */
  setRowsToDelete: (ids: string[]) => void;

  /** Handle delete confirmation */
  handleDeleteConfirmed: () => Promise<void>;

  /** Handle save changes */
  handleSaveChanges: () => Promise<TData[]>;
}

/**
 * Hook for table-level actions (save, delete, fullscreen)
 *
 * @param props - Hook configuration
 * @returns Table action handlers and state
 *
 * @example
 * ```tsx
 * const {
 *   isSaving,
 *   handleSaveChanges,
 *   handleDeleteConfirmed,
 *   toggleFullscreen,
 * } = useTableActions({
 *   table,
 *   data,
 *   setData,
 *   modifiedCells,
 *   setModifiedCells,
 *   onSave,
 *   onDelete,
 * });
 * ```
 */
export function useTableActions<TData extends RowData>({
  table,
  data,
  setData,
  modifiedCells,
  setModifiedCells,
  onDataChange,
  onDelete,
  onSave,
  notifications = consoleNotificationAdapter,
}: UseTableActionsProps<TData>): UseTableActionsReturn<TData> {
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rowsToDelete, setRowsToDelete] = useState<string[]>([]);

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirmed = useCallback(async () => {
    if (!rowsToDelete.length || !onDelete) return;

    setIsSaving(true);

    try {
      const result = await onDelete(rowsToDelete);

      // Update local data (use Set for O(N+M) instead of O(N*M))
      const deleteSet = new Set(rowsToDelete);
      setData((prev) => prev.filter((row) => !deleteSet.has(row.id)));

      // Reset table selection
      table.resetRowSelection();

      // Notify parent
      onDataChange?.();

      // Show success message
      if (result.totalDeleted === result.total) {
        notifications.success(`${result.totalDeleted} row(s) deleted successfully`);
      } else {
        notifications.warning(
          `Deleted ${result.totalDeleted} of ${result.total} rows`
        );
      }
    } catch (error) {
      console.error('Delete error:', error);
      notifications.error('Error deleting rows');
    } finally {
      setRowsToDelete([]);
      setIsSaving(false);
      setShowDeleteModal(false);
    }
  }, [rowsToDelete, onDelete, table, setData, onDataChange, notifications]);

  /**
   * Handle save changes
   */
  const handleSaveChanges = useCallback(async (): Promise<TData[]> => {
    if (!onSave || isSavingRef.current) return [];

    isSavingRef.current = true;
    setIsSaving(true);

    try {
      const { newlyCreated, updatedData } = await onSave(data, modifiedCells);

      // Build maps for quick lookup
      const updatedMap = new Map(updatedData.map((r) => [r.id, r]));
      const newlyCreatedMap = new Map(newlyCreated.map((r) => [r.id, r]));

      // Preserve original order: replace updated rows in-place
      const preservedData = data.map((row) => {
        if (updatedMap.has(row.id)) return updatedMap.get(row.id)!;
        if (newlyCreatedMap.has(row.id)) return newlyCreatedMap.get(row.id)!;
        return row;
      });

      // Append truly new rows (IDs not already in data)
      const existingIds = new Set(data.map((r) => r.id));
      const trulyNew = newlyCreated.filter((r) => !existingIds.has(r.id));

      setData([...preservedData, ...trulyNew]);

      // Clear modified cells
      setModifiedCells({});

      // Notify parent
      onDataChange?.();

      notifications.success('Changes saved successfully');
      return newlyCreated;
    } catch (error) {
      console.error('Save error:', error);
      notifications.error('Error saving changes');
      return [];
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [data, onSave, setData, modifiedCells, setModifiedCells, onDataChange, notifications]);

  /**
   * Toggle fullscreen mode
   */
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  return {
    isSaving,
    isFullscreen,
    toggleFullscreen,
    showDeleteModal,
    setShowDeleteModal,
    rowsToDelete,
    setRowsToDelete,
    handleDeleteConfirmed,
    handleSaveChanges,
  };
}
