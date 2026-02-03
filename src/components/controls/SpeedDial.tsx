import { useState } from 'react';

export interface SpeedDialProps {
  /** Add row handler */
  onAdd?: () => void;

  /** Whether delete mode is active (controlled by parent) */
  deleteMode?: boolean;

  /** Toggle delete mode handler */
  onDeleteModeToggle?: (active: boolean) => void;

  /** Whether fullscreen is active */
  isFullscreen?: boolean;

  /** Toggle fullscreen handler */
  onToggleFullscreen?: () => void;

  /** Custom class name */
  className?: string;
}

/**
 * Speed dial FAB component with table actions
 */
export function SpeedDial({
  onAdd,
  deleteMode = false,
  onDeleteModeToggle,
  isFullscreen,
  onToggleFullscreen,
  className = '',
}: SpeedDialProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDeleteModeToggle = () => {
    onDeleteModeToggle?.(!deleteMode);
    setIsOpen(false);
  };

  const actions = [
    onAdd && {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
      label: 'Add Row',
      onClick: () => {
        onAdd();
        setIsOpen(false);
      },
      color: 'bg-green-600 hover:bg-green-700',
    },
    onDeleteModeToggle && {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      ),
      label: deleteMode ? 'Exit Delete Mode' : 'Delete Mode',
      onClick: handleDeleteModeToggle,
      color: deleteMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700',
    },
    onToggleFullscreen && {
      icon: isFullscreen ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      ),
      label: isFullscreen ? 'Exit Fullscreen' : 'Fullscreen',
      onClick: () => {
        onToggleFullscreen();
        setIsOpen(false);
      },
      color: 'bg-blue-600 hover:bg-blue-700',
    },
  ].filter(Boolean) as Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    color: string;
  }>;

  return (
    <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
      {/* Action buttons */}
      <div
        className={`
          flex flex-col-reverse items-center gap-3 mb-3
          transition-all duration-200
          ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
      >
        {actions.map((action, index) => (
          <button
            key={index}
            type="button"
            onClick={action.onClick}
            className={`
              flex items-center gap-2 px-4 py-2
              text-white rounded-full shadow-lg
              transition-colors
              ${action.color}
            `}
            title={action.label}
          >
            {action.icon}
            <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Main FAB button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-center
          w-14 h-14 rounded-full shadow-lg
          text-white transition-all duration-200
          ${isOpen
            ? 'bg-gray-600 hover:bg-gray-700 rotate-45'
            : 'bg-[var(--excel-primary,#30867B)] hover:bg-[var(--excel-primary-hover,#2D9084)]'
          }
        `}
        title={isOpen ? 'Close menu' : 'Open menu'}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}
