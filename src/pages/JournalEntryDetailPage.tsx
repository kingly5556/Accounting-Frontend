import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { StatusBadge } from "../components/StatusBadge";
import { ApiError, api } from "../lib/api";
import { showDate, sourceLink, todayBangkok } from "../lib/dates";
import { useCan } from "../lib/me";
import { formatSatang } from "../lib/money";
import { useAsync } from "../lib/useAsync";

export function JournalEntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canWrite } = useCan();
  const { data: entry, error, loading, reload } = useAsync(() => api.journal.get(id!), [id]);
  const [actionError, setActionError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [reverseDate, setReverseDate] = useState(todayBangkok());

  async function run(fn: () => Promise<unknown>, then?: () => void) {
    setActionError(undefined);
    setBusy(true);
    try {
      await fn();
      if (then) then();
      else reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !entry) return <p className="muted">Loading…</p>;
  if (error) return <div className="error-banner">{error}</div>;
  if (!entry) return null;

  const totalDebit = entry.lines.reduce((s, l) => s + BigInt(l.debit), 0n);
  const totalCredit = entry.lines.reduce((s, l) => s + BigInt(l.credit), 0n);
  const stockLink = sourceLink(entry.sourceRef);

  return (
    <div>
      <p>
        <Link to="/journal-entries">&larr; Journal entries</Link>
      </p>
      <h2>
        {entry.entryNo ?? "Draft"} <StatusBadge status={entry.status} />
      </h2>
      {actionError && <div className="error-banner">{actionError}</div>}

      <div className="card">
        <dl className="meta">
          <dt>Date</dt>
          <dd>{showDate(entry.entryDate)}</dd>
          <dt>Description</dt>
          <dd>{entry.description}</dd>
          <dt>Origin</dt>
          <dd>
            {entry.sourceModule ? (
              <>
                <span className="badge system">{entry.sourceModule}</span> {entry.sourceType}
                {stockLink && (
                  // Same origin through ERPHUB, so the session carries over — no second login.
                  <>
                    {" "}
                    — <a href={stockLink}>open source document in Stock</a>
                  </>
                )}
              </>
            ) : (
              "Manual entry"
            )}
          </dd>
          <dt>Created by</dt>
          <dd>{entry.createdBy}</dd>
          {entry.postedBy && (
            <>
              <dt>Posted by</dt>
              <dd>
                {entry.postedBy} {entry.postedAt && `(${showDate(entry.postedAt)})`}
              </dd>
            </>
          )}
          {entry.reversalOf && (
            <>
              <dt>Reverses</dt>
              <dd>
                <Link to={`/journal-entries/${entry.reversalOf.id}`}>{entry.reversalOf.entryNo}</Link>
              </dd>
            </>
          )}
          {entry.reversedBy && (
            <>
              <dt>Reversed by</dt>
              <dd>
                <Link to={`/journal-entries/${entry.reversedBy.id}`}>{entry.reversedBy.entryNo}</Link>
              </dd>
            </>
          )}
        </dl>
      </div>

      <table>
        <thead>
          <tr>
            <th>Account</th>
            <th>Memo</th>
            <th className="num">Debit</th>
            <th className="num">Credit</th>
          </tr>
        </thead>
        <tbody>
          {entry.lines.map((l) => (
            <tr key={l.id}>
              <td>
                {l.account.code} {l.account.name}
              </td>
              <td className="muted">{l.memo}</td>
              <td className="num">{BigInt(l.debit) > 0n ? formatSatang(l.debit) : ""}</td>
              <td className="num">{BigInt(l.credit) > 0n ? formatSatang(l.credit) : ""}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2}>Total</td>
            <td className="num">{formatSatang(totalDebit)}</td>
            <td className="num">{formatSatang(totalCredit)}</td>
          </tr>
        </tfoot>
      </table>

      {canWrite && entry.status === "DRAFT" && !entry.sourceModule && (
        <div className="actions">
          <button disabled={busy} onClick={() => run(() => api.journal.post(entry.id))}>
            Post
          </button>
          <Link to={`/journal-entries/${entry.id}/edit`}>
            <button className="secondary">Edit</button>
          </Link>
          <button className="danger" disabled={busy} onClick={() => run(() => api.journal.remove(entry.id), () => navigate("/journal-entries"))}>
            Delete draft
          </button>
        </div>
      )}

      {canWrite && entry.status === "POSTED" && !entry.reversalOf && (
        <div className="card" style={{ marginTop: 20 }}>
          <strong>Correct a mistake</strong>
          <p className="muted">
            Posted entries can never be edited. Reversing creates a new posted entry with every debit and credit swapped, and marks this one REVERSED.
          </p>
          <div className="filters">
            <label>
              Reversal date
              <input type="date" value={reverseDate} onChange={(e) => setReverseDate(e.target.value)} />
            </label>
            <button className="danger" disabled={busy || !reverseDate} onClick={() => run(() => api.journal.reverse(entry.id, reverseDate))}>
              Reverse entry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
