import { useEffect, useRef, useCallback } from 'react';

export interface DeleteModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Confirm delete handler */
  onConfirm: () => Promise<void>;

  /** Whether deletion is in progress */
  isSaving: boolean;

  /** Number of items to delete */
  count: number;

  /** Custom title */
  title?: string;

  /** Custom description */
  description?: string;

  /** Error message to display */
  error?: string;
}

/**
 * Delete confirmation modal with proper dialog semantics
 */
export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isSaving,
  count,
  title = 'Delete Rows',
  description,
  error,
}: DeleteModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = 'delete-modal-title';
  const descId = 'delete-modal-desc';

  // Auto-focus Cancel button on open
  useEffect(() => {
    if (isOpen) {
      // Wait a tick for the DOM to render
      requestAnimationFrame(() => cancelRef.current?.focus());
    }
  }, [isOpen]);

  // Handle Escape key to close (but not during saving)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        e.stopPropagation();
        onClose();
      }
    },
    [isSaving, onClose]
  );

  if (!isOpen) return null;

  const defaultDescription = `Are you sure you want to delete ${count} row${count !== 1 ? 's' : ''}? This action cannot be undone.`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop — disabled during saving to prevent inconsistent state */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={isSaving ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2 id={titleId} className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>

        <p id={descId} className="text-gray-600 mb-4">
          {description || defaultDescription}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="
              px-4 py-2 text-sm font-medium
              text-gray-700 bg-white border border-gray-300 rounded-md
              hover:bg-gray-50 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="
              px-4 py-2 text-sm font-medium
              text-white bg-red-600 rounded-md
              hover:bg-red-700 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-2
            "
          >
            {isSaving ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  aria-hidden="true"
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
                Deleting...
              </>
            ) : (
              `Delete ${count} row${count !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
