// Satang <-> baht using bigint and string parsing only. No floats anywhere.
export function formatSatang(value: string | bigint): string {
  const satang = typeof value === "bigint" ? value : BigInt(value);
  const negative = satang < 0n;
  const abs = negative ? -satang : satang;
  const baht = (abs / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const rest = (abs % 100n).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${baht}.${rest}`;
}

/** "1,234.5" -> "123450" (satang). Returns null when the text is not a valid amount. */
export function parseBahtToSatang(text: string): string | null {
  const cleaned = text.replace(/,/g, "").trim();
  if (cleaned === "") return "0";
  const m = cleaned.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!m) return null;
  const satang = BigInt(m[1]) * 100n + BigInt((m[2] ?? "").padEnd(2, "0") || "0");
  return satang.toString();
}

/** Show a debit-positive balance on the account's natural side (e.g. 1,500.00 Dr / Cr). */
export function formatBalance(value: string, normalSide: "DEBIT" | "CREDIT"): string {
  const net = BigInt(value);
  const natural = normalSide === "DEBIT" ? net : -net;
  const side = natural >= 0n ? (normalSide === "DEBIT" ? "Dr" : "Cr") : normalSide === "DEBIT" ? "Cr" : "Dr";
  return `${formatSatang(natural < 0n ? -natural : natural)} ${side}`;
}
