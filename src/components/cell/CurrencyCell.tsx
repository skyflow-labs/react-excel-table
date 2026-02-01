import { forwardRef } from 'react';

export interface CurrencyCellProps {
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

  /** Currency symbol */
  currencySymbol?: string;

  /** Placeholder text */
  placeholder?: string;

  /** Custom class name */
  className?: string;

  /** Auto focus on mount */
  autoFocus?: boolean;
}

/**
 * Currency input cell component
 */
export const CurrencyCell = forwardRef<HTMLInputElement, CurrencyCellProps>(
  (
    {
      value,
      onChange,
      onBlur,
      onKeyDown,
      isModified = false,
      currencySymbol = '$',
      placeholder,
      className = '',
      autoFocus = true,
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Allow only numbers and decimal point
      const cleanValue = inputValue.replace(/[^0-9.]/g, '');

      // Prevent multiple decimal points
      const parts = cleanValue.split('.');
      if (parts.length > 2) {
        onChange(parts[0] + '.' + parts.slice(1).join(''));
        return;
      }

      // Limit decimal places to 2
      if (parts[1]?.length > 2) {
        onChange(parts[0] + '.' + parts[1].slice(0, 2));
        return;
      }

      onChange(cleanValue);
    };

    return (
      <div className="relative w-full">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
          {currencySymbol}
        </span>
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
            w-full h-[36px] pl-6 pr-2 border border-gray-300 rounded
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            text-right
            ${isModified ? 'bg-yellow-100' : 'bg-white'}
            ${className}
          `}
          style={{ margin: '2px 0' }}
        />
      </div>
    );
  }
);

CurrencyCell.displayName = 'CurrencyCell';
