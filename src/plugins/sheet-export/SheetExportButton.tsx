export interface SheetExportButtonProps {
  /** Export handler */
  onExport: () => Promise<void>;

  /** Whether export is in progress */
  isExporting?: boolean;

  /** Button label */
  label?: string;

  /** Custom class name */
  className?: string;

  /** Whether the button is disabled */
  disabled?: boolean;
}

/**
 * Button component for triggering spreadsheet export
 */
export function SheetExportButton({
  onExport,
  isExporting = false,
  label = 'Export',
  className = '',
  disabled = false,
}: SheetExportButtonProps) {
  const handleClick = async () => {
    try {
      await onExport();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isExporting}
      className={`
        inline-flex items-center gap-2 px-4 py-2
        text-sm font-medium
        text-white bg-blue-600 rounded-md
        hover:bg-blue-700 transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isExporting ? (
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
          Exporting...
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
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
