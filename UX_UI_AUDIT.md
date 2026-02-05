# UX/UI Audit Report — react-excel-table v1.2.1

**Date:** 2026-02-05
**Scope:** Accessibility, keyboard navigation, cell editing UX, visual feedback, error handling
**Priority:** Stability-first — small, targeted improvements only

## Summary

| Severity | Count |
|----------|-------|
| High | 9 |
| Medium | 13 |
| Low | 4 |

## Recommended Priority Order

### Immediate (high-value, low-risk)

1. Remove `key={dataVersion}` from virtualized list (prevents scroll reset on edit)
2. Fix Escape key conflict between cell editing and fullscreen exit
3. Restore focus to display cell after Escape cancels editing
4. Add `role="dialog"`, `aria-modal`, and auto-focus to DeleteModal
5. Surface save/delete errors to the user (not just console.log)
6. Prevent backdrop click during active delete operation
7. Add Escape key support to DeleteModal
8. Add accessible label to loading spinner

### Short-term (medium effort, good payoff)

9. Add keyboard arrow navigation within SelectCell dropdown
10. Add ARIA grid/row/gridcell roles to table structure
11. Add indeterminate state to select-all checkbox
12. Fix Enter-on-empty-search in SelectCell
13. Add Tab wrap-around to next/previous row
14. Add onBlur to BooleanCell
15. Allow negative numbers in NumberCell/CurrencyCell

---

## High Severity Issues

### H1: Virtualized list `key={dataVersion}` resets scroll position on every edit

**File:** `src/components/table/TableBody.tsx:207`

The `FixedSizeList` uses `key={dataVersion}` which increments on every data/modifiedCells change. React unmounts and remounts the entire list, resetting scroll position to the top.

**Impact:** After editing a cell at row 500, user is scrolled back to row 1.

**Fix:** Remove the `key` prop. `react-window` already re-renders visible rows when `itemData` changes.

### H2: Escape key conflict — cell editing vs. fullscreen exit

**File:** `src/hooks/internal/useKeyboardNavigation.ts:52-54`

Both `useKeyboardNavigation` (global window listener) and `EditableCell` handle Escape. Pressing Escape while editing a cell in fullscreen mode cancels the edit AND exits fullscreen simultaneously.

**Fix:** In `useKeyboardNavigation`, check if the event target is an input/select/textarea before exiting fullscreen:
```ts
if (event.key === 'Escape' && isFullscreen) {
  const tag = (event.target as HTMLElement).tagName;
  if (tag !== 'INPUT' && tag !== 'SELECT' && tag !== 'TEXTAREA') {
    toggleFullscreen();
  }
}
```

### H3: Focus lost after Escape cancels editing

**File:** `src/components/cell/EditableCell.tsx:381-385`

When Escape is pressed, `setIsEditing(false)` unmounts the input. Focus is lost entirely — keyboard-only users lose their position.

**Fix:** After `resetState()`, use `requestAnimationFrame` to refocus the display cell at the same row/col position.

### H4: DeleteModal has no dialog role, focus trap, or auto-focus

**File:** `src/components/controls/DeleteModal.tsx:40-113`

No `role="dialog"`, no `aria-modal="true"`, no `aria-labelledby`, no focus trapping. Screen readers don't announce it as a dialog. Tab can escape behind the backdrop.

**Fix:** Add ARIA attributes and auto-focus the Cancel button on mount.

### H5: Save errors invisible to user

**File:** `src/hooks/internal/useTableActions.ts:186-189`

When `onSave` throws, the error is logged to console and `notifications.error()` is called — but the default adapter just calls `console.error`. The user sees the spinner disappear with no feedback.

**Fix:** Add an `error` state to `useTableActions` and render it in `TableControls`.

### H6: Delete errors silently swallowed

**File:** `src/components/table/ExcelTable.tsx:121-123`

`handleDeleteConfirmed` catches errors and only does `console.error`. The modal closes, user sees no feedback.

**Fix:** Keep the modal open on error and display an error message within it.

### H7: Loading spinner has no accessible label

**File:** `src/components/table/ExcelTable.tsx:128-133`

The loading spinner is a purely visual `<div>` with no text content and no ARIA attributes.

**Fix:** Add `role="status"` and `aria-label="Loading table data"`, plus a `sr-only` text span.

### H8: Select dropdown has no keyboard navigation

**File:** `src/components/cell/SelectCell.tsx:156-204`

Dropdown options are mouse-only. No ArrowUp/Down handling, no `activeIndex` state, no visual highlight for the current keyboard-selected item.

**Fix:** Add `activeIndex` state with ArrowUp/Down key handlers and visual highlight on the active option.

