import { useState, type FormEvent } from "react";
import { ApiError, api } from "../lib/api";
import { useCan } from "../lib/me";
import { useAsync } from "../lib/useAsync";
import type { Account, AccountType } from "../types";

const TYPES: { type: AccountType; label: string }[] = [
  { type: "ASSET", label: "สินทรัพย์ (Asset)" },
  { type: "LIABILITY", label: "หนี้สิน (Liability)" },
  { type: "EQUITY", label: "ส่วนของเจ้าของ (Equity)" },
  { type: "REVENUE", label: "รายได้ (Revenue)" },
  { type: "EXPENSE", label: "ค่าใช้จ่าย (Expense)" },
];

export function ChartOfAccountsPage() {
  const { canWrite } = useCan();
  const { data, error, loading, reload } = useAsync(() => api.accounts.list(), []);
  const [formError, setFormError] = useState<string>();

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(undefined);
    const form = new FormData(e.currentTarget);
    const parentId = String(form.get("parentId") ?? "");
    try {
      await api.accounts.create({
        code: String(form.get("code")),
        name: String(form.get("name")),
        type: String(form.get("type")) as AccountType,
        parentId: parentId || null,
      });
      e.currentTarget.reset();
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to create account");
    }
  }

  async function toggle(a: Account) {
    setFormError(undefined);
    try {
      await api.accounts.update(a.id, { isActive: !a.isActive });
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to update account");
    }
  }

  const groups = (data ?? []).filter((a) => !a.isPostable);

  return (
    <div>
      <h2>Chart of Accounts</h2>
      {canWrite && (
        <form className="card inline" onSubmit={handleCreate}>
          <label>
            Code
            <input name="code" required pattern="\d{3,10}" placeholder="1120" />
          </label>
          <label>
            Name
            <input name="name" required />
          </label>
          <label>
            Type
            <select name="type" defaultValue="ASSET">
              {TYPES.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Group
            <select name="parentId" defaultValue="">
              <option value="">(none)</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.code} {g.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Add account</button>
        </form>
      )}
      {formError && <div className="error-banner">{formError}</div>}
      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="muted">Loading…</p>}

      {data &&
        TYPES.map(({ type, label }) => {
          const rows = data.filter((a) => a.type === type);
          if (rows.length === 0) return null;
          return (
            <div key={type} style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 8 }}>{label}</h3>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 90 }}>Code</th>
                    <th>Name</th>
                    <th>Kind</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.id} className={`${a.isPostable ? "" : "group-row"} ${a.isActive ? "" : "inactive"}`}>
                      <td>{a.code}</td>
                      <td style={{ paddingLeft: a.parentId ? 28 : 12 }}>{a.name}</td>
                      <td className="muted">{a.isPostable ? "Postable" : "Group header"}</td>
                      <td style={{ textAlign: "right" }}>
                        {canWrite && a.isPostable && (
                          <button className="secondary" onClick={() => toggle(a)}>
                            {a.isActive ? "Deactivate" : "Activate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
    </div>
  );
}
