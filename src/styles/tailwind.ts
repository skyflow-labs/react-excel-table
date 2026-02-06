/**
 * Tailwind CSS preset for react-sheet-table
 *
 * Add this to your tailwind.config.js:
 *
 * @example
 * ```js
 * import { sheetTablePreset } from 'react-sheet-table/styles';
 *
 * export default {
 *   presets: [sheetTablePreset],
 *   // ... your config
 * }
 * ```
 */
export const sheetTablePreset = {
  theme: {
    extend: {
      colors: {
        'sheet-primary': 'var(--sheet-primary)',
        'sheet-primary-hover': 'var(--sheet-primary-hover)',
        'sheet-primary-light': 'var(--sheet-primary-light)',
        'sheet-danger': 'var(--sheet-danger)',
        'sheet-danger-hover': 'var(--sheet-danger-hover)',
        'sheet-warning': 'var(--sheet-warning)',
        'sheet-warning-hover': 'var(--sheet-warning-hover)',
        'sheet-success': 'var(--sheet-success)',
        'sheet-success-hover': 'var(--sheet-success-hover)',
        'sheet-info': 'var(--sheet-info)',
        'sheet-info-hover': 'var(--sheet-info-hover)',
        'sheet-cell-modified': 'var(--sheet-cell-modified-bg)',
        'sheet-cell-readonly': 'var(--sheet-cell-readonly-bg)',
      },
      fontFamily: {
        sheet: 'var(--sheet-font-family)',
      },
      fontSize: {
        'sheet-base': 'var(--sheet-font-size)',
        'sheet-sm': 'var(--sheet-font-size-sm)',
      },
      spacing: {
        'sheet-row': 'var(--sheet-row-height)',
        'sheet-header': 'var(--sheet-header-height)',
      },
      borderRadius: {
        sheet: 'var(--sheet-border-radius)',
      },
      boxShadow: {
        'sheet-sm': 'var(--sheet-shadow-sm)',
        sheet: 'var(--sheet-shadow)',
        'sheet-md': 'var(--sheet-shadow-md)',
        'sheet-lg': 'var(--sheet-shadow-lg)',
      },
      zIndex: {
        'sheet-dropdown': 'var(--sheet-z-dropdown)',
        'sheet-modal-backdrop': 'var(--sheet-z-modal-backdrop)',
        'sheet-modal': 'var(--sheet-z-modal)',
        'sheet-fab': 'var(--sheet-z-fab)',
        'sheet-fullscreen': 'var(--sheet-z-fullscreen)',
      },
      transitionDuration: {
        'sheet-fast': '150ms',
        'sheet-normal': '200ms',
        'sheet-slow': '300ms',
      },
    },
  },
};

export default sheetTablePreset;
