// All money fields are satang as decimal STRINGS (the backend sends bigint as string so
// nothing is ever squeezed through a lossy JS number). Convert with lib/money.ts.
export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
export type JournalStatus = "DRAFT" | "POSTED" | "REVERSED";

export type Account = {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentId: string | null;
  isPostable: boolean;
  isActive: boolean;
};

export type JournalLine = {
  id: string;
  accountId: string;
  debit: string;
  credit: string;
  memo: string | null;
  account: { code: string; name: string };
};

export type JournalEntrySummary = {
  id: string;
  entryNo: string | null;
  entryDate: string;
  description: string;
  status: JournalStatus;
  sourceModule: string | null;
  sourceType: string | null;
  createdBy: string;
  lines: { debit: string; credit: string }[];
};

export type JournalEntry = Omit<JournalEntrySummary, "lines"> & {
  sourceId: string | null;
  sourceRef: { poId?: string; goodsReceiptId?: string; productId?: string } | null;
  postedBy: string | null;
  postedAt: string | null;
  lines: JournalLine[];
  reversalOf: { id: string; entryNo: string | null } | null;
  reversedBy: { id: string; entryNo: string | null } | null;
};

export type Period = { id: string; period: string; status: "OPEN" | "CLOSED"; closedBy: string | null; closedAt: string | null };

export type TrialBalance = {
  asOf: string;
  accounts: {
    accountId: string;
    code: string;
    name: string;
    type: AccountType;
    debitBalance: string;
    creditBalance: string;
  }[];
  totalDebit: string;
  totalCredit: string;
  balanced: boolean;
};

export type GeneralLedger = {
  account: { id: string; code: string; name: string; type: AccountType; normalSide: "DEBIT" | "CREDIT" };
  from: string;
  to: string;
  openingBalance: string;
  closingBalance: string;
  lines: {
    entryId: string;
    entryNo: string | null;
    entryDate: string;
    description: string;
    memo: string | null;
    debit: string;
    credit: string;
    balance: string;
  }[];
};

export type Me = { username: string; roles: string[] };
