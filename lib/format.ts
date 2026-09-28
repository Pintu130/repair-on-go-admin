/** ₹1,23,456 */
export function formatINR(value: number): string {
  const safe = Number.isFinite(value) ? value : 0
  return `₹${Math.round(safe).toLocaleString("en-IN")}`
}

/** Axis ke liye short version: ₹1.2L / ₹45k / ₹850 */
export function formatINRCompact(value: number): string {
  const safe = Number.isFinite(value) ? value : 0
  const abs = Math.abs(safe)
  const sign = safe < 0 ? "-" : ""

  if (abs >= 10000000) {
    return `${sign}₹${trimZeros((abs / 10000000).toFixed(2))}Cr`
  }
  if (abs >= 100000) {
    return `${sign}₹${trimZeros((abs / 100000).toFixed(2))}L`
  }
  if (abs >= 1000) {
    return `${sign}₹${trimZeros((abs / 1000).toFixed(1))}k`
  }
  return `${sign}₹${Math.round(abs)}`
}

function trimZeros(value: string): string {
  return value.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1")
}

/** 12 Mar 2025 */
export function formatDate(value: string | number | Date | undefined | null): string {
  const date = toDate(value)
  if (!date) return "—"
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

/** 12 Mar, 3:45 pm */
export function formatDateTime(value: string | number | Date | undefined | null): string {
  const date = toDate(value)
  if (!date) return "—"
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

/** 5m ago / 3h ago / 12d ago / 12 Mar 2025 */
export function timeAgo(value: string | number | Date | undefined | null): string {
  const date = toDate(value)
  if (!date) return "—"

  const diffMs = Date.now() - date.getTime()
  if (diffMs < 0) return "just now"

  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`

  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`

  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`

  return formatDate(date)
}

/** Number ke saath Indian grouping: 1,23,456 */
export function formatNumber(value: number): string {
  const safe = Number.isFinite(value) ? value : 0
  return Math.round(safe).toLocaleString("en-IN")
}

/** Percentage with 1 decimal, 0.0 fallback */
export function formatPercent(part: number, total: number): string {
  if (!total) return "0%"
  return `${((part / total) * 100).toFixed(1)}%`
}

function toDate(value: string | number | Date | undefined | null): Date | null {
  if (value === undefined || value === null || value === "") return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === "number") {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof value === "string") {
    // Firestore se "yyyy-MM-dd" bhi aa sakta hai — parse karte waqt local midnight use karo
    const plainDay = /^\d{4}-\d{2}-\d{2}$/.test(value)
    const d = plainDay ? new Date(`${value}T00:00:00`) : new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

export { toDate as toValidDate }
