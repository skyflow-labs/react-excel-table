import type { CellDataType, CellValue } from '@/types';
import { formatDateValue } from '@/utils/formatters/date';
import { formatCurrency } from '@/utils/formatters/currency';

export interface ReadOnlyCellProps {
  /** Cell value to display */
  value: CellValue;

  /** Data type of the cell */
  dataType: CellDataType;

  /** Date format (for date columns) */
  dateFormat?: string;

  /** Custom class name */
  className?: string;
}

/**
 * Read-only cell renderer based on data type
 */
export function ReadOnlyCell({
  value,
  dataType,
  dateFormat,
  className = 'px-2 py-2 w-full h-full',
}: ReadOnlyCellProps) {
  const renderValue = () => {
    switch (dataType) {
      case 'date':
        if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
          return formatDateValue(value, dateFormat ?? 'dd/MM/yyyy HH:mm:ss');
        }
        return '';

      case 'currency':
        return formatCurrency(value as number);

      case 'boolean':
        return value ? 'Yes' : 'No';

      case 'number':
        return value != null ? Number(value).toLocaleString() : '';

      default:
        return String(value ?? '');
    }
  };

  return <div className={`sheet-table-cell--readonly ${className}`}>{renderValue()}</div>;
}
