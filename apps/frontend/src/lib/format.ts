/** Format angka tampilan (locale Indonesia). */
export function formatQty(value: string | number): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("id-ID", { maximumFractionDigits: 6 });
}

/** Format tanggal YYYY-MM-DD ke tampilan id-ID. */
export function formatDate(value: string): string {
  const raw = value.slice(0, 10);
  const [y, m, d] = raw.split("-").map(Number);
  if (!y || !m || !d) return value;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
