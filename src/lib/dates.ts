// "Today" and display dates are Bangkok calendar days — the same rule the backend uses
// to pick the accounting period.
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

export function todayBangkok(): string {
  return new Date(Date.now() + BANGKOK_OFFSET_MS).toISOString().slice(0, 10);
}

export function monthStartBangkok(): string {
  return `${todayBangkok().slice(0, 7)}-01`;
}

export function showDate(iso: string): string {
  return new Date(new Date(iso).getTime() + BANGKOK_OFFSET_MS).toISOString().slice(0, 10);
}

/** Link target in the Stock module for an entry that came from it (same origin through ERPHUB). */
export function sourceLink(ref: { poId?: string } | null): string | undefined {
  return ref?.poId ? `/erp/stock/purchase-orders/${ref.poId}` : undefined;
}
