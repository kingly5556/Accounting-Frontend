import type {
  Account,
  AccountType,
  BalanceSheet,
  IncomeStatement,
  GeneralLedger,
  JournalEntry,
  JournalEntrySummary,
  JournalStatus,
  Me,
  Period,
  TrialBalance,
  YearEndPreview,
} from "../types";

// BASE_URL is "/" in dev (Vite proxies /api to the backend directly) and
// "/erp/accounting/" in production (served through ERPHUB's proxy, which attaches the
// caller's Authorization header — this module never touches a token itself).
const API_BASE = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/");

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type LineDraft = { accountId: string; debit: string; credit: string; memo?: string };
export type EntryInput = { entryDate: string; description: string; lines: LineDraft[] };

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const api = {
  me: () => request<Me>("/me"),
  accounts: {
    list: () => request<Account[]>("/accounts"),
    create: (input: { code: string; name: string; type: AccountType; parentId?: string | null; isPostable?: boolean }) =>
      request<Account>("/accounts", json("POST", input)),
    update: (id: string, patch: { name?: string; isActive?: boolean }) =>
      request<Account>(`/accounts/${id}`, json("PATCH", patch)),
  },
  journal: {
    list: (q: { status?: JournalStatus; from?: string; to?: string; origin?: "manual" | "system" }) => {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(q)) if (v) params.set(k, v);
      return request<JournalEntrySummary[]>(`/journal-entries?${params}`);
    },
    get: (id: string) => request<JournalEntry>(`/journal-entries/${id}`),
    create: (input: EntryInput) => request<JournalEntry>("/journal-entries", json("POST", input)),
    update: (id: string, input: EntryInput) => request<JournalEntry>(`/journal-entries/${id}`, json("PATCH", input)),
    remove: (id: string) => request<void>(`/journal-entries/${id}`, json("DELETE")),
    post: (id: string) => request<JournalEntry>(`/journal-entries/${id}/post`, json("POST")),
    reverse: (id: string, entryDate?: string) =>
      request<JournalEntry>(`/journal-entries/${id}/reverse`, json("POST", { entryDate })),
  },
  periods: {
    list: () => request<Period[]>("/periods"),
    close: (period: string) => request<Period>(`/periods/${period}/close`, json("POST")),
  },
  yearEnd: {
    preview: (year: number) => request<YearEndPreview>(`/year-end/${year}/preview`),
    close: (year: number) => request<{ year: number; entryNo: string | null; netIncome: string }>(`/year-end/${year}/close`, json("POST")),
  },
  reports: {
    trialBalance: (asOf: string) => request<TrialBalance>(`/reports/trial-balance?asOf=${asOf}`),
    incomeStatement: (from: string, to: string) =>
      request<IncomeStatement>(`/reports/income-statement?from=${from}&to=${to}`),
    balanceSheet: (asOf: string) => request<BalanceSheet>(`/reports/balance-sheet?asOf=${asOf}`),
    generalLedger: (accountId: string, from: string, to: string) =>
      request<GeneralLedger>(`/reports/general-ledger/${accountId}?from=${from}&to=${to}`),
  },
};

/** URL of an Excel export. A plain link works: the browser sends the ERPHUB session cookie. */
export function exportUrl(report: "trial-balance" | "income-statement" | "balance-sheet", params: Record<string, string>) {
  return `${API_BASE}/reports/${report}.xlsx?${new URLSearchParams(params)}`;
}
