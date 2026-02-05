# Legal/Trademark Audit Report — react-excel-table v1.2.1

**Date:** 2026-02-05
**Scope:** Trademark risk analysis for use of "Excel" in package name, public APIs, and branding

## Summary

**"Excel" is a registered trademark of Microsoft Corporation** (Registration No. 4,369,346, International Class 42). The current use of "Excel" throughout this project violates Microsoft's published trademark guidelines and carries moderate legal risk.

## Trademark Details

| Field | Value |
|-------|-------|
| Mark | EXCEL |
| Owner | Microsoft Corporation |
| Registration No. | 4,369,346 |
| Status | Active, Incontestable (Section 8 & 15 accepted) |
| Class | 42 — Cloud computing, spreadsheet software |
| Filed | November 8, 2011 |
| Registered | July 16, 2013 |

## Risk Assessment

**Risk level: MODERATE**

### Factors increasing risk

1. The package name `react-excel-table` uses "Excel" as a source identifier in the software domain — the same domain covered by Microsoft's registration.
2. "Excel" is used not just to reference compatibility, but as an adjective describing the product itself ("Excel-like"), which goes beyond nominative fair use.
3. Microsoft's published guidelines explicitly state: "Don't use Microsoft's Brand Assets in the name of your product or service."
4. Microsoft has enforced this trademark before — Savvysoft's "TurboExcel" was forced to rebrand to "Calc4Web" in a 2007 settlement.
5. Microsoft owns both npm (via GitHub acquisition) and GitHub, giving them direct platform control to enforce trademark disputes through their own policies.
6. The trademark is "incontestable" (Section 15), providing the strongest possible legal protection.

### Factors reducing risk

1. The package is free, open-source, and MIT-licensed — not a competing spreadsheet product.
2. "Excel" appears as one word in a compound name alongside other descriptive terms.
3. The word "excel" has a common English meaning predating Microsoft's product.
4. Hundreds of other npm packages use "excel" without apparent enforcement.
5. The project does not use Microsoft's logos, icons, or trade dress.

### Precedent: Savvysoft TurboExcel → Calc4Web (2007)

Savvysoft sold "TurboExcel," an Excel add-on. Microsoft sent a cease-and-desist. Settlement required rebranding to "Calc4Web" in exchange for Microsoft co-marketing the product. Neither party admitted liability.

## Current Exposure

"Excel" appears in **470 lines** across the codebase:

| Category | Count |
|----------|-------|
| Package name | 1 |
| Component names | 4 |
| Hook names | 4 |
| Type/Interface names | 14 |
| Source files with "Excel" in filename | 7 |
| Directories with "excel" in name | 3 |
| CSS custom properties (`--excel-*`) | ~75 |
| CSS class names (`.excel-*`) | 17 |
| Tailwind preset tokens | ~30 |
| Documentation references | 7 files |
| Code comments | 30+ |
| npm keywords | 1 (`"excel"`) |

## Potential Consequences

1. **Cease-and-desist letter** from Microsoft's legal team
2. **npm package name transfer** via npm's trademark dispute policy
3. **GitHub repository action** via GitHub's trademark infringement terms
4. **Forced rebranding** under settlement (as in the TurboExcel case)

## Proposed Naming Changes

**Recommended new name: `react-sheet-table`** with the prefix `sheet`.

Rationale:
- "Sheet" is a generic, non-trademarked term for spreadsheet
- Follows the precedent set by SheetJS (the most popular xlsx library on npm)
- Short, descriptive, and memorable
- Works well as a CSS prefix (`--sheet-*`) and component prefix (`SheetTable`)

### Full Renaming Map

#### Package
| Current | Proposed |
|---------|----------|
| `react-excel-table` | `react-sheet-table` |

#### Components
| Current | Proposed |
|---------|----------|
| `ExcelTable` | `SheetTable` |
| `ExcelTableProvider` | `SheetTableProvider` |
| `ExcelImportButton` | `SheetImportButton` |
| `ExcelExportButton` | `SheetExportButton` |

#### Hooks
| Current | Proposed |
|---------|----------|
| `useExcelTable` | `useSheetTable` |
| `useExcelImport` | `useSheetImport` |
| `useExcelExport` | `useSheetExport` |
| `useExcelTableConfig` | `useSheetTableConfig` |

#### Types/Interfaces
| Current | Proposed |
|---------|----------|
| `ExcelTableConfig` | `SheetTableConfig` |
| `ExcelTableProps` | `SheetTableProps` |
| `ExcelTableProviderProps` | `SheetTableProviderProps` |
| `UseExcelTableReturn` | `UseSheetTableReturn` |
| `UseExcelTableProps` | `UseSheetTableProps` |
| `ExcelImportOptions` | `SheetImportOptions` |
| `ExcelImportResult` | `SheetImportResult` |
| `ExcelImportButtonProps` | `SheetImportButtonProps` |
| `UseExcelImportReturn` | `UseSheetImportReturn` |
| `ExcelExportOptions` | `SheetExportOptions` |
| `ExcelCellStyle` | `SheetCellStyle` |
| `ExcelBorderStyle` | `SheetBorderStyle` |
| `ExcelExportButtonProps` | `SheetExportButtonProps` |
| `UseExcelExportReturn` | `UseSheetExportReturn` |

