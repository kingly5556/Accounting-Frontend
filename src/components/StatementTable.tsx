import { formatSatang } from "../lib/money";
import type { StatementRow } from "../types";

// One titled block of a financial statement: account rows plus a bold total.
export function StatementSection({
  title,
  rows,
  total,
  totalLabel,
  extra,
}: {
  title: string;
  rows: StatementRow[];
  total: string;
  totalLabel: string;
  extra?: { label: string; amount: string }[];
}) {
  return (
    <>
      <tr className="group-row">
        <td colSpan={3}>{title}</td>
      </tr>
      {rows.length === 0 && !extra?.length && (
        <tr>
          <td colSpan={3} className="muted">
            None
          </td>
        </tr>
      )}
      {rows.map((r) => (
        <tr key={r.accountId}>
          <td style={{ width: 90 }}>{r.code}</td>
          <td>{r.name}</td>
          <td className="num">{formatSatang(r.amount)}</td>
        </tr>
      ))}
      {extra?.map((e) => (
        <tr key={e.label}>
          <td />
          <td>{e.label}</td>
          <td className="num">{formatSatang(e.amount)}</td>
        </tr>
      ))}
      <tr>
        <td />
        <td>
          <strong>{totalLabel}</strong>
        </td>
        <td className="num">
          <strong>{formatSatang(total)}</strong>
        </td>
      </tr>
    </>
  );
}
