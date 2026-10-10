import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { monthStartBangkok, showDate, todayBangkok } from "../lib/dates";
import { formatBalance, formatSatang } from "../lib/money";
import { useAsync } from "../lib/useAsync";

export function GeneralLedgerPage() {
  const [params, setParams] = useSearchParams();
  const accountId = params.get("account") ?? "";
  const [from, setFrom] = useState(monthStartBangkok());
  const [to, setTo] = useState(todayBangkok());

  const accounts = useAsync(() => api.accounts.list(), []);
  const ledger = useAsync(
    () => (accountId ? api.reports.generalLedger(accountId, from, to) : Promise.resolve(undefined)),
    [accountId, from, to]
  );

  const side = ledger.data?.account.normalSide ?? "DEBIT";

  return (
    <div>
      <h2>General Ledger</h2>
      <div className="filters">
        <label>
          Account
          <select value={accountId} onChange={(e) => setParams(e.target.value ? { account: e.target.value } : {})}>
            <option value="">Select an account…</option>
            {(accounts.data ?? [])
              .filter((a) => a.isPostable)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} {a.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          From
          <input type="date" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={to} onChange={(e) => e.target.value && setTo(e.target.value)} />
        </label>
      </div>

      {accounts.error && <div className="error-banner">{accounts.error}</div>}
      {ledger.error && <div className="error-banner">{ledger.error}</div>}
      {!accountId && <p className="muted">Choose an account to see its movements.</p>}
      {ledger.loading && accountId && <p className="muted">Loading…</p>}

      {ledger.data && (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Entry #</th>
              <th>Description</th>
              <th className="num">Debit</th>
              <th className="num">Credit</th>
              <th className="num">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr className="group-row">
              <td colSpan={5}>Opening balance</td>
              <td className="num">{formatBalance(ledger.data.openingBalance, side)}</td>
            </tr>
            {ledger.data.lines.map((l, i) => (
              <tr key={`${l.entryId}-${i}`}>
                <td>{showDate(l.entryDate)}</td>
                <td>
                  <Link to={`/journal-entries/${l.entryId}`}>{l.entryNo}</Link>
                </td>
                <td>
                  {l.description}
                  {l.memo && <span className="muted"> — {l.memo}</span>}
                </td>
                <td className="num">{BigInt(l.debit) > 0n ? formatSatang(l.debit) : ""}</td>
                <td className="num">{BigInt(l.credit) > 0n ? formatSatang(l.credit) : ""}</td>
                <td className="num">{formatBalance(l.balance, side)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5}>Closing balance</td>
              <td className="num">{formatBalance(ledger.data.closingBalance, side)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
