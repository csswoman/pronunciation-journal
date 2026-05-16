type TableCell = string | number | null;

interface TableProps {
  headers: string[];
  rows: TableCell[][];
}

export default function Table({ headers, rows }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border-default">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-raised border-b border-border-default">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-fg-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`border-t border-border-default ${i % 2 !== 0 ? "bg-surface-raised" : ""}`}
            >
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-fg">
                  {cell ?? <span className="text-fg-subtle">—</span>}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="px-3 py-4 text-center text-sm text-fg-subtle">
                No records yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
