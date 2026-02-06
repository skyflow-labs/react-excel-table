# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-XX-XX

### Added

- Initial release of react-sheet-table
- `SheetTable` component with editable cells
- Support for multiple cell types: text, number, currency, date, select, boolean
- Full keyboard navigation (Arrow keys, Tab, Enter, Escape)
- Virtualized rendering with react-window for large datasets
- Column auto-sizing based on content
- Row selection and bulk operations
- Spreadsheet import plugin (CSV support via papaparse)
- Spreadsheet export plugin (.xlsx support via exceljs)
- CSS variables for easy theming
- Full TypeScript support
- Comprehensive test coverage

### Cell Types

- `STRING` - Basic text input
- `NUMBER` - Numeric input with formatting
- `CURRENCY` - Currency input with locale support
- `DATE` - Date picker with configurable format
- `SELECT` - Dropdown with search functionality
- `BOOLEAN` - Checkbox/toggle

### Hooks

- `useSheetTable` - Main table logic hook
- `useKeyboardNavigation` - Keyboard navigation handling
- `useAutosize` - Column width calculation
- `useCellEdit` - Cell editing logic

### Plugins

- `sheet-import` - Import CSV files
- `sheet-export` - Export to .xlsx format
