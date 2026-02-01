import { forwardRef } from 'react';

export interface NumberCellProps {
  /** Current value */
  value: string | number;

  /** Change handler */
  onChange: (value: string) => void;

  /** Blur handler */
  onBlur?: () => void;

  /** Keyboard handler */
  onKeyDown?: (e: React.KeyboardEvent) => void;

  /** Whether the cell is modified */
  isModified?: boolean;

  /** Allow decimal values */
  allowDecimals?: boolean;

  /** Placeholder text */
  placeholder?: string;

  /** Custom class name */
  className?: string;

  /** Auto focus on mount */
  autoFocus?: boolean;
}

/**
 * Numeric input cell component
 */
export const NumberCell = forwardRef<HTMLInputElement, NumberCellProps>(
  (
    {
      value,
      onChange,
      onBlur,
      onKeyDown,
      isModified = false,
      allowDecimals = true,
      placeholder,
      className = '',
      autoFocus = true,
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Allow only numbers and optionally decimals
      const pattern = allowDecimals ? /[^0-9.]/g : /[^0-9]/g;
      const cleanValue = inputValue.replace(pattern, '');

      // Prevent multiple decimal points
      if (allowDecimals) {
        const parts = cleanValue.split('.');
        if (parts.length > 2) {
          onChange(parts[0] + '.' + parts.slice(1).join(''));
          return;
        }
      }

      onChange(cleanValue);
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={value ?? ''}
        onChange={handleChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`
          w-full h-[36px] px-2 border border-gray-300 rounded
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          text-right
          ${isModified ? 'bg-yellow-100' : 'bg-white'}
          ${className}
        `}
        style={{ margin: '2px 0' }}
      />
    );
  }
);

NumberCell.displayName = 'NumberCell';
