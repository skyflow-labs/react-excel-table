/**
 * Tailwind CSS preset for skyflowlabs-excel
 *
 * Add this to your tailwind.config.js:
 *
 * @example
 * ```js
 * import { excelTablePreset } from 'skyflowlabs-excel/styles';
 *
 * export default {
 *   presets: [excelTablePreset],
 *   // ... your config
 * }
 * ```
 */
export const excelTablePreset = {
  theme: {
    extend: {
      colors: {
        'excel-primary': 'var(--excel-primary)',
        'excel-primary-hover': 'var(--excel-primary-hover)',
        'excel-primary-light': 'var(--excel-primary-light)',
        'excel-danger': 'var(--excel-danger)',
        'excel-danger-hover': 'var(--excel-danger-hover)',
        'excel-warning': 'var(--excel-warning)',
        'excel-warning-hover': 'var(--excel-warning-hover)',
        'excel-success': 'var(--excel-success)',
        'excel-success-hover': 'var(--excel-success-hover)',
        'excel-info': 'var(--excel-info)',
        'excel-info-hover': 'var(--excel-info-hover)',
        'excel-cell-modified': 'var(--excel-cell-modified-bg)',
        'excel-cell-readonly': 'var(--excel-cell-readonly-bg)',
      },
      fontFamily: {
        excel: 'var(--excel-font-family)',
      },
      fontSize: {
        'excel-base': 'var(--excel-font-size)',
        'excel-sm': 'var(--excel-font-size-sm)',
      },
      spacing: {
        'excel-row': 'var(--excel-row-height)',
        'excel-header': 'var(--excel-header-height)',
      },
      borderRadius: {
        excel: 'var(--excel-border-radius)',
      },
      boxShadow: {
        'excel-sm': 'var(--excel-shadow-sm)',
        excel: 'var(--excel-shadow)',
        'excel-md': 'var(--excel-shadow-md)',
        'excel-lg': 'var(--excel-shadow-lg)',
      },
      zIndex: {
        'excel-dropdown': 'var(--excel-z-dropdown)',
        'excel-modal-backdrop': 'var(--excel-z-modal-backdrop)',
        'excel-modal': 'var(--excel-z-modal)',
        'excel-fab': 'var(--excel-z-fab)',
        'excel-fullscreen': 'var(--excel-z-fullscreen)',
      },
      transitionDuration: {
        'excel-fast': '150ms',
        'excel-normal': '200ms',
        'excel-slow': '300ms',
      },
    },
  },
};

export default excelTablePreset;
