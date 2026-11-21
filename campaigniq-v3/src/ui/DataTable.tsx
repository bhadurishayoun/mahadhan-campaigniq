import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  render: (row: T) => ReactNode;
}

/** Light grey header, right-aligned numbers, amber-tinted total row, tinted selected row. */
/** `selectable` adds a 44px first column with a radio per row (the selected row is on); the total row leaves it empty. */
export function DataTable<T>({ columns, rows, rowKey, total, selected, onRowClick, selectable }: {
  selectable?: boolean;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  total?: Record<string, ReactNode>;
  selected?: string | null;
  onRowClick?: (row: T) => void;
}) {
  // Every cell is centred (styles.css); `align: 'right'` now only marks number columns, which never wrap.
  const cls = (a?: string) => (a === 'right' ? 'nw' : undefined);
  return (
    <table className="tbl">
      <thead>
        <tr>{selectable && <th style={{ width: 44 }} aria-label="Select" />}{columns.map((c) => <th key={c.key} className={cls(c.align)} style={c.width ? { width: c.width } : undefined}>{c.header}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const k = rowKey(r);
          return (
            <tr key={k} className={[onRowClick ? 'click' : '', selected === k ? 'sel' : ''].join(' ').trim() || undefined} onClick={onRowClick ? () => onRowClick(r) : undefined}>
              {selectable && <td style={{ width: 44 }}><span className={`radio${selected === k ? ' on' : ''}`} role="radio" aria-checked={selected === k} /></td>}
              {columns.map((c) => <td key={c.key} className={cls(c.align)}>{c.render(r)}</td>)}
            </tr>
          );
        })}
        {total && rows.length > 1 && (
          <tr className="total">{selectable && <td />}{columns.map((c) => <td key={c.key} className={cls(c.align)}>{total[c.key] ?? ''}</td>)}</tr>
        )}
      </tbody>
    </table>
  );
}
