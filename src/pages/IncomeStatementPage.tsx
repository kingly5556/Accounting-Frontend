import { useState } from "react";
import { StatementSection } from "../components/StatementTable";
import { api, exportUrl } from "../lib/api";
import { todayBangkok } from "../lib/dates";
import { formatSatang } from "../lib/money";
import { useAsync } from "../lib/useAsync";

export function IncomeStatementPage() {
  const [from, setFrom] = useState(`${todayBangkok().slice(0, 4)}-01-01`);
  const [to, setTo] = useState(todayBangkok());
  const { data, error, loading } = useAsync(() => api.reports.incomeStatement(from, to), [from, to]);
  const profit = data ? BigInt(data.netIncome) >= 0n : true;

  return (
    <div>
      <h2>Income Statement (งบกำไรขาดทุน)</h2>
      <div className="filters">
        <label>
          From
          <input type="date" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={to} onChange={(e) => e.target.value && setTo(e.target.value)} />
        </label>
        <a href={exportUrl("income-statement", { from, to })} download>
          <button type="button" className="secondary">Export Excel</button>
        </a>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="muted">Loading…</p>}
      {data && (
        <table>
          <tbody>
            <StatementSection title="Revenue (รายได้)" rows={data.revenues} total={data.totalRevenue} totalLabel="Total revenue" />
            <StatementSection title="Expenses (ค่าใช้จ่าย)" rows={data.expenses} total={data.totalExpense} totalLabel="Total expenses" />
          </tbody>
          <tfoot>
            <tr>
              <td />
              <td>{profit ? "Net income (กำไรสุทธิ)" : "Net loss (ขาดทุนสุทธิ)"}</td>
              <td className="num">{formatSatang(data.netIncome)}</td>
            </tr>
          </tfoot>
        </table>
      )}
      <p className="muted">Counts posted entries only. The year-end closing entry is excluded, so a closed year still shows its real result.</p>
    </div>
  );
}
