import { useRef } from 'react';

export interface ExcelImportButtonProps {
  /** Handler when file is selected */
  onFileSelect: (file: File) => void;

  /** Whether import is in progress */
  isImporting?: boolean;

  /** Accepted file types */
  accept?: string;

  /** Button label */
  label?: string;

  /** Custom class name */
  className?: string;

  /** Whether the button is disabled */
  disabled?: boolean;
}

/**
 * Button component for triggering Excel/CSV import
 */
export function ExcelImportButton({
  onFileSelect,
  isImporting = false,
  accept = '.csv,.xlsx,.xls',
  label = 'Import',
  className = '',
  disabled = false,
}: ExcelImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      // Reset input to allow selecting same file again
      e.target.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isImporting}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isImporting}
        className={`
          inline-flex items-center gap-2 px-4 py-2
          text-sm font-medium
          text-white bg-green-600 rounded-md
          hover:bg-green-700 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {isImporting ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Importing...
          </>
        ) : (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {label}
          </>
        )}
      </button>
    </>
  );
}
