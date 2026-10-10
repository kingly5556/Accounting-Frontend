import { NavLink, Outlet } from "react-router-dom";
import { useCan } from "../lib/me";

const links = [
  { to: "/journal-entries", label: "Journal Entries" },
  { to: "/accounts", label: "Chart of Accounts" },
  { to: "/trial-balance", label: "Trial Balance" },
  { to: "/general-ledger", label: "General Ledger" },
  { to: "/periods", label: "Periods" },
];

export function Layout() {
  const { me } = useCan();
  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>Accounting / GL</h1>
        <nav>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? "active" : undefined)}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        {me && <p className="muted" style={{ margin: "20px 10px 0" }}>Signed in as {me.username}</p>}
        {/* Login/logout live in ERPHUB — this module has none of its own. */}
        <p style={{ margin: "6px 10px 0", fontSize: 13 }}>
          <a href="/erphub">&larr; ERP Modules</a>
        </p>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
