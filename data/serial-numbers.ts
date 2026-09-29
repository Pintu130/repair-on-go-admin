export type SerialStatus = "available" | "linked" | "void"

/**
 * A serial number identifies exactly one physical product for the whole of its life.
 * The Firestore document id IS the serial string, which makes uniqueness structural:
 * two concurrent writers cannot produce the same serial.
 */
export interface SerialNumber {
  /** Document id — identical to `serial` */
  id: string
  /** Human readable serial, e.g. "ROG-2026-000001" */
  serial: string
  year: number
  /** 1-based position within the year */
  sequence: number
  status: SerialStatus
  batchId: string
  createdAt?: string
  createdBy?: string
  voidedAt?: string
  voidedBy?: string
  voidReason?: string
  linkedAt?: string
  linkedByEmployeeId?: string
  linkedByEmployeeName?: string
  linkedOrderId?: string
  linkedOrderLabel?: string
}

/** One admin action that generated a contiguous run of serials. */
export interface SerialBatch {
  id: string
  year: number
  count: number
  fromSerial: string
  toSerial: string
  fromSequence: number
  toSequence: number
  createdAt?: string
  createdBy?: string
}

export interface SerialListResponse {
  serials: SerialNumber[]
  batches: SerialBatch[]
  /**
   * Highest sequence handed out this year, used to preview the next serial.
   * Sourced from the counter document, not from the loaded window, so the
   * preview stays correct even when the list itself is capped.
   */
  nextSequence: number
  year: number
  /** True when the loaded list hit SERIAL_LIST_MAX and older serials are not shown. */
  truncated: boolean
}

export const SERIAL_PREFIX = "ROG"
export const SERIAL_SEQUENCE_LENGTH = 6
export const MAX_SERIAL_BATCH_SIZE = 500
export const MIN_SERIAL_BATCH_SIZE = 1
export const SERIAL_LIST_MAX = 2000

export const SERIAL_STATUS_OPTIONS: { value: SerialStatus | "all"; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "available", label: "Available" },
  { value: "linked", label: "Linked" },
  { value: "void", label: "Void" },
]

export function getCurrentSerialYear(): number {
  return new Date().getFullYear()
}

export function formatSerial(year: number, sequence: number): string {
  const padded = String(sequence).padStart(SERIAL_SEQUENCE_LENGTH, "0")
  return `${SERIAL_PREFIX}-${year}-${padded}`
}

/** Accepts user input like "rog 2026 12" or "rog2026-12" and returns the canonical serial. */
export function normalizeSerialInput(input: string): string | null {
  const cleaned = input.trim().toUpperCase()
  if (!cleaned) return null
  const match = cleaned.match(/^(?:ROG)?[\s-]*(\d{4})[\s-]*(\d{1,6})$/)
  if (!match) return null
  return formatSerial(Number(match[1]), Number(match[2]))
}

/**
 * Compact form encoded into the sticker barcode, e.g. "ROG-2026-000123"
 * becomes "2026000123".
 *
 * CODE128 spends 11 modules on every character, so the prefix and the two
 * separators account for a third of the symbol. Dropping them takes a serial
 * from 178 modules to 90, which is the difference between a 42mm sticker that
 * will not fit on a watch and a 22mm one that does. `toSerialIdPrefixes`
 * already resolves this form back to the full serial when it is typed into
 * search, so a scan needs no special handling.
 */
export function toCompactSerialPayload(serial: string): string | null {
  const canonical = normalizeSerialInput(serial)
  if (!canonical) return null
  const match = canonical.match(/^[A-Z]+-(\d{4})-(\d+)$/)
  if (!match) return null
  return `${match[1]}${match[2]}`
}

export function isValidSerial(serial: string): boolean {
  return new RegExp(`^${SERIAL_PREFIX}-\\d{4}-\\d{${SERIAL_SEQUENCE_LENGTH}}$`).test(serial)
}

export function formatSerialStatus(status: SerialStatus): string {
  switch (status) {
    case "available":
      return "Available"
    case "linked":
      return "Linked"
    case "void":
      return "Void"
    default:
      return status
  }
}
