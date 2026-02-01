import { forwardRef, useState, useMemo, useRef, useEffect } from 'react';
import type { SelectOption } from '@/types';

export interface SelectCellProps {
  /** Current value */
  value: string;

  /** Available options */
  options: SelectOption[];

  /** Change handler - called when an option is selected */
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

  /** Show "Add new" option */
  showAddNew?: boolean;

  /** "Add new" click handler */
  onAddNew?: () => void;

  /** Label for "Add new" button */
  addNewLabel?: string;

  /** Allow deletion of options */
  allowDelete?: boolean;

  /** Delete option handler */
  onDeleteOption?: (option: SelectOption) => void;
}

/**
 * Select/dropdown cell component with search
 */
export const SelectCell = forwardRef<HTMLInputElement, SelectCellProps>(
  (
    {
      value: _value,
      options,
      onChange,
      onBlur,
      onKeyDown,
      isModified = false,
      placeholder = 'Search or select...',
      className = '',
      autoFocus = true,
      showAddNew = false,
      onAddNew,
      addNewLabel = "Can't find what you're looking for? Add new",
      allowDelete = false,
      onDeleteOption,
    },
    ref
  ) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter options based on search term
    const filteredOptions = useMemo(() => {
      if (!searchTerm.trim()) return options;
      return options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, [options, searchTerm]);

    // Handle click outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (!isOpen) return;

        const target = e.target as HTMLElement;
        const isInsideContainer = containerRef.current?.contains(target);

        if (!isInsideContainer) {
          setIsOpen(false);
          onBlur?.();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onBlur]);

    const handleSelect = (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
      setSearchTerm('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && filteredOptions.length > 0) {
        const firstEnabled = filteredOptions.find((opt) => !opt.disabled);
        if (firstEnabled) {
          e.preventDefault();
          handleSelect(firstEnabled.value);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        onBlur?.();
      }

      onKeyDown?.(e);
    };

    const handleDeleteClick = (option: SelectOption, e: React.MouseEvent) => {
      e.stopPropagation();
      onDeleteOption?.(option);
    };

    return (
      <div ref={containerRef} className="relative w-full">
        <input
          ref={ref}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
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

        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-10 mt-1 w-full border border-gray-300 bg-white rounded shadow-lg max-h-48 overflow-y-auto"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`
                    flex items-center justify-between px-2 py-1.5 group
                    ${opt.disabled
                      ? 'cursor-not-allowed text-gray-400 bg-gray-50'
                      : 'hover:bg-gray-100 cursor-pointer'
                    }
                  `}
                >
                  <div
                    className={`flex-1 ${opt.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (!opt.disabled) {
                        handleSelect(opt.value);
                      }
                    }}
                  >
                    {opt.label}
                  </div>

                  {allowDelete && onDeleteOption && (
                    <button
                      type="button"
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-100 rounded transition-opacity"
                      onMouseDown={(e) => handleDeleteClick(opt, e)}
                      title="Delete"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="px-2 py-2 text-gray-500 text-center">No options found</div>
            )}

            {showAddNew && onAddNew && (
              <>
                <div className="border-t my-1" />
                <div
                  className="px-2 py-1.5 text-blue-600 hover:bg-gray-100 cursor-pointer"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                    onAddNew();
                  }}
                >
                  {addNewLabel}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }
);

SelectCell.displayName = 'SelectCell';