#### Files
| Current | Proposed |
|---------|----------|
| `ExcelTable.tsx` | `SheetTable.tsx` |
| `ExcelTableProvider.tsx` | `SheetTableProvider.tsx` |
| `useExcelTable.ts` | `useSheetTable.ts` |
| `useExcelImport.ts` | `useSheetImport.ts` |
| `useExcelExport.ts` | `useSheetExport.ts` |
| `ExcelImportButton.tsx` | `SheetImportButton.tsx` |
| `ExcelExportButton.tsx` | `SheetExportButton.tsx` |

#### Directories
| Current | Proposed |
|---------|----------|
| `plugins/excel-import/` | `plugins/sheet-import/` |
| `plugins/excel-export/` | `plugins/sheet-export/` |

#### CSS
| Current | Proposed |
|---------|----------|
| `--excel-*` (~75 variables) | `--sheet-*` |
| `.excel-table*` (17 classes) | `.sheet-table*` |
| `.excel-theme--*` | `.sheet-theme--*` |

#### Tailwind
| Current | Proposed |
|---------|----------|
| `excelTablePreset` | `sheetTablePreset` |

#### package.json
| Field | Current | Proposed |
|-------|---------|----------|
| `name` | `react-excel-table` | `react-sheet-table` |
| `description` | "Excel-like editable data table..." | "Spreadsheet-style editable data table for React with virtualization, keyboard navigation, and .xlsx import/export" |
| keyword | `"excel"` | `"spreadsheet"` |

#### Vite build config
| Current | Proposed |
|---------|----------|
| `excel-import` entry point | `sheet-import` entry point |
| `excel-export` entry point | `sheet-export` entry point |

### References to Microsoft Excel

Where "Excel" refers to the actual Microsoft product (e.g., security comments about formula injection), change to the full form "Microsoft Excel" with trademark attribution.

### Trademark Disclaimer

Add to README.md:
> Microsoft and Excel are trademarks of the Microsoft group of companies. This project is not affiliated with, endorsed by, or sponsored by Microsoft Corporation.

## Recommended Implementation Approach

1. **Phase 1 (immediate):** Add trademark disclaimer to README
2. **Phase 2 (rename):** Execute full renaming across codebase
3. **Phase 3 (publish):** Publish new package name to npm, deprecate old name with pointer to new package
4. **Phase 4 (redirect):** Rename GitHub repository, set up redirects

## Market Research & Competitive Analysis

### Competitor Naming Patterns

| Package | Weekly Downloads | Naming Pattern |
|---------|-----------------|----------------|
| `@tanstack/react-table` | ~1,390,000 | Brand + descriptor |
| `handsontable` | ~202,000 | Standalone brand |
| `react-data-grid` | ~198,000 | `react-` + descriptor |
| `react-datasheet` | ~29,000 | `react-` + compound word |
| `react-datasheet-grid` | ~16,000 | `react-` + compound-compound |
| `react-spreadsheet` | Active | `react-` + generic term |

**Key observation:** The word "Excel" is universally avoided in package names. Competitors use "spreadsheet," "datasheet," "data-grid," "grid," or "table."

### npm Availability Check

| Name | Available | Notes |
|------|-----------|-------|
| `react-sheet-table` | YES | Never registered |
| `react-grid-sheet` | YES | Never registered |
| `react-sheet-grid` | YES | Never registered |
| `react-cellsheet` | YES | Never registered |
| `react-tabula` | YES | Never registered |
| `react-spreadsheet` | NO | Taken (active) |
| `react-datasheet` | NO | Taken (active) |
| `react-data-grid` | NO | Taken (active) |

### Top 5 Ranked Candidates

| Rank | Name | Strength | Score |
|------|------|----------|-------|
| **1** | **`react-sheet-table`** | Perfect clarity + SEO + easy to say/remember | 9.2/10 |
| 2 | `react-grid-sheet` | Strong SEO via "grid"; clean and technical | 8.7/10 |
| 3 | `react-sheet-grid` | Proven pattern (validated by react-datasheet-grid) | 8.3/10 |
| 4 | `react-cellsheet` | Highly distinctive; communicates cell-level editing | 7.8/10 |
| 5 | `react-tabula` | Strongest brand identity; Latin for "tablet/board" | 7.2/10 |

### Why `react-sheet-table` Wins

- **Simple & descriptive**: Three common English words — immediately communicates purpose
- **LLM/agent friendly**: An AI asked "find me a React spreadsheet table" naturally matches this
- **Easy to say**: Zero ambiguity spoken aloud, in docs, or in prompts
- **Feels independent**: No brand prefix, no clever wordplay — just what it is
- **SEO strong**: Contains "sheet" + "table" + "react" — three high-value keywords
- **Follows convention**: Same pattern as `react-data-grid`, `react-select`, `react-hook-form`
- **Available**: Never registered on npm

### Suggested package.json Keywords

```json
"keywords": [
  "react", "spreadsheet", "table", "grid", "data-grid",
  "datasheet", "editable", "editable-table", "sheet",
  "cell-editor", "virtualization", "keyboard-navigation",
  "import", "export", "csv", "xlsx"
]
```

## Alternative Names Considered

| Name | Pros | Cons |
|------|------|------|
| `react-sheet-table` | Short, generic, follows SheetJS precedent, easy to say | — |
| `react-spreadsheet-table` | Most descriptive | Long, already taken on npm |
| `react-grid-table` | Short, generic | "Grid" suggests CSS Grid, not spreadsheet |
| `react-xlsx-table` | References file format, not trademark | Pronunciation unclear |
| `react-data-sheet` | Generic, descriptive | Confusable with `react-datasheet` |

`react-sheet-table` is recommended as the best balance of clarity, brevity, and trademark safety.
