import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError, api } from "../lib/api";
import { showDate, todayBangkok } from "../lib/dates";
import { formatSatang, parseBahtToSatang } from "../lib/money";
import { useAsync } from "../lib/useAsync";

type Row = { key: number; accountId: string; debit: string; credit: string; memo: string };

let nextKey = 1;
const blankRow = (): Row => ({ key: nextKey++, accountId: "", debit: "", credit: "", memo: "" });

// Used for both "new" and "edit draft" (when :id is present).
export function JournalEntryFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const accounts = useAsync(() => api.accounts.list(), []);
  const existing = useAsync(() => (id ? api.journal.get(id) : Promise.resolve(undefined)), [id]);

  const [entryDate, setEntryDate] = useState(todayBangkok());
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<Row[]>([blankRow(), blankRow()]);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  // If "save & post" saves the draft but posting fails (e.g. closed period), later clicks
  // must update that draft, not create a second one.
  const [savedId, setSavedId] = useState<string>();
  const draftId = id ?? savedId;

  useEffect(() => {
    const e = existing.data;
    if (!e) return;
    setEntryDate(showDate(e.entryDate));
    setDescription(e.description);
    setRows(
      e.lines.map((l) => ({
        key: nextKey++,
        accountId: l.accountId,
        debit: BigInt(l.debit) > 0n ? formatSatang(l.debit).replace(/,/g, "") : "",
        credit: BigInt(l.credit) > 0n ? formatSatang(l.credit).replace(/,/g, "") : "",
        memo: l.memo ?? "",
      }))
    );
  }, [existing.data]);

  const postable = useMemo(() => (accounts.data ?? []).filter((a) => a.isPostable && a.isActive), [accounts.data]);

  // Live Σ debit / Σ credit / difference. Parsing is string-based: a half-typed amount
  // simply counts as invalid rather than being silently treated as zero.
  const sums = useMemo(() => {
    let debit = 0n;
    let credit = 0n;
    let invalid = false;
    for (const r of rows) {
      const d = parseBahtToSatang(r.debit);
      const c = parseBahtToSatang(r.credit);
      if (d === null || c === null) invalid = true;
      else {
        debit += BigInt(d);
        credit += BigInt(c);
      }
    }
    return { debit, credit, invalid };
  }, [rows]);

  const filled = rows.filter((r) => r.accountId || r.debit || r.credit);
  const bothSides = filled.some((r) => BigInt(parseBahtToSatang(r.debit) ?? 0) > 0n && BigInt(parseBahtToSatang(r.credit) ?? 0) > 0n);
  const missingAccount = filled.some((r) => !r.accountId);
  const balanced =
    !sums.invalid && !bothSides && !missingAccount && filled.length >= 2 && sums.debit > 0n && sums.debit === sums.credit;
  const diff = sums.debit - sums.credit;

  function update(key: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function save(e: FormEvent, thenPost: boolean) {
    e.preventDefault();
    setError(undefined);
    setSaving(true);
    try {
      const input = {
        entryDate,
        description,
        lines: filled.map((r) => ({
          accountId: r.accountId,
          debit: parseBahtToSatang(r.debit) ?? "0",
          credit: parseBahtToSatang(r.credit) ?? "0",
          memo: r.memo || undefined,
        })),
      };
      const saved = draftId ? await api.journal.update(draftId, input) : await api.journal.create(input);
      setSavedId(saved.id);
      if (thenPost) await api.journal.post(saved.id);
      navigate(`/journal-entries/${saved.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save journal entry");
    } finally {
      setSaving(false);
    }
  }

  if (id && existing.data && existing.data.status !== "DRAFT") {
    return <div className="error-banner">Only DRAFT entries can be edited.</div>;
  }

  return (
    <div>
      <h2>{id ? "Edit draft" : "New journal entry"}</h2>
      {error && <div className="error-banner">{error}</div>}
      {accounts.error && <div className="error-banner">{accounts.error}</div>}

      <form className="card" onSubmit={(e) => save(e, false)}>
        <div className="filters">
          <label>
            Date
            <input type="date" required value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
          </label>
          <label style={{ flex: 1 }}>
            Description
            <input required value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: "100%" }} />
          </label>
        </div>

        <table className="entry-lines">
          <thead>
            <tr>
              <th style={{ width: "34%" }}>Account</th>
              <th className="num">Debit (THB)</th>
              <th className="num">Credit (THB)</th>
              <th>Memo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td>
                  <select value={r.accountId} onChange={(e) => update(r.key, { accountId: e.target.value })}>
                    <option value="">Select…</option>
                    {postable.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} {a.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    inputMode="decimal"
                    value={r.debit}
                    onChange={(e) => update(r.key, { debit: e.target.value, credit: e.target.value ? "" : r.credit })}
                    style={{ textAlign: "right" }}
                  />
                </td>
                <td>
                  <input
                    inputMode="decimal"
                    value={r.credit}
                    onChange={(e) => update(r.key, { credit: e.target.value, debit: e.target.value ? "" : r.debit })}
                    style={{ textAlign: "right" }}
                  />
                </td>
                <td>
                  <input value={r.memo} onChange={(e) => update(r.key, { memo: e.target.value })} />
                </td>
                <td>
                  {rows.length > 2 && (
                    <button type="button" className="secondary" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}>
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="actions">
          <button type="button" className="secondary" onClick={() => setRows((rs) => [...rs, blankRow()])}>
            + Add line
          </button>
        </div>

        <div className="totals">
          <span>Σ Debit: <strong>{formatSatang(sums.debit)}</strong></span>
          <span>Σ Credit: <strong>{formatSatang(sums.credit)}</strong></span>
          <span className={balanced ? "ok" : "bad"}>
            {sums.invalid
              ? "Invalid amount"
              : balanced
                ? "Balanced ✓"
                : `Difference: ${formatSatang(diff < 0n ? -diff : diff)} ${diff > 0n ? "(more debit)" : diff < 0n ? "(more credit)" : ""}`}
          </span>
        </div>
        {bothSides && <p className="error-banner">A line can have a debit or a credit, not both.</p>}

        <div className="actions">
          <button type="submit" className="secondary" disabled={saving || !balanced || !description}>
            Save draft
          </button>
          {/* Post stays disabled until the entry balances. */}
          <button type="button" disabled={saving || !balanced || !description} onClick={(e) => save(e as unknown as FormEvent, true)}>
            Save &amp; post
          </button>
        </div>
      </form>
    </div>
  );
}
