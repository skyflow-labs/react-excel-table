import { createContext, useContext, useMemo, type ReactNode } from 'react';

/**
 * Locale configuration for date/currency formatting
 */
export interface LocaleConfig {
  /** BCP 47 language tag (e.g., 'en-US', 'es-MX', 'de-DE') */
  locale: string;

  /** Timezone for date display (e.g., 'America/Mexico_City', 'UTC') */
  timezone: string;

  /** Currency code (ISO 4217) */
  currency: string;

  /** Date format pattern (date-fns compatible) */
  dateFormat: string;

  /** Date-time format pattern */
  dateTimeFormat: string;

  /** Decimal separator */
  decimalSeparator: '.' | ',';

  /** Thousands separator */
  thousandsSeparator: ',' | '.' | ' ' | '';
}

/**
 * Security options for data import
 */
export interface ImportSecurityConfig {
  /** Enable/disable file import feature entirely */
  enabled: boolean;

  /** Maximum file size in bytes (default: 10MB) */
  maxFileSize: number;

  /** Allowed file extensions */
  allowedExtensions: string[];

  /** Maximum number of rows to import */
  maxRows: number;

  /** Maximum number of columns to import */
  maxColumns: number;

  /** Strip HTML tags from imported text */
  stripHtml: boolean;

  /** Sanitize text to prevent XSS (removes script tags, event handlers, etc.) */
  sanitizeText: boolean;

  /** Block potential formula injection (cells starting with =, +, -, @) */
  blockFormulaInjection: boolean;

  /** Trim whitespace from all text values */
  trimWhitespace: boolean;

  /** Maximum string length per cell (truncate longer values) */
  maxCellLength: number;

  /** Custom validator function - return error message or null if valid */
  customValidator?: (value: unknown, columnId: string) => string | null;

  /** Custom sanitizer function */
  customSanitizer?: (value: unknown, columnId: string) => unknown;
}

/**
 * Export security configuration
 */
export interface ExportSecurityConfig {
  /** Enable/disable file export feature entirely */
  enabled: boolean;

  /** Maximum rows to export at once */
  maxRows: number;

  /** Columns to exclude from export (sensitive data) */
  excludeColumns: string[];

  /** Mask sensitive data patterns in export */
  maskPatterns?: Array<{
    pattern: RegExp;
    replacement: string;
  }>;
}

/**
 * Full configuration for ExcelTable
 */
export interface ExcelTableConfig {
  /** Locale and formatting settings */
  locale: LocaleConfig;

  /** Import security settings */
  importSecurity: ImportSecurityConfig;

  /** Export security settings */
  exportSecurity: ExportSecurityConfig;

  /** Table behavior settings */
  behavior: {
    /** Auto-save changes after this many ms of inactivity (0 = disabled) */
    autoSaveDelay: number;

    /** Confirm before discarding unsaved changes */
    confirmDiscard: boolean;

    /** Enable keyboard navigation */
    keyboardNavigation: boolean;

    /** Show row numbers */
    showRowNumbers: boolean;

    /** Enable virtualization for large datasets */
    virtualization: boolean;

    /** Virtual row height */
    rowHeight: number;
  };
}

/**
 * Default locale configuration (US English)
 */
export const DEFAULT_LOCALE: LocaleConfig = {
  locale: 'en-US',
  timezone: 'UTC',
  currency: 'USD',
  dateFormat: 'yyyy-MM-dd',
  dateTimeFormat: 'yyyy-MM-dd HH:mm:ss',
  decimalSeparator: '.',
  thousandsSeparator: ',',
};

/**
 * Default import security settings - restrictive by default
 */
export const DEFAULT_IMPORT_SECURITY: ImportSecurityConfig = {
  enabled: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedExtensions: ['.csv', '.xlsx', '.xls'],
  maxRows: 10000,
  maxColumns: 50,
  stripHtml: true,
  sanitizeText: true,
  blockFormulaInjection: true,
  trimWhitespace: true,
  maxCellLength: 10000,
};

/**
 * Default export security settings
 */
export const DEFAULT_EXPORT_SECURITY: ExportSecurityConfig = {
  enabled: true,
  maxRows: 100000,
  excludeColumns: [],
};

/**
 * Default behavior settings
 */
export const DEFAULT_BEHAVIOR: ExcelTableConfig['behavior'] = {
  autoSaveDelay: 0,
  confirmDiscard: true,
  keyboardNavigation: true,
  showRowNumbers: false,
  virtualization: true,
  rowHeight: 40,
};

/**
 * Full default configuration
 */
export const DEFAULT_CONFIG: ExcelTableConfig = {
  locale: DEFAULT_LOCALE,
  importSecurity: DEFAULT_IMPORT_SECURITY,
  exportSecurity: DEFAULT_EXPORT_SECURITY,
  behavior: DEFAULT_BEHAVIOR,
};

