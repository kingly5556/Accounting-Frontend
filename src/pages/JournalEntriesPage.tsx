import { useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../components/StatusBadge";
import { showDate } from "../lib/dates";
import { useCan } from "../lib/me";
import { formatSatang } from "../lib/money";
import { api } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import type { JournalStatus } from "../types";

export function JournalEntriesPage() {
  const { canWrite } = useCan();
  const [status, setStatus] = useState<JournalStatus | "">("");
  const [origin, setOrigin] = useState<"" | "manual" | "system">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, error, loading } = useAsync(
    () => api.journal.list({ status: status || undefined, origin: origin || undefined, from: from || undefined, to: to || undefined }),
    [status, origin, from, to]
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Journal Entries</h2>
        {canWrite && (
          <Link to="/journal-entries/new">
            <button>New journal entry</button>
          </Link>
        )}
      </div>

      <div className="filters">
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as JournalStatus | "")}>
            <option value="">All</option>
            <option value="DRAFT">DRAFT</option>
            <option value="POSTED">POSTED</option>
            <option value="REVERSED">REVERSED</option>
          </select>
        </label>
        <label>
          Origin
          <select value={origin} onChange={(e) => setOrigin(e.target.value as "" | "manual" | "system")}>
            <option value="">All</option>
            <option value="manual">Manual</option>
            <option value="system">From another module (Stock)</option>
          </select>
        </label>
        <label>
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="muted">Loading…</p>}
      {data && data.length === 0 && <p className="muted">No journal entries match.</p>}
      {data && data.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Entry #</th>
              <th>Date</th>
              <th>Description</th>
              <th>Origin</th>
              <th>Status</th>
              <th className="num">Amount (THB)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((e) => {
              const total = e.lines.reduce((sum, l) => sum + BigInt(l.debit), 0n);
              return (
                <tr key={e.id}>
                  <td>
                    <Link to={`/journal-entries/${e.id}`}>{e.entryNo ?? "(draft)"}</Link>
                  </td>
                  <td>{showDate(e.entryDate)}</td>
                  <td>{e.description}</td>
                  <td>{e.sourceModule ? <span className="badge system">{e.sourceModule}</span> : "manual"}</td>
                  <td>
                    <StatusBadge status={e.status} />
                  </td>
                  <td className="num">{formatSatang(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
