import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSimpleCellEdit } from '@/hooks/internal/useCellEdit';
import { canNavigateHorizontally } from '@/hooks/internal/useKeyboardNavigation';

describe('useCellEdit', () => {
  describe('useSimpleCellEdit', () => {
    it('updates modified cells', () => {
      const setModifiedCells = vi.fn();
      const { result } = renderHook(() => useSimpleCellEdit(setModifiedCells));

      act(() => {
        result.current('row-1', 'name', 'New Value');
      });

      expect(setModifiedCells).toHaveBeenCalled();
      const updateFn = setModifiedCells.mock.calls[0][0];
      const newState = updateFn({});

      expect(newState['row-1']).toEqual({ name: 'New Value' });
    });

    it('preserves existing cell modifications', () => {
      const setModifiedCells = vi.fn();
      const { result } = renderHook(() => useSimpleCellEdit(setModifiedCells));

      act(() => {
        result.current('row-1', 'email', 'test@example.com');
      });

      const updateFn = setModifiedCells.mock.calls[0][0];
      const existingState = { 'row-1': { name: 'Existing' } };
      const newState = updateFn(existingState);

      expect(newState['row-1']).toEqual({
        name: 'Existing',
        email: 'test@example.com',
      });
    });
  });
});

describe('useKeyboardNavigation', () => {
  describe('canNavigateHorizontally', () => {
    const createMockInput = (value: string, selectionStart: number) => {
      return {
        value,
        selectionStart,
      } as HTMLInputElement;
    };

    it('allows navigation left when cursor at start', () => {
      const input = createMockInput('Hello', 0);
      expect(canNavigateHorizontally(input, 'left')).toBe(true);
    });

    it('prevents navigation left when cursor not at start', () => {
      const input = createMockInput('Hello', 2);
      expect(canNavigateHorizontally(input, 'left')).toBe(false);
    });

    it('allows navigation right when cursor at end', () => {
      const input = createMockInput('Hello', 5);
      expect(canNavigateHorizontally(input, 'right')).toBe(true);
    });

    it('prevents navigation right when cursor not at end', () => {
      const input = createMockInput('Hello', 2);
      expect(canNavigateHorizontally(input, 'right')).toBe(false);
    });

    it('always allows navigation for select columns', () => {
      const input = createMockInput('Hello', 2);
      expect(canNavigateHorizontally(input, 'left', true)).toBe(true);
      expect(canNavigateHorizontally(input, 'right', true)).toBe(true);
    });
  });
});