/**
 * Context for ExcelTable configuration
 */
const ExcelTableConfigContext = createContext<ExcelTableConfig>(DEFAULT_CONFIG);

/**
 * Props for ExcelTableProvider
 */
export interface ExcelTableProviderProps {
  children: ReactNode;

  /**
   * Locale configuration - merged with defaults
   */
  locale?: Partial<LocaleConfig>;

  /**
   * Import security configuration - merged with defaults
   */
  importSecurity?: Partial<ImportSecurityConfig>;

  /**
   * Export security configuration - merged with defaults
   */
  exportSecurity?: Partial<ExportSecurityConfig>;

  /**
   * Behavior configuration - merged with defaults
   */
  behavior?: Partial<ExcelTableConfig['behavior']>;

  /**
   * Full config override (if provided, partial configs are ignored)
   */
  config?: ExcelTableConfig;
}

/**
 * Provider component for ExcelTable configuration
 *
 * Wrap your application or a section of it with this provider to set
 * global configuration for all ExcelTable components within.
 *
 * @example
 * ```tsx
 * // Configure for Mexican locale with peso currency
 * <ExcelTableProvider
 *   locale={{
 *     locale: 'es-MX',
 *     timezone: 'America/Mexico_City',
 *     currency: 'MXN',
 *     dateFormat: 'dd/MM/yyyy',
 *   }}
 *   importSecurity={{
 *     maxRows: 5000,
 *     blockFormulaInjection: true,
 *   }}
 * >
 *   <App />
 * </ExcelTableProvider>
 * ```
 */
export function ExcelTableProvider({
  children,
  locale,
  importSecurity,
  exportSecurity,
  behavior,
  config,
}: ExcelTableProviderProps) {
  const mergedConfig = useMemo<ExcelTableConfig>(() => {
    if (config) {
      return config;
    }

    return {
      locale: { ...DEFAULT_LOCALE, ...locale },
      importSecurity: { ...DEFAULT_IMPORT_SECURITY, ...importSecurity },
      exportSecurity: { ...DEFAULT_EXPORT_SECURITY, ...exportSecurity },
      behavior: { ...DEFAULT_BEHAVIOR, ...behavior },
    };
  }, [config, locale, importSecurity, exportSecurity, behavior]);

  return (
    <ExcelTableConfigContext.Provider value={mergedConfig}>
      {children}
    </ExcelTableConfigContext.Provider>
  );
}

/**
 * Hook to access ExcelTable configuration
 *
 * @returns Current ExcelTable configuration
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const config = useExcelTableConfig();
 *   console.log(config.locale.currency); // 'MXN'
 * }
 * ```
 */
export function useExcelTableConfig(): ExcelTableConfig {
  return useContext(ExcelTableConfigContext);
}

/**
 * Hook to access just the locale configuration
 */
export function useLocaleConfig(): LocaleConfig {
  const config = useContext(ExcelTableConfigContext);
  return config.locale;
}

/**
 * Hook to access import security configuration
 */
export function useImportSecurityConfig(): ImportSecurityConfig {
  const config = useContext(ExcelTableConfigContext);
  return config.importSecurity;
}

/**
 * Hook to access export security configuration
 */
export function useExportSecurityConfig(): ExportSecurityConfig {
  const config = useContext(ExcelTableConfigContext);
  return config.exportSecurity;
}

/**
 * Preset configurations for common locales
 */
export const LOCALE_PRESETS: Record<string, Partial<LocaleConfig>> = {
  'en-US': {
    locale: 'en-US',
    timezone: 'America/New_York',
    currency: 'USD',
    dateFormat: 'MM/dd/yyyy',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  'es-MX': {
    locale: 'es-MX',
    timezone: 'America/Mexico_City',
    currency: 'MXN',
    dateFormat: 'dd/MM/yyyy',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  'es-ES': {
    locale: 'es-ES',
    timezone: 'Europe/Madrid',
    currency: 'EUR',
    dateFormat: 'dd/MM/yyyy',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  'de-DE': {
    locale: 'de-DE',
    timezone: 'Europe/Berlin',
    currency: 'EUR',
    dateFormat: 'dd.MM.yyyy',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  'fr-FR': {
    locale: 'fr-FR',
    timezone: 'Europe/Paris',
    currency: 'EUR',
    dateFormat: 'dd/MM/yyyy',
    decimalSeparator: ',',
    thousandsSeparator: ' ',
  },
  'pt-BR': {
    locale: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
    dateFormat: 'dd/MM/yyyy',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  'ja-JP': {
    locale: 'ja-JP',
    timezone: 'Asia/Tokyo',
    currency: 'JPY',
    dateFormat: 'yyyy/MM/dd',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
};
