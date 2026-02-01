export interface TableControlsProps {
  /** Number of edited cells */
  editedCellsCount: number;

  /** Discard changes handler */
  onDiscard: () => void;

  /** Save changes handler */
  onSave: () => Promise<void>;

  /** Whether save is in progress */
  isSaving: boolean;

  /** Custom class name */
  className?: string;
}

/**
 * Table controls component showing modified cell count and save/discard buttons
 */
export function TableControls({
  editedCellsCount,
  onDiscard,
  onSave,
  isSaving,
  className = '',
}: TableControlsProps) {
  if (editedCellsCount === 0) {
    return null;
  }

  return (
    <div
      className={`
        flex items-center justify-between px-4 py-2
        bg-yellow-50 border border-yellow-200 rounded-lg
        ${className}
      `}
    >
      <span className="text-sm text-yellow-800">
        {editedCellsCount} unsaved change{editedCellsCount !== 1 ? 's' : ''}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDiscard}
          disabled={isSaving}
          className="
            px-3 py-1.5 text-sm
            text-gray-600 hover:text-gray-800
            border border-gray-300 rounded-md
            hover:bg-gray-50 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          Discard
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="
            px-3 py-1.5 text-sm
            text-white bg-blue-600 rounded-md
            hover:bg-blue-700 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center gap-2
          "
        >
          {isSaving ? (
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
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  );
}
