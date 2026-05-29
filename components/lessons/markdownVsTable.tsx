import { isValidElement, type ReactNode } from "react";
import { flattenText } from "./markdownHelpers";

const VS_HEADERS: { match: RegExp; left: string; right: string }[] = [
  { match: /weak.*strong|strong.*weak/i,                         left: "Weak",   right: "Strong" },
  { match: /wrong.*right|right.*wrong|don.?t.*do|do.*don.?t/i,  left: "Wrong",  right: "Right"  },
  { match: /before.*after|after.*before/i,                       left: "Before", right: "After"  },
  { match: /❌.*✅|✅.*❌/,                                     left: "Don't",  right: "Do"     },
];

function detectVsHeaders(thead: ReactNode): { left: string; right: string } | null {
  const text = flattenText(thead);
  for (const h of VS_HEADERS) {
    if (h.match.test(text)) return { left: h.left, right: h.right };
  }
  return null;
}

function getVsRowCells(tbody: ReactNode): [ReactNode, ReactNode] | null {
  const cells: ReactNode[] = [];
  const visit = (n: ReactNode) => {
    if (Array.isArray(n)) { n.forEach(visit); return; }
    if (!isValidElement<{ children?: ReactNode }>(n)) return;
    const type = n.type as { name?: string; displayName?: string } | string;
    const name = typeof type === "string" ? type : (type.displayName ?? type.name ?? "");
    if (name === "td") { cells.push(n.props.children); return; }
    visit(n.props.children ?? null);
  };
  visit(tbody);
  if (cells.length < 2) return null;
  return [cells[0], cells[1]];
}

export function tryRenderVsTable(tableChildren: ReactNode): ReactNode | null {
  let thead: ReactNode = null;
  let tbody: ReactNode = null;
  const visit = (n: ReactNode) => {
    if (Array.isArray(n)) { n.forEach(visit); return; }
    if (!isValidElement<{ children?: ReactNode }>(n)) return;
    const type = n.type as { name?: string; displayName?: string } | string;
    const name = typeof type === "string" ? type : (type.displayName ?? type.name ?? "");
    if (name === "thead") thead = n.props.children;
    else if (name === "tbody") tbody = n.props.children;
    else visit(n.props.children ?? null);
  };
  visit(tableChildren);

  const labels = detectVsHeaders(thead);
  if (!labels) return null;
  const cells = getVsRowCells(tbody);
  if (!cells) return null;

  return (
    <aside className="md-vs" role="group" aria-label={`${labels.left} vs ${labels.right}`}>
      <div className="md-vs-col is-weak">
        <div className="md-vs-label">{labels.left}</div>
        <div className="md-vs-body">{cells[0]}</div>
      </div>
      <div className="md-vs-divider" aria-hidden />
      <div className="md-vs-col is-strong">
        <div className="md-vs-label">{labels.right}</div>
        <div className="md-vs-body">{cells[1]}</div>
      </div>
    </aside>
  );
}
