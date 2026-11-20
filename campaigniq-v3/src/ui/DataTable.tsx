import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  render: (row: T) => ReactNode;
}

/** Light grey header, right-aligned numbers, amber-tinted total row, tinted selected row. */
export function DataTable<T>({ columns, rows, rowKey, total, selected, onRowClick }: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  total?: Record<string, ReactNode>;
  selected?: string | null;
  onRowClick?: (row: T) => void;
}) {
  const cls = (a?: string) => (a === 'right' ? 'r' : a === 'center' ? 'c' : undefined);
  return (
    <table className="tbl">
      <thead>
        <tr>{columns.map((c) => <th key={c.key} className={cls(c.align)} style={c.width ? { width: c.width } : undefined}>{c.header}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const k = rowKey(r);
          return (
            <tr key={k} className={[onRowClick ? 'click' : '', selected === k ? 'sel' : ''].join(' ').trim() || undefined} onClick={onRowClick ? () => onRowClick(r) : undefined}>
              {columns.map((c) => <td key={c.key} className={cls(c.align)}>{c.render(r)}</td>)}
            </tr>
          );
        })}
        {total && (
          <tr className="total">{columns.map((c) => <td key={c.key} className={cls(c.align)}>{total[c.key] ?? ''}</td>)}</tr>
        )}
      </tbody>
    </table>
  );
}
