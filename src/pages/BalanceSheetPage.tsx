import { useState } from "react";
import { StatementSection } from "../components/StatementTable";
import { api, exportUrl } from "../lib/api";
import { todayBangkok } from "../lib/dates";
import { formatSatang } from "../lib/money";
import { useAsync } from "../lib/useAsync";

export function BalanceSheetPage() {
  const [asOf, setAsOf] = useState(todayBangkok());
  const { data, error, loading } = useAsync(() => api.reports.balanceSheet(asOf), [asOf]);

  return (
    <div>
      <h2>Balance Sheet (งบดุล)</h2>
      <div className="filters">
        <label>
          As of
          <input type="date" value={asOf} onChange={(e) => e.target.value && setAsOf(e.target.value)} />
        </label>
        <a href={exportUrl("balance-sheet", { asOf })} download>
          <button type="button" className="secondary">Export Excel</button>
        </a>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="muted">Loading…</p>}
      {data && (
        <>
          <table>
            <tbody>
              <StatementSection title="Assets (สินทรัพย์)" rows={data.assets} total={data.totalAssets} totalLabel="Total assets" />
              <StatementSection title="Liabilities (หนี้สิน)" rows={data.liabilities} total={data.totalLiabilities} totalLabel="Total liabilities" />
              <StatementSection
                title="Equity (ส่วนของเจ้าของ)"
                rows={data.equity}
                total={data.totalEquity}
                totalLabel="Total equity"
                extra={[{ label: "Net income to date (not yet closed to retained earnings)", amount: data.netIncomeToDate }]}
              />
            </tbody>
            <tfoot>
              <tr>
                <td />
                <td>Liabilities + Equity</td>
                <td className="num">{formatSatang(BigInt(data.totalLiabilities) + BigInt(data.totalEquity))}</td>
              </tr>
            </tfoot>
          </table>
          {data.balanced ? (
            <div className="ok-banner">Assets = Liabilities + Equity ✓</div>
          ) : (
            <div className="error-banner">Assets ≠ Liabilities + Equity — the ledger is out of balance. This should never happen: report it.</div>
          )}
        </>
      )}
    </div>
  );
}
