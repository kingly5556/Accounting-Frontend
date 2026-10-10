import type { JournalStatus } from "../types";

export function StatusBadge({ status }: { status: JournalStatus }) {
  return <span className={`badge ${status}`}>{status}</span>;
}
