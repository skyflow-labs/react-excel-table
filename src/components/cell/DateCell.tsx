import { forwardRef } from 'react';

export interface DateCellProps {
  /** Current value (ISO string or yyyy-MM-dd) */
  value: string;

  /** Change handler */
  onChange: (value: string) => void;

  /** Blur handler */
  onBlur?: () => void;

  /** Keyboard handler */
  onKeyDown?: (e: React.KeyboardEvent) => void;

  /** Whether the cell is modified */
  isModified?: boolean;

  /** Minimum date */
  min?: string;

  /** Maximum date */
  max?: string;

  /** Custom class name */
  className?: string;

  /** Auto focus on mount */
  autoFocus?: boolean;
}

/**
 * Date input cell component
 */
export const DateCell = forwardRef<HTMLInputElement, DateCellProps>(
  (
    {
      value,
      onChange,
      onBlur,
      onKeyDown,
      isModified = false,
      min,
      max,
      className = '',
      autoFocus = true,
    },
    ref
  ) => {
    return (
      <input
        ref={ref}
        type="date"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        min={min}
        max={max}
        autoFocus={autoFocus}
        className={`
          w-full h-[36px] px-2 border border-gray-300 rounded
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${isModified ? 'bg-yellow-100' : 'bg-white'}
          ${className}
        `}
        style={{ margin: '2px 0' }}
      />
    );
  }
);

DateCell.displayName = 'DateCell';
