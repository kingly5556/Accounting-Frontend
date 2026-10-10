import { useState } from "react";
import { Link } from "react-router-dom";
import { api, exportUrl } from "../lib/api";
import { todayBangkok } from "../lib/dates";
import { formatSatang } from "../lib/money";
import { useAsync } from "../lib/useAsync";

export function TrialBalancePage() {
  const [asOf, setAsOf] = useState(todayBangkok());
  const { data, error, loading } = useAsync(() => api.reports.trialBalance(asOf), [asOf]);

  return (
    <div>
      <h2>Trial Balance</h2>
      <div className="filters">
        <label>
          As of
          <input type="date" value={asOf} onChange={(e) => e.target.value && setAsOf(e.target.value)} />
        </label>
        <a href={exportUrl("trial-balance", { asOf })} download>
          <button type="button" className="secondary">Export Excel</button>
        </a>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="muted">Loading…</p>}
      {data && data.accounts.length === 0 && <p className="muted">No posted entries up to this date.</p>}
      {data && data.accounts.length > 0 && (
        <>
          <table>
            <thead>
              <tr>
                <th style={{ width: 90 }}>Code</th>
                <th>Account</th>
                <th className="num">Debit (THB)</th>
                <th className="num">Credit (THB)</th>
              </tr>
            </thead>
            <tbody>
              {data.accounts.map((a) => (
                <tr key={a.accountId}>
                  <td>{a.code}</td>
                  <td>
                    <Link to={`/general-ledger?account=${a.accountId}`}>{a.name}</Link>
                  </td>
                  <td className="num">{BigInt(a.debitBalance) > 0n ? formatSatang(a.debitBalance) : ""}</td>
                  <td className="num">{BigInt(a.creditBalance) > 0n ? formatSatang(a.creditBalance) : ""}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>Total</td>
                <td className="num">{formatSatang(data.totalDebit)}</td>
                <td className="num">{formatSatang(data.totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
          {data.balanced ? (
            <div className="ok-banner">Debit = Credit ✓ The trial balance is in balance.</div>
          ) : (
            <div className="error-banner">Debit ≠ Credit — the ledger is out of balance. This should never happen: report it.</div>
          )}
        </>
      )}
    </div>
  );
}
