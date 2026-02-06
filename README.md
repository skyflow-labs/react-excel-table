# react-sheet-table

A powerful, secure, and customizable Spreadsheet-style data table for React.

[![npm version](https://img.shields.io/npm/v/react-sheet-table.svg)](https://www.npmjs.com/package/react-sheet-table)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- **Minimal Setup** - Only `data` and `columns` required
- **Full Keyboard Navigation** - Arrow keys, Tab, Enter, Escape
- **Virtualized** - Handles 10,000+ rows
- **Secure by Default** - Protection against XSS and formula injection
- **Fully Customizable** - CSS variables for theming
- **TypeScript First** - Complete type safety
- **Tree-shakeable** - Import only what you need

## Installation

```bash
npm install react-sheet-table
```

**Peer dependencies:**
```bash
npm install react react-dom @tanstack/react-table react-window
```

---

## Quick Start

```tsx
import { SheetTable } from 'react-sheet-table';
import 'react-sheet-table/styles';

const data = [
  { id: '1', name: 'John', email: 'john@example.com', amount: 1500 },
  { id: '2', name: 'Jane', email: 'jane@example.com', amount: 2300 },
];

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'amount', header: 'Amount', dataType: 'currency' },
];

function App() {
  return <SheetTable data={data} columns={columns} />;
}
```

That's it. You have a working editable table.

---

## Examples

### Save Changes

```tsx
<SheetTable
  data={data}
  columns={columns}
  onSave={async (data, modifiedCells) => {
    // modifiedCells = { rowId: { columnId: newValue } }
    await api.save(modifiedCells);
    return { newlyCreated: [], updatedData: data };
  }}
/>
```

### Add and Delete Rows

```tsx
<SheetTable
  data={data}
  columns={columns}
  onAddRow={() => ({
    id: crypto.randomUUID(),
    name: '',
    email: '',
    amount: 0,
  })}
  onDelete={async (ids) => {
    await api.delete(ids);
    return { totalDeleted: ids.length, total: data.length };
  }}
/>
```

### Read-Only Rows

```tsx
<SheetTable
  data={data}
  columns={columns}
  isReadOnlyRow={(row) => row.status === 'locked'}
/>
```

### Read-Only Columns

```tsx
const columns = [
  { accessorKey: 'id', header: 'ID', editable: false },
  { accessorKey: 'name', header: 'Name' }, // editable by default
  { accessorKey: 'total', header: 'Total', dataType: 'currency', editable: false },
];
```

### Track Changes in Real-Time

```tsx
<SheetTable
  data={data}
  columns={columns}
  onModifiedCellsChange={(cells) => {
    console.log('Modified:', cells);
  }}
/>
```

### Loading State

```tsx
<SheetTable data={data} columns={columns} loading={isLoading} />
```

---

## Column Types

| Type | Usage | Example |
|------|-------|---------|
| `string` | Text input (default) | Name, Email |
| `number` | Numeric input | Quantity |
| `currency` | Formatted money | Price, Total |
| `date` | Date picker | Created, Due Date |
| `select` | Dropdown | Status, Category |
| `boolean` | Checkbox | Active, Verified |

### Column Configuration

```tsx
{
  // Required
  accessorKey: 'fieldName',
  header: 'Display Name',

  // Optional
  dataType: 'string',      // 'string' | 'number' | 'currency' | 'date' | 'select' | 'boolean'
  editable: true,          // Allow editing
  sortable: false,         // Enable sorting
  size: 140,               // Fixed width (px)
  autosize: false,         // Auto-calculate width
  minWidth: 80,            // Minimum width
  maxWidth: 400,           // Maximum width
  dateFormat: 'yyyy-MM-dd', // For date columns
  meta: { ... },           // Extended options
}
```

### Select Column

```tsx
{
  accessorKey: 'status',
  header: 'Status',
  dataType: 'select',
  meta: {
    selectOptions: [
      { label: 'Pending', value: 'pending' },
      { label: 'Approved', value: 'approved' },
      { label: 'Rejected', value: 'rejected' },
    ],
  },
}
```

### Dynamic Select Options

```tsx
{
  accessorKey: 'category',
  header: 'Category',
  dataType: 'select',
  meta: {
    getDynamicSelectOptions: (row) => {
      return row.type === 'income' ? incomeOptions : expenseOptions;
    },
    onAddNew: () => openModal(),
  },
}
```

---

## Styling

### CSS Variables

```css
:root {
  /* Colors */
  --sheet-primary: #30867B;
  --sheet-primary-hover: #2D9084;
  --sheet-danger: #ef4444;
  --sheet-success: #22c55e;

  /* Cell States */
  --sheet-cell-modified-bg: #2D9084;
  --sheet-cell-modified-text: #ffffff;
  --sheet-cell-readonly-bg: #f3f4f6;
  --sheet-cell-hover-bg: #f9fafb;

  /* Layout */
  --sheet-row-height: 40px;
  --sheet-header-height: 44px;
  --sheet-border-color: #e5e7eb;
  --sheet-border-radius: 0.375rem;

  /* Typography */
  --sheet-font-family: system-ui, sans-serif;
  --sheet-font-size: 14px;
}
```

### Built-in Variants

```tsx
// Compact
<SheetTable className="sheet-table--compact" ... />

// Comfortable (spacious)
<SheetTable className="sheet-table--comfortable" ... />

// Bordered cells
<SheetTable className="sheet-table--bordered" ... />

// Striped rows
<SheetTable className="sheet-table--striped" ... />

// No borders
<SheetTable className="sheet-table--borderless" ... />
```

### Color Themes

```tsx
<SheetTable className="sheet-theme--blue" ... />
<SheetTable className="sheet-theme--purple" ... />
<SheetTable className="sheet-theme--orange" ... />
<SheetTable className="sheet-theme--rose" ... />
```

### Dark Mode

```css
[data-theme="dark"] {
  --sheet-primary: #4ade80;
  --sheet-cell-modified-bg: #166534;
  --sheet-cell-readonly-bg: #1f2937;
  --sheet-border-color: #374151;
  --sheet-cell-hover-bg: #1f2937;
}
```

### Tailwind CSS

```js
// tailwind.config.js
import { sheetTablePreset } from 'react-sheet-table/styles';

export default {
  presets: [sheetTablePreset],
}
```

---

## Global Configuration

Set defaults for all tables:

```tsx
import { SheetTableProvider, LOCALE_PRESETS } from 'react-sheet-table';

function App() {
  return (
    <SheetTableProvider
      locale={{
        ...LOCALE_PRESETS['es-MX'],
        currency: 'MXN',
        dateFormat: 'dd/MM/yyyy',
      }}
    >
      <YourApp />
    </SheetTableProvider>
  );
}
```

### Available Presets

| Preset | Currency | Date Format |
|--------|----------|-------------|
| `en-US` | USD | MM/dd/yyyy |
| `es-MX` | MXN | dd/MM/yyyy |
| `es-ES` | EUR | dd/MM/yyyy |
| `de-DE` | EUR | dd.MM.yyyy |
| `fr-FR` | EUR | dd/MM/yyyy |
| `pt-BR` | BRL | dd/MM/yyyy |
| `ja-JP` | JPY | yyyy/MM/dd |

---

## Import Plugin

Import CSV/XLSX files with automatic security sanitization.

```bash
npm install papaparse
```

```tsx
import { useSheetImport } from 'react-sheet-table/plugins/sheet-import';

function ImportButton() {
  const { importFile, isImporting } = useSheetImport({
    columnMapping: {
      'Fecha': 'date',
      'Monto': 'amount',
    },
    // Security enabled by default
  });

  const handleFile = async (e) => {
    const file = e.target.files[0];
    const result = await importFile(file);
    setData(result.rows);
  };

  return <input type="file" onChange={handleFile} disabled={isImporting} />;
}
```

### Security Options

```tsx
useSheetImport({
  columnMapping,
  security: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxRows: 5000,
    blockFormulaInjection: true, // Block =, +, -, @
    sanitizeText: true,          // Remove XSS patterns
    stripHtml: true,             // Remove HTML tags
  },
});
```

---

## Export Plugin

Export to XLSX or CSV with formula injection protection.

```bash
npm install exceljs  # For .xlsx export
```

```tsx
import { useSheetExport, exportToCSV } from 'react-sheet-table/plugins/sheet-export';

function ExportButtons({ data, columns }) {
  const { exportToXlsx, isExporting } = useSheetExport(data, {
    filename: 'report',
    columns,
  });

  return (
    <>
      <button onClick={exportToXlsx}>Export .xlsx</button>
      <button onClick={() => exportToCSV(data, { filename: 'report' })}>
        Export CSV
      </button>
    </>
  );
}
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Arrow Keys | Navigate cells |
| Tab | Next cell |
| Shift+Tab | Previous cell |
| Enter | Edit / Confirm |
| Escape | Cancel / Exit fullscreen |
| F11 | Toggle fullscreen |

---

## TypeScript

```tsx
import type { ColumnConfig, RowData } from 'react-sheet-table';

// Your data must have an id field
interface Transaction extends RowData {
  id: string;
  date: string;
  amount: number;
}

// Columns are fully typed
const columns: ColumnConfig<Transaction>[] = [
  { accessorKey: 'date', header: 'Date', dataType: 'date' },
  { accessorKey: 'amount', header: 'Amount', dataType: 'currency' },
];
```

---

## API Reference

### SheetTable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | Required | Data array |
| `columns` | `ColumnConfig[]` | Required | Column definitions |
| `loading` | `boolean` | `false` | Loading state |
| `onSave` | `function` | - | Save handler |
| `onDelete` | `function` | - | Delete handler |
| `onAddRow` | `function` | - | New row factory |
| `onModifiedCellsChange` | `function` | - | Change callback |
| `isReadOnlyRow` | `function` | - | Row lock checker |
| `isLinkedRow` | `function` | - | Linked row indicator |
| `className` | `string` | - | Container class |

---

## Security

This library includes protection against common attacks:

- **Formula Injection** - Values starting with `=`, `+`, `-`, `@` are neutralized
- **XSS** - HTML tags and dangerous patterns are stripped
- **File Validation** - Size limits, extension whitelist
- **Path Traversal** - Suspicious filenames are rejected

All security features are **enabled by default**.

---

## Browser Support

Chrome, Firefox, Safari, Edge (last 2 versions)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

---

## Trademarks

Microsoft and Excel are trademarks of the Microsoft group of companies. This project is not affiliated with, endorsed by, or sponsored by Microsoft Corporation.

## License

MIT
