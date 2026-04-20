type TableCell = string | number | null;

interface TableProps {
  headers: string[];
  rows: TableCell[][];
}

export default function Table({ headers, rows }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-t"
              style={{ borderColor: "var(--border)", backgroundColor: i % 2 === 0 ? "transparent" : "var(--surface)" }}
            >
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2" style={{ color: "var(--text-primary)" }}>
                  {cell ?? <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="px-3 py-4 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                No records yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
