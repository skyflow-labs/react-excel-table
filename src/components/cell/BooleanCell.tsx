import { forwardRef } from 'react';

export interface BooleanCellProps {
  /** Current value */
  value: boolean;

  /** Change handler */
  onChange: (value: boolean) => void;

  /** Keyboard handler */
  onKeyDown?: (e: React.KeyboardEvent) => void;

  /** Whether the cell is modified */
  isModified?: boolean;

  /** Label for checked state */
  checkedLabel?: string;

  /** Label for unchecked state */
  uncheckedLabel?: string;

  /** Custom class name */
  className?: string;

  /** Use toggle switch style instead of checkbox */
  useSwitch?: boolean;

  /** Disabled state */
  disabled?: boolean;
}

/**
 * Boolean/checkbox cell component
 */
export const BooleanCell = forwardRef<HTMLInputElement, BooleanCellProps>(
  (
    {
      value,
      onChange,
      onKeyDown,
      isModified = false,
      checkedLabel = 'Yes',
      uncheckedLabel = 'No',
      className = '',
      useSwitch = false,
      disabled = false,
    },
    ref
  ) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!disabled) {
          onChange(!value);
        }
      }
      onKeyDown?.(e);
    };

    if (useSwitch) {
      return (
        <div
          className={`
            flex items-center justify-center h-[36px]
            ${className}
          `}
        >
          <button
            ref={ref as React.Ref<HTMLButtonElement>}
            type="button"
            role="switch"
            aria-checked={value}
            disabled={disabled}
            onClick={() => !disabled && onChange(!value)}
            onKeyDown={handleKeyDown}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full
              transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${value
                ? isModified
                  ? 'bg-yellow-500'
                  : 'bg-blue-600'
                : 'bg-gray-200'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${value ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
          <span className="ml-2 text-sm text-gray-600">
            {value ? checkedLabel : uncheckedLabel}
          </span>
        </div>
      );
    }

    return (
      <div
        className={`
          flex items-center justify-center h-[36px]
          ${className}
        `}
      >
        <label className="flex items-center cursor-pointer">
          <input
            ref={ref}
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={`
              w-4 h-4 rounded border-gray-300
              text-blue-600 focus:ring-blue-500 focus:ring-2
              ${isModified ? 'ring-2 ring-yellow-500' : ''}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          />
          <span className="ml-2 text-sm text-gray-600">
            {value ? checkedLabel : uncheckedLabel}
          </span>
        </label>
      </div>
    );
  }
);

BooleanCell.displayName = 'BooleanCell';
