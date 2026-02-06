import type { ImportSecurityConfig } from '@/config';

/**
 * Result of file validation
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a file against security configuration
 */
export function validateFile(
  file: File,
  config: ImportSecurityConfig
): FileValidationResult {
  // Check if import is enabled
  if (!config.enabled) {
    return { valid: false, error: 'File import is disabled' };
  }

  // Check file size
  if (file.size > config.maxFileSize) {
    const maxMB = (config.maxFileSize / (1024 * 1024)).toFixed(1);
    const fileMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${fileMB}MB) exceeds maximum allowed (${maxMB}MB)`,
    };
  }

  // Check file extension
  const extension = getFileExtension(file.name);
  if (!config.allowedExtensions.includes(extension.toLowerCase())) {
    return {
      valid: false,
      error: `File type "${extension}" is not allowed. Allowed types: ${config.allowedExtensions.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Get file extension including the dot
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot);
}

/**
 * Dangerous patterns for formula injection
 * These patterns at the start of a cell can trigger code execution in spreadsheet apps
 */
const FORMULA_INJECTION_PATTERNS = [
  /^=/,      // Excel/Sheets formula
  /^\+/,     // Can be interpreted as formula
  /^-(?![0-9.]+$)/, // Formula prefix, but not pure negative numbers like -100 or -.5
  /^@/,      // DDE commands in Excel
  /^\|/,     // Pipe command execution
  /^%0A/,    // URL-encoded newline (can break out of cells)
];

/**
 * HTML tag patterns to strip
 */
const HTML_TAG_PATTERN = /<[^>]*>/g;

/**
 * Dangerous HTML/XSS patterns
 * Uses [\s\S] to handle whitespace/newline obfuscation in event handlers
 */
const XSS_PATTERNS = [
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:/gi,
  // eslint-disable-next-line no-control-regex
  /on[\s\u0000]*\w+[\s\u0000]*=/gi, // Event handlers like onclick=, on\nclick=, on\0click=
  /<script/gi,
  /<\/script/gi,
  /<iframe/gi,
  /<embed/gi,
  /<object/gi,
  /<form/gi,
  /<input/gi,
  /<meta/gi,
  /<link/gi,
  /<style/gi,
];

/**
 * Sanitize a single cell value
 */
export function sanitizeCellValue(
  value: unknown,
  config: ImportSecurityConfig,
  columnId?: string
): unknown {
  // Apply custom sanitizer first if provided
  if (config.customSanitizer) {
    value = config.customSanitizer(value, columnId || '');
  }

  // Handle null/undefined
  if (value === null || value === undefined) {
    return value;
  }

  // Handle numbers (no sanitization needed)
  if (typeof value === 'number') {
    return value;
  }

  // Handle booleans
  if (typeof value === 'boolean') {
    return value;
  }

  // Handle dates
  if (value instanceof Date) {
    return value;
  }

  // Handle strings - apply all sanitization
  if (typeof value === 'string') {
    let sanitized = value;

    // Remove null bytes before all checks (prevents bypass via \0 insertion)
    sanitized = sanitized.replace(/\0/g, '');

    // Trim whitespace
    if (config.trimWhitespace) {
      sanitized = sanitized.trim();
    }

    // Strip HTML tags iteratively until no tags remain
    // (handles nested tricks like <scr<script>ipt>)
    if (config.stripHtml) {
      let prev: string;
      do {
        prev = sanitized;
        sanitized = sanitized.replace(HTML_TAG_PATTERN, '');
      } while (sanitized !== prev);
    }

    // Sanitize for XSS iteratively (handles nested bypass attempts like oonnclick==click=)
    if (config.sanitizeText) {
      let prev: string;
      do {
        prev = sanitized;
        for (const pattern of XSS_PATTERNS) {
          sanitized = sanitized.replace(pattern, '');
        }
      } while (sanitized !== prev);
    }

    // Block formula injection
    if (config.blockFormulaInjection) {
      for (const pattern of FORMULA_INJECTION_PATTERNS) {
        if (pattern.test(sanitized)) {
          // Prefix with single quote to neutralize formula
          sanitized = "'" + sanitized;
          break;
        }
      }
    }

    // Truncate if too long
    if (sanitized.length > config.maxCellLength) {
      sanitized = sanitized.slice(0, config.maxCellLength);
    }

    return sanitized;
  }

  // Convert objects to string and sanitize
  if (typeof value === 'object') {
    try {
      const stringified = JSON.stringify(value);
      return sanitizeCellValue(stringified, config, columnId);
    } catch {
      return null;
    }
  }

  // Default: convert to string
  return String(value);
}