### H9: No table/grid ARIA roles

**Files:** `src/components/table/TableHeader.tsx:32-68`, `src/components/table/TableBody.tsx:81-109`

The entire table uses `<div>` elements with no `role` attributes. Screen readers cannot navigate by table structure.

**Fix:** Add `role="grid"` to container, `role="row"` to row divs, `role="columnheader"` to header cells, `role="gridcell"` to body cells.

---

## Medium Severity Issues

### M1: Delete button SVG not aria-hidden

**File:** `src/components/table/ExcelTable.tsx:187`

SVG icon inside button has no `aria-hidden="true"`. Screen readers attempt to parse SVG paths.

### M2: Select-all checkbox no accessible label

**File:** `src/components/table/columns.tsx:293`

The checkbox has no `aria-label`. Screen readers announce "checkbox" with no context.

### M3: SpeedDial no `aria-expanded` state

**File:** `src/components/controls/SpeedDial.tsx:122`

The FAB button toggles `isOpen` but doesn't convey state to assistive technology.

### M4: Tab at last cell loses focus

**File:** `src/components/cell/EditableCell.tsx:352`

Pressing Tab on the last column tries to navigate to `columnIndex + 1` which doesn't exist. Focus is lost.

**Fix:** Wrap to next row's first column (or previous row's last column for Shift+Tab).

### M5: Arrow keys in non-edit mode immediately enter edit mode

**File:** `src/components/cell/EditableCell.tsx:181-204`

`navigateToCell` calls `.click()` on the target cell, which triggers edit mode. Users expect arrow keys to move focus without entering edit.

### M6: Negative numbers cannot be entered

**Files:** `src/components/cell/NumberCell.tsx:54`, `src/components/cell/CurrencyCell.tsx:54`

The input filter regex strips all characters except `[0-9.]`. Minus sign is removed.

**Fix:** Update regex to allow leading minus: `/[^0-9.\-]/g`

### M7: Enter on empty search selects first option in SelectCell

**File:** `src/components/cell/SelectCell.tsx:109`

Pressing Enter without typing selects the first option, potentially changing the value unintentionally.

**Fix:** If `searchTerm` is empty, close dropdown without changing value.

### M8: Select-all checkbox no indeterminate state

**File:** `src/components/table/columns.tsx:293`

When some but not all rows are selected, the checkbox shows as unchecked (same as "none selected").

**Fix:** Use a ref to set `checkbox.indeterminate = true` when partially selected.

### M9: Backdrop click during delete operation causes inconsistent state

**File:** `src/components/controls/DeleteModal.tsx:43`

The backdrop `onClick={onClose}` fires even when `isSaving` is true. Modal closes but async operation continues.

**Fix:** Guard: `onClick={isSaving ? undefined : onClose}`

### M10: DeleteModal doesn't close on Escape key

**File:** `src/components/controls/DeleteModal.tsx`

Standard dialog behavior expects Escape to dismiss. Currently no keyboard handler exists.

### M11: Fixed FAB overlaps content on mobile

**File:** `src/components/controls/SpeedDial.tsx:93`

`fixed bottom-6 right-6` can cover last rows of data on narrow viewports.

**Fix:** Add bottom padding to table container to account for FAB height.

### M12: Touch targets too small in headers

**File:** `src/components/table/columns.tsx:222`

Sort/expand buttons in headers are 12x12px SVGs — far below WCAG's 44px minimum for touch targets.

### M13: Discard button has no confirmation

**File:** `src/components/controls/TableControls.tsx:47`

Clicking "Discard" immediately resets all modified cells with no confirmation. Users can lose many edits accidentally.

**Fix:** Add a `window.confirm()` guard when `editedCellsCount > 5`.

### M14: BooleanCell has no onBlur handler

**File:** `src/components/cell/EditableCell.tsx:463-475`

Unlike all other cell types, BooleanCell has no blur handler. Clicking outside leaves the cell stuck in edit mode.

---

## Low Severity Issues

### L1: SpeedDial SVGs not aria-hidden

**File:** `src/components/controls/SpeedDial.tsx`

All decorative SVGs should have `aria-hidden="true"`.

### L2: BooleanCell switch variant no aria-label

**File:** `src/components/cell/BooleanCell.tsx:68`

The `role="switch"` button has no `aria-label`.

### L3: Modified cell color inconsistency

**File:** `src/styles/variables.css:37-38`

Modified cells show teal background when not editing but yellow when editing — inconsistent visual language.

### L4: Currency symbol slight vertical misalignment

**File:** `src/components/cell/CurrencyCell.tsx:73-96`

The `$` symbol is centered on the wrapper, but the input has `margin: 2px 0` shifting it down.
