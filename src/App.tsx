import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { MeProvider } from "./lib/me";
import { BalanceSheetPage } from "./pages/BalanceSheetPage";
import { ChartOfAccountsPage } from "./pages/ChartOfAccountsPage";
import { GeneralLedgerPage } from "./pages/GeneralLedgerPage";
import { IncomeStatementPage } from "./pages/IncomeStatementPage";
import { JournalEntriesPage } from "./pages/JournalEntriesPage";
import { JournalEntryDetailPage } from "./pages/JournalEntryDetailPage";
import { JournalEntryFormPage } from "./pages/JournalEntryFormPage";
import { PeriodsPage } from "./pages/PeriodsPage";
import { TrialBalancePage } from "./pages/TrialBalancePage";

// "/" in dev, "/erp/accounting" in production — must match vite.config.ts's `base` so
// client-side routes line up with the prefix ERPHUB's proxy uses.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <MeProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<JournalEntriesPage />} />
            <Route path="journal-entries" element={<JournalEntriesPage />} />
            <Route path="journal-entries/new" element={<JournalEntryFormPage />} />
            <Route path="journal-entries/:id" element={<JournalEntryDetailPage />} />
            <Route path="journal-entries/:id/edit" element={<JournalEntryFormPage />} />
            <Route path="accounts" element={<ChartOfAccountsPage />} />
            <Route path="trial-balance" element={<TrialBalancePage />} />
            <Route path="income-statement" element={<IncomeStatementPage />} />
            <Route path="balance-sheet" element={<BalanceSheetPage />} />
            <Route path="general-ledger" element={<GeneralLedgerPage />} />
            <Route path="periods" element={<PeriodsPage />} />
          </Route>
        </Routes>
      </MeProvider>
    </BrowserRouter>
  );
}
