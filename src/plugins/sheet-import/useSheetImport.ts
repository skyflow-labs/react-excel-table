import { useCallback, useState } from 'react';
import type { RowData, SheetImportOptions, SheetImportResult, ModifiedCells } from '@/types';
import { transformRow, autoDetectColumnMapping } from './parsers';
import { validateFile, sanitizeRow } from '@/utils/security';
import { DEFAULT_IMPORT_SECURITY, type ImportSecurityConfig } from '@/config';

/**
 * Extended options for secure import
 */
export interface SecureImportOptions<TData extends RowData> extends SheetImportOptions<TData> {
  /**
   * Security configuration for import
   * @default DEFAULT_IMPORT_SECURITY (all protections enabled)
   */
  security?: Partial<ImportSecurityConfig>;

  /**
   * Disable all security sanitization (NOT RECOMMENDED)
   * Only use this if you have your own sanitization pipeline
   * @default false
   */
  disableSanitization?: boolean;
}

/**
 * Return value from useSheetImport hook
 */
export interface UseSheetImportReturn<TData extends RowData> {
  /** Import a file */
  importFile: (file: File) => Promise<SheetImportResult<TData>>;

  /** Whether import is in progress */
  isImporting: boolean;

  /** Last import result */
  lastResult: SheetImportResult<TData> | null;

  /** Last error */
  error: Error | null;
}

/**
 * Hook for importing spreadsheet/CSV files
 *
 * @param options - Import configuration
 * @returns Import functions and state
 *
 * @example
 * ```tsx
 * const { importFile, isImporting } = useSheetImport<Transaction>({
 *   columnMapping: {
 *     'Date': 'created_at',
 *     'Amount': 'amount',
 *     'Description': 'description',
 *   },
 *   dateFormats: ['MM/dd/yyyy', 'yyyy-MM-dd'],
 * });
 *
 * const handleFileSelect = async (file: File) => {
 *   const result = await importFile(file);
 *   console.log(`Imported ${result.rows.length} rows`);
 * };
 * ```
 */
export function useSheetImport<TData extends RowData>(
  options: SecureImportOptions<TData> = {}
): UseSheetImportReturn<TData> {
  const [isImporting, setIsImporting] = useState(false);
  const [lastResult, setLastResult] = useState<SheetImportResult<TData> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const importFile = useCallback(
    async (file: File): Promise<SheetImportResult<TData>> => {
      const {
        columnMapping,
        dateFormats: _dateFormats,
        skipEmptyRows = true,
        maxRows,
        transformers,
        validator,
        onImportStart,
        onImportComplete,
        onImportError,
        security = {},
        disableSanitization = false,
      } = options;

      // Merge security config with defaults
      const securityConfig: ImportSecurityConfig = {
        ...DEFAULT_IMPORT_SECURITY,
        ...security,
      };

      setIsImporting(true);
      setError(null);
      onImportStart?.();

      try {
        // SECURITY: Validate file before processing
        if (!disableSanitization) {
          const fileValidation = validateFile(file, securityConfig);
          if (!fileValidation.valid) {
            const error = new Error(fileValidation.error || 'File validation failed');
            setError(error);
            setIsImporting(false);
            onImportError?.(error);
            throw error;
          }
        }

        // Dynamically import papaparse
        const Papa = await import('papaparse');

        return new Promise<SheetImportResult<TData>>((resolve, reject) => {
          Papa.default.parse(file, {
            header: true,
            skipEmptyLines: skipEmptyRows,
            complete: (results) => {
              try {
                const rows: TData[] = [];
                const errors: SheetImportResult<TData>['errors'] = [];
                const warnings: string[] = [];

                // Get headers from first row
                const csvHeaders = results.meta.fields || [];

                // Use provided mapping or auto-detect
                const mapping = columnMapping || autoDetectColumnMapping<TData>(
                  csvHeaders,
                  Object.keys(results.data[0] || {}) as Array<keyof TData>
                );

                // Process each row
                let processedCount = 0;
                for (const rawRow of results.data as Record<string, unknown>[]) {
                  // Check max rows limit
                  if (maxRows && processedCount >= maxRows) {
                    warnings.push(`Stopped at ${maxRows} rows (max limit)`);
                    break;
                  }

                  // Skip empty rows
                  if (skipEmptyRows) {
                    const hasContent = Object.values(rawRow).some(
                      (v) => v !== null && v !== undefined && v !== ''
                    );
                    if (!hasContent) continue;
                  }

                  // Transform row
                  let transformed = transformRow(rawRow, mapping, transformers);

                  // SECURITY: Sanitize row data to prevent XSS and formula injection
                  if (!disableSanitization) {
                    transformed = sanitizeRow(transformed, securityConfig);
                  }

                  // Generate ID if not present
                  if (!transformed.id) {
                    transformed.id = `import-${Date.now()}-${processedCount}`;
                  }

                  // Validate if validator provided
                  if (validator) {
                    const validationError = validator(transformed, processedCount);
                    if (validationError) {
                      errors.push({
                        index: processedCount,
                        error: validationError,
                        data: transformed,
                      });
                      processedCount++;
                      continue;
                    }
                  }

                  rows.push(transformed as TData);
                  processedCount++;
                }

                // Check for parsing errors
                if (results.errors.length > 0) {
                  results.errors.forEach((err) => {
                    warnings.push(`Row ${err.row}: ${err.message}`);
                  });
                }

                const result: SheetImportResult<TData> = {
                  rows,
                  errors,
                  warnings,
                };

                setLastResult(result);
                setIsImporting(false);
                onImportComplete?.(rows);
                resolve(result);
              } catch (err) {
                const error = err instanceof Error ? err : new Error('Import processing failed');
                setError(error);
                setIsImporting(false);
                onImportError?.(error);
                reject(error);
              }
            },
            error: (err) => {
              const error = new Error(`CSV parsing failed: ${err.message}`);
              setError(error);
              setIsImporting(false);
              onImportError?.(error);
              reject(error);
            },
          });
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Import failed');
        setError(error);
        setIsImporting(false);
        options.onImportError?.(error);
        throw error;
      }
    },
    [options]
  );

  return {
    importFile,
    isImporting,
    lastResult,
    error,
  };
}

/**
 * Create modified cells from imported rows
 */
export function createModifiedCellsFromImport<TData extends RowData>(
  rows: TData[],
  columns: Array<keyof TData>
): ModifiedCells {
  const modifiedCells: ModifiedCells = {};

  for (const row of rows) {
    modifiedCells[row.id] = {};
    for (const column of columns) {
      const value = row[column];
      if (value !== undefined) {
        modifiedCells[row.id][String(column)] = value as string | number | boolean | null;
      }
    }
  }

  return modifiedCells;
}
