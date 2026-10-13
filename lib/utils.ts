export { cn } from "cn"

// Prices are always stored as an integer VND amount (see plan section 3).
// This only formats that amount for an English-language UI — no currency conversion.
export function formatVnd(amount: number) {
  return `${new Intl.NumberFormat("en-US").format(amount)} VND`
}

/** Local date components, not `toISOString()` — the latter converts to UTC
 * first, silently shifting the date back a day for any timezone ahead of UTC. */
export function formatIsoDate(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
