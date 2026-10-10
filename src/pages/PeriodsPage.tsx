import { useState } from "react";
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
    </div>
  );
}
