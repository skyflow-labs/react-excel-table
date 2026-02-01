import { forwardRef } from 'react';

export interface TextCellProps {
  /** Current value */
  value: string;

  /** Change handler */
  onChange: (value: string) => void;

  /** Blur handler */
  onBlur?: () => void;

  /** Keyboard handler */
  onKeyDown?: (e: React.KeyboardEvent) => void;

  /** Whether the cell is modified */
  isModified?: boolean;

  /** Placeholder text */
  placeholder?: string;

  /** Custom class name */
  className?: string;

  /** Auto focus on mount */
  autoFocus?: boolean;
}

/**
 * Text input cell component
 */
export const TextCell = forwardRef<HTMLInputElement, TextCellProps>(
  (
    {
      value,
      onChange,
      onBlur,
      onKeyDown,
      isModified = false,
      placeholder,
      className = '',
      autoFocus = true,
    },
    ref
  ) => {
    return (
      <input
        ref={ref}
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
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

TextCell.displayName = 'TextCell';
