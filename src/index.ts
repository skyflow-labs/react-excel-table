// Main component
export { ExcelTable } from '@/components/table/ExcelTable';

// Configuration Provider
export {
  ExcelTableProvider,
  useExcelTableConfig,
  useLocaleConfig,
  useImportSecurityConfig,
  useExportSecurityConfig,
  DEFAULT_CONFIG,
  DEFAULT_LOCALE,
  DEFAULT_IMPORT_SECURITY,
  DEFAULT_EXPORT_SECURITY,
  DEFAULT_BEHAVIOR,
  LOCALE_PRESETS,
} from '@/config';
export type {
  ExcelTableConfig,
  LocaleConfig,
  ImportSecurityConfig,
  ExportSecurityConfig,
  ExcelTableProviderProps,
} from '@/config';

// Table components
export {
  TableHeader,
  TableBody,
  buildColumn,
  buildColumns,
  getColumns,
} from '@/components/table';
export type {
  TableHeaderProps,
  TableBodyProps,
  BuildColumnOptions,
  BuildColumnsProps,
} from '@/components/table';

// Cell components
export {
  EditableCell,
  ReadOnlyCell,
  TextCell,
  NumberCell,
  CurrencyCell,
  DateCell,
  SelectCell,
  BooleanCell,
} from '@/components/cell';
export type {
  EditableCellProps,
  ReadOnlyCellProps,
  TextCellProps,
  NumberCellProps,
  CurrencyCellProps,
  DateCellProps,
  SelectCellProps,
  BooleanCellProps,
} from '@/components/cell';

// Control components
export { TableControls, SpeedDial, DeleteModal } from '@/components/controls';
export type {
  TableControlsProps,
  SpeedDialProps,
  DeleteModalProps,
} from '@/components/controls';

// Hooks
export {
  useExcelTable,
  useAutosize,
  useBasicAutosize,
  usePreciseAutosize,
  useKeyboardNavigation,
  useCellNavigation,
  useCellEdit,
  useSimpleCellEdit,
  useTableActions,
} from '@/hooks';
export type {
  UseAutosizeOptions,
  UseAutosizeReturn,
  UseKeyboardNavigationProps,
  UseCellNavigationProps,
  NavigationDirection,
  CellEditConfig,
  UseCellEditProps,
  UseTableActionsProps,
  UseTableActionsReturn,
} from '@/hooks';

// Utilities
export {
  // Formatters
  formatDateValue,
  getCurrentTimestamp,
  dateInputToISO,
  isoToDateInput,
  parseDateString,
  toTimezone,
  isValidDate,
  formatCurrency,
  parseCurrency,
  createCurrencyFormatter,
  currencyFormatters,
  formatNumber,
  parseNumber,
  formatPercent,
  formatBytes,
  createNumberFormatter,
  clamp,
  // Autosize
  measureTextWidth,
  calculateOptimalColumnWidth,
  calculateOptimalColumnWidthPrecise,
  calculateAutosizeWidths,
  getColumnDisplayWidth,
} from '@/utils';
export type {
  DateFormatConfig,
  CurrencyFormatConfig,
  NumberFormatConfig,
  AutosizeConfig,
} from '@/utils';

// Types
export type {
  // Column types
  CellDataType,
  SelectOption,
  ColumnMeta,
  ColumnConfig,
  RowData,
  ColumnValue,
  // Cell types
  CellValue,
  ModifiedCells,
  CellState,
  CellPosition,
  CellRef,
  CellEditPayload,
  CellValidationResult,
  CellValidator,
  // Table types
  TableState,
  TableActions,
  UseExcelTableReturn,
  ExcelTableProps,
  UseExcelTableProps,
  TableContextValue,
  Table,
  Row,
  Column,
  SortingState,
  ColumnFiltersState,
  // Event types
  OnCellEdit,
  SaveResult,
  OnSave,
  DeleteResult,
  OnDelete,
  OnRowAdd,
  OnDataChange,
  OnModifiedCellsChange,
  KeyboardNavigationEvent,
  OnKeyboardNavigate,
  CellFocusEvent,
  OnCellFocus,
  OnCellBlur,
  RowSelectionEvent,
  OnRowSelectionChange,
  OnFullscreenChange,
  // Plugin types
  ExcelImportOptions,
  ExcelImportResult,
  ExcelExportOptions,
  ExcelCellStyle,
  ExcelBorderStyle,
  NotificationAdapter,
} from '@/types';

export { CellDataTypeEnum, consoleNotificationAdapter } from '@/types';

// Security utilities
export {
  validateFile,
  sanitizeCellValue,
  validateCellValue,
  sanitizeRow,
  sanitizeImportData,
  isSuspiciousFilename,
} from '@/utils/security';
export type {
  FileValidationResult,
  SanitizeDataResult,
} from '@/utils/security';

// Styles
export { excelTablePreset } from '@/styles/tailwind';