/**
 * Validate a single cell value
 * Returns error message if invalid, null if valid
 */
export function validateCellValue(
  value: unknown,
  config: ImportSecurityConfig,
  columnId?: string
): string | null {
  // Apply custom validator if provided
  if (config.customValidator) {
    const error = config.customValidator(value, columnId || '');
    if (error) return error;
  }

  // Check string length before sanitization
  if (typeof value === 'string' && value.length > config.maxCellLength * 2) {
    return `Value exceeds maximum length of ${config.maxCellLength} characters`;
  }

  return null;
}

/**
 * Sanitize an entire row of data
 */
export function sanitizeRow<T extends Record<string, unknown>>(
  row: T,
  config: ImportSecurityConfig
): T {
  const sanitized = Object.create(null) as Record<string, unknown>;

  for (const [key, value] of Object.entries(row)) {
    // Skip prototype pollution vectors
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    sanitized[key] = sanitizeCellValue(value, config, key);
  }

  return sanitized as T;
}

/**
 * Validate and sanitize imported data
 * Returns sanitized data and any validation errors
 */
export interface SanitizeDataResult<T> {
  data: T[];
  errors: Array<{
    row: number;
    column: string;
    error: string;
  }>;
  warnings: string[];
  stats: {
    totalRows: number;
    sanitizedRows: number;
    skippedRows: number;
    truncatedValues: number;
    formulasBlocked: number;
    htmlStripped: number;
  };
}

export function sanitizeImportData<T extends Record<string, unknown>>(
  data: T[],
  config: ImportSecurityConfig
): SanitizeDataResult<T> {
  const result: SanitizeDataResult<T> = {
    data: [],
    errors: [],
    warnings: [],
    stats: {
      totalRows: data.length,
      sanitizedRows: 0,
      skippedRows: 0,
      truncatedValues: 0,
      formulasBlocked: 0,
      htmlStripped: 0,
    },
  };

  // Check row limit
  if (data.length > config.maxRows) {
    result.warnings.push(
      `Data truncated: ${data.length} rows found, maximum ${config.maxRows} allowed`
    );
    data = data.slice(0, config.maxRows);
  }

  // Check column limit
  if (data.length > 0) {
    const columnCount = Object.keys(data[0]).length;
    if (columnCount > config.maxColumns) {
      result.warnings.push(
        `Column limit: ${columnCount} columns found, maximum ${config.maxColumns} allowed`
      );
    }
  }

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const sanitizedRow: Record<string, unknown> = {};
    let hasError = false;

    for (const [key, value] of Object.entries(row)) {
      // Validate first
      const validationError = validateCellValue(value, config, key);
      if (validationError) {
        result.errors.push({
          row: i,
          column: key,
          error: validationError,
        });
        hasError = true;
        continue;
      }

      // Track statistics before sanitization
      const originalValue = value;

      // Sanitize
      const sanitized = sanitizeCellValue(value, config, key);

      // Track what changed
      if (typeof originalValue === 'string' && typeof sanitized === 'string') {
        if (sanitized.startsWith("'") && !originalValue.startsWith("'")) {
          result.stats.formulasBlocked++;
        }
        if (originalValue.length !== sanitized.length) {
          if (/<[^>]*>/.test(originalValue)) {
            result.stats.htmlStripped++;
          }
          if (sanitized.length === config.maxCellLength) {
            result.stats.truncatedValues++;
          }
        }
      }

      sanitizedRow[key] = sanitized;
    }

    if (!hasError) {
      result.data.push(sanitizedRow as T);
      result.stats.sanitizedRows++;
    } else {
      result.stats.skippedRows++;
    }
  }

  return result;
}

/**
 * Check if a filename is suspicious (potential path traversal, etc.)
 */
export function isSuspiciousFilename(filename: string): boolean {
  const suspicious = [
    /\.\./,      // Path traversal
    /^\/|^\\|^[A-Z]:/i, // Absolute paths
    // eslint-disable-next-line no-control-regex
    /[\x00-\x1f]/,  // Control characters
    /[<>:"|?*]/,    // Invalid filename chars
    /%[0-9a-f]{2}/i, // URL encoding
  ];

  return suspicious.some((pattern) => pattern.test(filename));
}
