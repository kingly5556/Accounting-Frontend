import { useState } from "react";
import type { YearEndPreview } from "../types";
import { formatSatang } from "../lib/money";
import { ApiError, api } from "../lib/api";
import { showDate } from "../lib/dates";
import { useCan } from "../lib/me";
import { useAsync } from "../lib/useAsync";

export function PeriodsPage() {
  const { canClosePeriod } = useCan();
  const { data, error, loading, reload } = useAsync(() => api.periods.list(), []);
  const [actionError, setActionError] = useState<string>();

  async function close(period: string) {
    if (!window.confirm(`Close ${period}? Nothing can be posted into it afterwards.`)) return;
    setActionError(undefined);
    try {
      await api.periods.close(period);
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to close period");
    }
  }

  const [year, setYear] = useState(new Date().getFullYear());
  const [preview, setPreview] = useState<YearEndPreview>();
  const [closedMsg, setClosedMsg] = useState<string>();

  async function loadPreview() {
    setActionError(undefined);
    setClosedMsg(undefined);
    try {
      setPreview(await api.yearEnd.preview(year));
    } catch (err) {
      setPreview(undefined);
      setActionError(err instanceof ApiError ? err.message : "Failed to load preview");
    }
  }

  async function closeYear() {
    if (!window.confirm(`Close year ${year}? This books the closing entry and locks all 12 periods. It cannot be undone.`)) return;
    setActionError(undefined);
    try {
      const r = await api.yearEnd.close(year);
      setClosedMsg(`Year ${r.year} closed${r.entryNo ? ` — closing entry ${r.entryNo}` : " (no revenue or expenses to close)"}.`);
      setPreview(undefined);
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to close year");
    }
  }

  return (
    <div>
      <h2>Accounting Periods</h2>
      <p className="muted">
        A period is a calendar month (Bangkok time). It opens automatically on the first posting. Once closed, nothing can be
        posted or reversed into it; automatic entries from Stock move to the next open period instead.
      </p>
      {actionError && <div className="error-banner">{actionError}</div>}
      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="muted">Loading…</p>}
      {data && data.length === 0 && <p className="muted">No periods yet — they appear once something is posted.</p>}
      {data && data.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Period</th>
              <th>Status</th>
              <th>Closed by</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id}>
                <td>{p.period}</td>
                <td>
                  <span className={`badge ${p.status}`}>{p.status}</span>
                </td>
                <td className="muted">{p.closedBy ? `${p.closedBy} (${p.closedAt ? showDate(p.closedAt) : ""})` : ""}</td>
                <td style={{ textAlign: "right" }}>
                  {canClosePeriod && p.status === "OPEN" && (
                    <button className="danger" onClick={() => close(p.period)}>
                      Close period
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    
      {closedMsg && <div className="ok-banner">{closedMsg}</div>}
      {canClosePeriod && (
        <div className="card" style={{ marginTop: 24 }}>
          <strong>Year-end close</strong>
          <p className="muted">
            Moves the year&apos;s revenue and expenses into retained earnings (3200) with one entry dated 31 Dec, then locks all twelve
            periods. Preview first — nothing changes until you confirm.
          </p>
          <div className="filters">
            <label>
              Year
              <input type="number" value={year} min={2000} max={2100} onChange={(e) => { setYear(Number(e.target.value)); setPreview(undefined); }} />
            </label>
            <button className="secondary" onClick={loadPreview}>
              Preview
            </button>
          </div>
          {preview && (
            <>
              {preview.blockers.map((b) => (
                <div key={b} className="error-banner">{b}</div>
              ))}
              {preview.lines.length === 0 && preview.blockers.length === 0 && <p className="muted">No revenue or expense balances in {preview.year}: closing will only lock the periods.</p>}
              {preview.lines.length > 0 && (
                <table>
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th className="num">Debit</th>
                      <th className="num">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.lines.map((l) => (
                      <tr key={l.accountId}>
                        <td>{l.code} {l.name}</td>
                        <td className="num">{BigInt(l.debit) > 0n ? formatSatang(l.debit) : ""}</td>
                        <td className="num">{BigInt(l.credit) > 0n ? formatSatang(l.credit) : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3}>{BigInt(preview.netIncome) >= 0n ? "Net income" : "Net loss"}: {formatSatang(preview.netIncome)} THB</td>
                    </tr>
                  </tfoot>
                </table>
              )}
              <div className="actions">
                <button className="danger" disabled={!preview.canClose} onClick={closeYear}>
                  Close year {preview.year}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
