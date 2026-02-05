# Security Audit Report — react-excel-table v1.2.1

**Date:** 2026-02-05
**Scope:** Full source code review of all 55 source files

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| Medium | 5 |
| Low | 13 |
| Informational | 2 |

Overall: Well-structured codebase with good security awareness. No critical vulnerabilities. The library avoids `dangerouslySetInnerHTML` and has a thoughtful sanitization pipeline for imported data.

---

## Medium Severity Issues

### M1: XSS sanitizer bypass via nested payloads

**File:** `src/utils/security/sanitizer.ts:149-154`

The XSS pattern removal runs each regex only once per string. Unlike the HTML stripping logic (lines 141-146) which uses a `do...while` loop, the XSS patterns are applied in a single pass. A crafted input like `oonnclick==click=alert(1)` can produce a residual `onclick=` after the regex removes the outer match.

**Recommendation:** Wrap the XSS pattern removal in an iterative loop (similar to the HTML stripping logic) that repeats until no more matches are found.

### M2: Stale closure in EditableCell useEffect

**File:** `src/components/cell/EditableCell.tsx:162-166`

```typescript
useEffect(() => {
  if (!isEditing) setEditValue(getInitialValue());
}, [currentValue]); // eslint-disable-line react-hooks/exhaustive-deps
```

`isEditing` and `getInitialValue` are captured in the closure but excluded from the dependency array. When external data changes mid-edit, the stale `isEditing` reference may cause the cell to incorrectly override user input or fail to sync new values.

**Recommendation:** Use a ref for `isEditing` to always read the current value, or restructure the effect to properly handle the editing state.

### M3: Race condition in handleSaveChanges

**File:** `src/hooks/internal/useTableActions.ts:153-156`

The `isSaving` guard reads from a closure-captured value. Two rapid programmatic calls can both see `isSaving === false` before React processes the `setIsSaving(true)` state update, triggering duplicate save operations.

**Recommendation:** Use a ref (`isSavingRef`) for the guard check instead of relying on the state value in the closure.

### M4: useCallback dependency on entire options object

**Files:** `src/plugins/excel-import/useExcelImport.ts:223`, `src/plugins/excel-export/useExcelExport.ts:201`

Both hooks use `options` as a `useCallback` dependency. Consumers passing inline objects create a new reference every render, defeating memoization.

**Recommendation:** Destructure the options and list individual values in the dependency array, or document that consumers should memoize the options object.

### M5: No error boundary protection

**File:** `src/components/table/ExcelTable.tsx`

No error boundary wraps the table. A thrown error in any cell renderer, formatter, or callback crashes the entire component tree.

**Recommendation:** Wrap `ExcelTable` internals in an error boundary that renders a fallback UI and exposes an `onError` callback prop.

---

## Low Severity Issues

### L1: Prototype pollution risk in sanitizeRow

**File:** `src/utils/security/sanitizer.ts:215-226`

`Object.entries(row)` may include keys like `__proto__` or `constructor`. Assignment via `sanitized[key]` could affect the prototype chain of the local object.

**Recommendation:** Filter out `__proto__`, `constructor`, and `prototype` keys before assignment.

### L2: formatBytes crashes on negative input

**File:** `src/utils/formatters/number.ts:196-204`

`Math.log(negative)` returns `NaN`, producing output like `"NaN undefined"`.

**Recommendation:** Add a guard: `if (bytes < 0) return '-' + formatBytes(-bytes, decimals);` or return an error string.

### L3: Import ID collision risk

**File:** `src/plugins/excel-import/useExcelImport.ts:160`

`Date.now()` has millisecond precision. Simultaneous imports can produce duplicate IDs.

**Recommendation:** Add a random component: `crypto.randomUUID()` or a monotonic counter.

### L4: Regex lastIndex side-effect in statistics

**File:** `src/utils/security/sanitizer.ts:316`

`HTML_TAG_PATTERN` (defined with the `g` flag at module scope) retains `lastIndex` between `.test()` calls, causing alternating true/false results for identical inputs.

**Recommendation:** Use a non-global regex for the `.test()` call, or reset `lastIndex = 0` before testing.

### L5: Canvas allocation churn in measureTextWidth

**File:** `src/utils/autosize/calculator.ts:78-92`

A new `<canvas>` element is created per call. For large datasets this means N*M allocations.

**Recommendation:** Cache the canvas element at module scope or use a singleton pattern.

### L6: Multiple global keyboard listeners

**File:** `src/hooks/internal/useKeyboardNavigation.ts:57-58`

Multiple `ExcelTable` instances each register a `window` keydown handler. F11/Escape fires for all tables.

**Recommendation:** Scope keyboard handlers to the table container element instead of `window`.

### L7: Silent data loss on external data change

**File:** `src/hooks/internal/useExcelTable.ts:80-83`

When the `data` prop changes, all unsaved modifications are silently discarded without consulting the `confirmDiscard` config.

**Recommendation:** Check `confirmDiscard` before resetting `modifiedCells`, or expose a callback to let the consumer decide.

### L8: confirmDiscard config defined but never used

**File:** `src/config/ExcelTableProvider.tsx:109`

The `confirmDiscard` boolean exists in the config type and defaults to `true`, but no code reads it.

**Recommendation:** Either implement the confirmation behavior or remove the config option.

### L9: NumberCell silently transforms multi-decimal input

**File:** `src/components/cell/NumberCell.tsx:57-63`

Input `1.2.3` silently becomes `1.23` by concatenating parts.

**Recommendation:** Consider rejecting the input or showing a validation message instead.

### L10: No bounds validation on security config values

**File:** `src/config/ExcelTableProvider.tsx:141-152`

Negative `maxCellLength` causes `slice(0, -1)` to remove the last character. Zero values truncate all content.

**Recommendation:** Validate that numeric config values are positive integers.

### L11: disableSanitization flag is overly broad

**File:** `src/plugins/excel-import/useExcelImport.ts:85-86`

Setting `disableSanitization: true` also skips file size and extension validation.

**Recommendation:** Separate `disableContentSanitization` from `disableFileValidation`.

### L12: Unsafe double type assertion

**File:** `src/components/table/TableBody.tsx:174`

`rows as unknown as Row<RowData>[]` bypasses all type checking.

**Recommendation:** Fix the underlying type mismatch or add a runtime check.

### L13: Console error logging in production

**Files:** `ExcelTable.tsx:122`, `useTableActions.ts:141,187`, `useAutosize.ts:110`, `ExcelExportButton.tsx:32`

Error objects logged to browser console in production may expose internal details.

**Recommendation:** Use a configurable logger that can be silenced in production.

---

## Informational

- **Source maps in production build** (`vite.config.ts:59`): Expected for open-source; would be a concern for proprietary code.
- **react-window in maintenance mode**: No known CVEs, but unlikely to receive future security patches.
