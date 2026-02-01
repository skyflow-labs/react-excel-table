import { useEffect, useCallback } from 'react';
import type { Table, RowData } from '@/types';

/**
 * Navigation direction
 */
export type NavigationDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Props for the useKeyboardNavigation hook
 */
export interface UseKeyboardNavigationProps {
  /** Whether the table is in fullscreen mode */
  isFullscreen: boolean;

  /** Toggle fullscreen mode */
  toggleFullscreen: () => void;

  /** Enable/disable navigation */
  enabled?: boolean;
}

/**
 * Hook for handling global keyboard shortcuts (F11, Escape)
 *
 * @param props - Hook configuration
 *
 * @example
 * ```tsx
 * useKeyboardNavigation({
 *   isFullscreen,
 *   toggleFullscreen,
 * });
 * ```
 */
export function useKeyboardNavigation({
  isFullscreen,
  toggleFullscreen,
  enabled = true,
}: UseKeyboardNavigationProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // F11: Toggle fullscreen
      if (event.key === 'F11') {
        event.preventDefault();
        toggleFullscreen();
      }

      // Escape: Exit fullscreen
      if (event.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, toggleFullscreen, enabled]);
}

/**
 * Props for cell navigation
 */
export interface UseCellNavigationProps<TData extends RowData> {
  /** TanStack table instance */
  table: Table<TData>;

  /** Enable/disable navigation */
  enabled?: boolean;

  /** Callback when navigating to a cell */
  onNavigate?: (rowIndex: number, columnIndex: number) => void;
}

/**
 * Hook for cell-level keyboard navigation
 *
 * @param props - Hook configuration
 * @returns Navigation helper functions
 */
export function useCellNavigation<TData extends RowData>({
  table,
  enabled = true,
  onNavigate,
}: UseCellNavigationProps<TData>) {
  /**
   * Navigate to a specific cell
   */
  const navigateToCell = useCallback(
    (rowIndex: number, columnIndex: number) => {
      if (!enabled || !table?.getRowModel) return;

      const rows = table.getRowModel().rows;
      const columns = table.getAllColumns();

      const isValidCell =
        rowIndex >= 0 &&
        rowIndex < rows.length &&
        columnIndex >= 0 &&
        columnIndex < columns.length;

      if (isValidCell) {
        onNavigate?.(rowIndex, columnIndex);

        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          const nextCell = document.querySelector(
            `[data-row="${rowIndex}"][data-col="${columnIndex}"]`
          ) as HTMLElement;

          if (nextCell) {
            nextCell.click();
            nextCell.focus();
          }
        });
      }
    },
    [enabled, table, onNavigate]
  );

  /**
   * Navigate relative to current position
   */
  const navigateRelative = useCallback(
    (currentRow: number, currentCol: number, direction: NavigationDirection) => {
      const offsets: Record<NavigationDirection, [number, number]> = {
        up: [-1, 0],
        down: [1, 0],
        left: [0, -1],
        right: [0, 1],
      };

      const [rowOffset, colOffset] = offsets[direction];
      navigateToCell(currentRow + rowOffset, currentCol + colOffset);
    },
    [navigateToCell]
  );

  /**
   * Create navigation handlers for a specific cell
   */
  const createNavigationHandlers = useCallback(
    (rowIndex: number, columnIndex: number) => ({
      ArrowUp: () => navigateRelative(rowIndex, columnIndex, 'up'),
      ArrowDown: () => navigateRelative(rowIndex, columnIndex, 'down'),
      ArrowLeft: () => navigateRelative(rowIndex, columnIndex, 'left'),
      ArrowRight: () => navigateRelative(rowIndex, columnIndex, 'right'),
      Tab: (shiftKey: boolean) =>
        navigateRelative(rowIndex, columnIndex, shiftKey ? 'left' : 'right'),
      Enter: () => navigateRelative(rowIndex, columnIndex, 'right'),
    }),
    [navigateRelative]
  );

  return {
    navigateToCell,
    navigateRelative,
    createNavigationHandlers,
  };
}

/**
 * Check if navigation can proceed horizontally
 *
 * @param input - Input element
 * @param direction - Navigation direction
 * @param isSelectColumn - Whether this is a select-type column
 * @returns Whether navigation should proceed
 */
export function canNavigateHorizontally(
  input: HTMLInputElement,
  direction: 'left' | 'right',
  isSelectColumn: boolean = false
): boolean {
  // For select columns, always allow navigation
  if (isSelectColumn) return true;

  const cursorPosition = input.selectionStart || 0;
  const textLength = input.value.length;

  // Can navigate left only if cursor is at start
  // Can navigate right only if cursor is at end
  return direction === 'left' ? cursorPosition === 0 : cursorPosition === textLength;
}

/**
 * Handle cell keyboard events
 *
 * @param event - Keyboard event
 * @param handlers - Object with handler functions for each key
 * @param isEditing - Whether the cell is in edit mode
 */
export function handleCellKeyDown(
  event: React.KeyboardEvent,
  handlers: {
    onEnter?: () => void;
    onTab?: (shiftKey: boolean) => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onEscape?: () => void;
  },
  isEditing: boolean = false
) {
  const { key, shiftKey } = event;

  switch (key) {
    case 'Enter':
      event.preventDefault();
      handlers.onEnter?.();
      break;

    case 'Tab':
      event.preventDefault();
      handlers.onTab?.(shiftKey);
      break;

    case 'ArrowUp':
      if (!isEditing) {
        event.preventDefault();
        handlers.onArrowUp?.();
      }
      break;

    case 'ArrowDown':
      if (!isEditing) {
        event.preventDefault();
        handlers.onArrowDown?.();
      }
      break;

    case 'ArrowLeft':
      if (!isEditing) {
        event.preventDefault();
        handlers.onArrowLeft?.();
      }
      break;

    case 'ArrowRight':
      if (!isEditing) {
        event.preventDefault();
        handlers.onArrowRight?.();
      }
      break;

    case 'Escape':
      event.preventDefault();
      handlers.onEscape?.();
      break;
  }
}
