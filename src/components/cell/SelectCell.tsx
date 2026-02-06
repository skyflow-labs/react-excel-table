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
 * Select/dropdown cell component with search and keyboard navigation
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
    const [activeIndex, setActiveIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter options based on search term
    const filteredOptions = useMemo(() => {
      if (!searchTerm.trim()) return options;
      return options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, [options, searchTerm]);

    // Reset active index when filtered options change
    useEffect(() => {
      setActiveIndex(-1);
    }, [filteredOptions.length]);

    // Scroll active option into view
    useEffect(() => {
      if (activeIndex < 0 || !dropdownRef.current) return;
      const items = dropdownRef.current.querySelectorAll('[data-option-index]');
      items[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

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
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          setIsOpen(true);
          return;
        }
      }

      const enabledOptions = filteredOptions.filter((opt) => !opt.disabled);

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          if (enabledOptions.length === 0) break;
          const nextIdx = activeIndex < filteredOptions.length - 1 ? activeIndex + 1 : 0;
          let i = nextIdx;
          for (let n = 0; n < filteredOptions.length; n++) {
            const idx = (nextIdx + n) % filteredOptions.length;
            if (!filteredOptions[idx].disabled) {
              i = idx;
              break;
            }
          }
          setActiveIndex(i);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          if (enabledOptions.length === 0) break;
          const prevIdx = activeIndex > 0 ? activeIndex - 1 : filteredOptions.length - 1;
          let i = prevIdx;
          for (let n = 0; n < filteredOptions.length; n++) {
            const idx = (prevIdx - n + filteredOptions.length) % filteredOptions.length;
            if (!filteredOptions[idx].disabled) {
              i = idx;
              break;
            }
          }
          setActiveIndex(i);
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
            const opt = filteredOptions[activeIndex];
            if (!opt.disabled) {
              handleSelect(opt.value);
              return;
            }
          }
          if (searchTerm.trim() && enabledOptions.length > 0) {
            handleSelect(enabledOptions[0].value);
            return;
          }
          // M7: Empty search + no highlight → close without changing value
          if (!searchTerm.trim()) {
            setIsOpen(false);
            onBlur?.();
            return;
          }
          break;
        }
        case 'Escape':
          setIsOpen(false);
          onBlur?.();
          break;
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
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `select-option-${activeIndex}` : undefined}
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
            role="listbox"
            className="absolute z-10 mt-1 w-full border border-gray-300 bg-white rounded shadow-lg max-h-48 overflow-y-auto"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => (
                <div
                  key={opt.value}
                  id={`select-option-${index}`}
                  data-option-index={index}
                  role="option"
                  aria-selected={index === activeIndex}
                  aria-disabled={opt.disabled || undefined}
                  className={`
                    flex items-center justify-between px-2 py-1.5 group
                    ${opt.disabled
                      ? 'cursor-not-allowed text-gray-400 bg-gray-50'
                      : index === activeIndex
                        ? 'bg-blue-100 cursor-pointer'
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
                    onMouseEnter={() => {
                      if (!opt.disabled) setActiveIndex(index);
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
                      aria-label={`Delete ${opt.label}`}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
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
