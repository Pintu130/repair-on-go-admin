import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import {
  collection,
  deleteField,
  doc,
  documentId,
  endAt,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAt,
  where,
  writeBatch,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { ensureFirebaseAuth } from "@/lib/utils/firebase-auth"
import {
  MAX_SERIAL_BATCH_SIZE,
  MIN_SERIAL_BATCH_SIZE,
  SERIAL_LIST_MAX,
  SERIAL_PREFIX,
  SERIAL_SEQUENCE_LENGTH,
  formatSerial,
  getCurrentSerialYear,
  normalizeSerialInput,
  type SerialBatch,
  type SerialListResponse,
  type SerialNumber,
  type SerialStatus,
} from "@/data/serial-numbers"

const SERIALS_COLLECTION = "serialNumbers"
const BATCHES_COLLECTION = "serialBatches"
const COUNTERS_COLLECTION = "serialCounters"

/** Firestore allows 500 writes per batch, so serial writes are chunked well below that. */
const SERIAL_WRITE_CHUNK_SIZE = 400

const toCustomError = (message: string) => ({
  status: "CUSTOM_ERROR" as const,
  error: message,
  data: message,
})

/**
 * Firestore answers a missing composite index and a rejected request with codes
 * that are easy to misread, so they are expanded into something actionable.
 */
const describeFirestoreError = (error: any, fallback: string): string => {
  switch (error?.code) {
    case "permission-denied":
      return "Firestore denied this request. Confirm you are signed in and that the deployed Firestore rules allow authenticated users."
    case "failed-precondition":
      return error?.message?.includes("index")
        ? "This query needs a Firestore composite index. Create it from the link in the browser console."
        : error?.message || fallback
    case "unavailable":
      return "Firestore is unreachable. Check your connection and try again."
    default:
      return error?.message || fallback
  }
}

/**
 * Firestore `Timestamp` instances are not serializable, so RTK Query refuses to
 * cache them. Every timestamp crosses into the store as an ISO string instead.
 */
const toIsoString = (value: any): string | undefined => {
  if (!value) return undefined
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

const convertToSerialNumber = (docData: any, id: string): SerialNumber => ({
  id,
  serial: docData.serial || id,
  year: Number(docData.year) || 0,
  sequence: Number(docData.sequence) || 0,
  status: (docData.status as SerialStatus) || "available",
  batchId: docData.batchId || "",
  createdAt: toIsoString(docData.createdAt),
  createdBy: docData.createdBy || "",
  voidedAt: toIsoString(docData.voidedAt),
  voidedBy: docData.voidedBy,
  voidReason: docData.voidReason,
  linkedAt: toIsoString(docData.linkedAt),
  linkedByEmployeeId: docData.linkedByEmployeeId,
  linkedByEmployeeName: docData.linkedByEmployeeName,
  linkedOrderId: docData.linkedOrderId,
  linkedOrderLabel: docData.linkedOrderLabel,
})

const convertToSerialBatch = (docData: any, id: string): SerialBatch => ({
  id,
  year: Number(docData.year) || 0,
  count: Number(docData.count) || 0,
  fromSerial: docData.fromSerial || "",
  toSerial: docData.toSerial || "",
  fromSequence: Number(docData.fromSequence) || 0,
  toSequence: Number(docData.toSequence) || 0,
  createdAt: toIsoString(docData.createdAt),
  createdBy: docData.createdBy || "",
})

/**
 * Every document-id prefix the admin's input could plausibly mean.
 *
 * Document ids are the serials themselves, so each candidate is turned into an
 * index-backed prefix range scan — no collection scan and no false negatives.
 * Short input is genuinely ambiguous ("2026-12" could be serial 000012 or any
 * serial whose digits start with 12), so ambiguous cases return both readings
 * and the caller merges them.
 */
function toSerialIdPrefixes(input: string): string[] {
  let cleaned = input.trim().toUpperCase().replace(/[\s_]+/g, "")
  const hadExplicitPrefix = cleaned.startsWith(SERIAL_PREFIX)
  if (hadExplicitPrefix) {
    cleaned = cleaned.slice(SERIAL_PREFIX.length)
  }
  cleaned = cleaned.replace(/^-+/, "")

  if (!cleaned) return [`${SERIAL_PREFIX}-`]
  // Anything non-numeric is taken as a literal prefix, e.g. "ROG-AB".
  if (!/^[\d-]+$/.test(cleaned)) return [`${SERIAL_PREFIX}-${cleaned}`]

  const yearOnly = cleaned.match(/^(\d{4})$/)
  if (yearOnly) return [`${SERIAL_PREFIX}-${yearOnly[1]}-`]

  // "ROG2026012" — an explicit brand prefix makes a split year/sequence reading
  // unambiguous, so unlike a bare "202612" it is safe to read that way.
  const brandedCompact = cleaned.match(/^(\d{4})(\d{1,6})$/)
  if (brandedCompact && hadExplicitPrefix) {
    return [
      `${SERIAL_PREFIX}-${brandedCompact[1]}-${brandedCompact[2].padStart(SERIAL_SEQUENCE_LENGTH, "0")}`,
      `${SERIAL_PREFIX}-${brandedCompact[1]}-${brandedCompact[2]}`,
    ]
  }

  const yearAndSequence = cleaned.match(/^(\d{4})-(\d{1,6})$/)
  if (yearAndSequence) {
    const [, year, tail] = yearAndSequence
    // Six digits is a complete sequence, so there is nothing else to try.
    if (tail.length === SERIAL_SEQUENCE_LENGTH) return [`${SERIAL_PREFIX}-${year}-${tail}`]
    return [
      `${SERIAL_PREFIX}-${year}-${tail.padStart(SERIAL_SEQUENCE_LENGTH, "0")}`,
      `${SERIAL_PREFIX}-${year}-${tail}`,
    ]
  }

  // "2026012" style — at least three sequence digits, so it cannot collide with
  // the bare 1-6 digit form below.
  const compactYearAndSequence = cleaned.match(/^(\d{4})(\d{3,6})$/)
  if (compactYearAndSequence) {
    return [`${SERIAL_PREFIX}-${compactYearAndSequence[1]}-${compactYearAndSequence[2].padStart(SERIAL_SEQUENCE_LENGTH, "0")}`]
  }

  // Bare digits are read as a sequence in the current year, which is what an
  // admin transcribing the tail of a sticker actually means.
  const bareSequence = cleaned.match(/^(\d{1,6})$/)
  if (bareSequence) {
    return [
      `${SERIAL_PREFIX}-${getCurrentSerialYear()}-${bareSequence[1].padStart(SERIAL_SEQUENCE_LENGTH, "0")}`,
    ]
  }

  return [`${SERIAL_PREFIX}-${cleaned}`]
}

export const serialNumbersApi = createApi({
  reducerPath: "serialNumbersApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["SerialNumbers", "SerialBatches", "Bookings"],
  endpoints: (builder) => ({
    getSerials: builder.query<
      SerialListResponse,
      { status?: SerialStatus | "all"; search?: string; batchId?: string } | void
    >({
      queryFn: async (args) => {
        try {
          await ensureFirebaseAuth()
          const status = args?.status ?? "all"
          const search = args?.search ?? ""
          const batchId = args?.batchId ?? ""
          const year = getCurrentSerialYear()
          const serialsRef = collection(db, SERIALS_COLLECTION)

          const isSearch = !batchId && !!search.trim()
          const isUnfiltered = !isSearch && !batchId && status === "all"

          // Each of these is an index-backed query; none of them scan the collection.
          const serialQueries = isSearch
            ? toSerialIdPrefixes(search).map((prefix) =>
                query(
                  serialsRef,
                  orderBy(documentId()),
                  startAt(prefix),
                  // U+F8FF sits above every character a serial can contain, so this
                  // is a true "starts with" range.
                  endAt(`${prefix}`),
                  fbLimit(200)
                )
              )
            : [
                batchId
                  ? query(
                      serialsRef,
                      where("batchId", "==", batchId),
                      orderBy("sequence", "asc"),
                      fbLimit(MAX_SERIAL_BATCH_SIZE)
                    )
                  : status !== "all"
                    ? query(
                        serialsRef,
                        where("status", "==", status),
                        orderBy("year", "desc"),
                        orderBy("sequence", "desc"),
                        fbLimit(SERIAL_LIST_MAX)
                      )
                    : query(
                        serialsRef,
                        orderBy("year", "desc"),
                        orderBy("sequence", "desc"),
                        // One extra row signals that the list is a recent window.
                        fbLimit(SERIAL_LIST_MAX + 1)
                      ),
              ]

          const [serialSnapshots, batchSnapshot, counterSnapshot] = await Promise.all([
            Promise.all(serialQueries.map((q) => getDocs(q))),
            getDocs(
              query(
                collection(db, BATCHES_COLLECTION),
                orderBy("year", "desc"),
                orderBy("fromSequence", "desc"),
                fbLimit(50)
              )
            ),
            getDoc(doc(db, COUNTERS_COLLECTION, String(year))),
          ])

          // Overlapping prefixes can return the same document twice.
          const seen = new Set<string>()
          const docs = serialSnapshots
            .flatMap((snapshot) => snapshot.docs)
            .filter((d) => {
              if (seen.has(d.id)) return false
              seen.add(d.id)
              return true
            })
            .sort((a, b) => (Number(b.data().year) || 0) - (Number(a.data().year) || 0) || (Number(b.data().sequence) || 0) - (Number(a.data().sequence) || 0))

          return {
            data: {
              serials: docs.map((d) => convertToSerialNumber(d.data(), d.id)),
              batches: batchSnapshot.docs.map((d) => convertToSerialBatch(d.data(), d.id)),
              nextSequence: (counterSnapshot.exists() ? Number(counterSnapshot.data()?.lastSequence) : 0) || 0,
              year,
              truncated: isUnfiltered && docs.length > SERIAL_LIST_MAX,
            },
          }
        } catch (error: any) {
          console.error("Error fetching serials:", error)
          return { error: toCustomError(describeFirestoreError(error, "Failed to fetch serials")) }
        }
      },
      providesTags: ["SerialNumbers"],
    }),

    /**
     * Two-phase allocation.
     *
     * 1. A transaction bumps the per-year counter and hands back the reserved range.
     *    This is the only place a sequence is ever allocated, so concurrent admins
     *    can never receive overlapping numbers.
     * 2. The reserved range is written as documents in chunks. Document ids are the
     *    serials, so a retried or partially-failed write can only ever overwrite the
     *    same document — it can never mint a duplicate.
     *
     * A failure in phase 2 burns numbers but never duplicates them, which is the
     * right trade-off: gaps in a serial run are harmless, collisions are not.
     */
    generateSerials: builder.mutation<
      { success: boolean; batchId: string; fromSerial: string; toSerial: string; serials: string[] },
      { count: number; note?: string }
    >({
      queryFn: async ({ count, note }) => {
        try {
          const user = await ensureFirebaseAuth()
          const size = Math.trunc(Number(count))
          if (!Number.isFinite(size) || size < MIN_SERIAL_BATCH_SIZE || size > MAX_SERIAL_BATCH_SIZE) {
            return {
              error: toCustomError(
                `Enter a quantity between ${MIN_SERIAL_BATCH_SIZE} and ${MAX_SERIAL_BATCH_SIZE}.`
              ),
            }
          }

          const year = getCurrentSerialYear()
          const createdBy = user.uid
          const counterRef = doc(db, COUNTERS_COLLECTION, String(year))

          const reserved = await runTransaction(db, async (tx) => {
            const counterSnapshot = await tx.get(counterRef)
            const last = counterSnapshot.exists()
              ? Number(counterSnapshot.data()?.lastSequence) || 0
              : 0
            const from = last + 1
            const to = last + size
            tx.set(
              counterRef,
              { year, lastSequence: to, updatedAt: serverTimestamp() },
              { merge: true }
            )
            return { from, to }
          })

          const serials: string[] = []
          for (let seq = reserved.from; seq <= reserved.to; seq++) {
            serials.push(formatSerial(year, seq))
          }

          const batchId = doc(collection(db, BATCHES_COLLECTION)).id

          // Recorded before the serials so a mid-way failure still leaves a trace.
          await setDoc(doc(db, BATCHES_COLLECTION, batchId), {
            year,
            count: size,
            fromSerial: serials[0],
            toSerial: serials[serials.length - 1],
            fromSequence: reserved.from,
            toSequence: reserved.to,
            note: note?.trim() || "",
            createdAt: serverTimestamp(),
            createdBy,
          })

          for (let offset = 0; offset < serials.length; offset += SERIAL_WRITE_CHUNK_SIZE) {
            const chunk = serials.slice(offset, offset + SERIAL_WRITE_CHUNK_SIZE)
            const batch = writeBatch(db)
            chunk.forEach((serial, indexInChunk) => {
              batch.set(doc(db, SERIALS_COLLECTION, serial), {
                serial,
                year,
                sequence: reserved.from + offset + indexInChunk,
                status: "available",
                batchId,
                createdAt: serverTimestamp(),
                createdBy,
              })
            })
            await batch.commit()
          }

          return {
            data: {
              success: true,
              batchId,
              fromSerial: serials[0],
              toSerial: serials[serials.length - 1],
              serials,
            },
          }
        } catch (error: any) {
          console.error("Error generating serials:", error)
          return { error: toCustomError(describeFirestoreError(error, "Failed to generate serials")) }
        }
      },
      invalidatesTags: ["SerialNumbers", "SerialBatches"],
    }),

    /**
     * Links a serial to an order, in one transaction across both documents.
     *
     * The serial document is the authority on whether a number is still usable,
     * so it is re-read inside the transaction rather than trusted from the UI.
     * That read is also what makes this safe against the employee app, which
     * links serials through its own Admin SDK route: two concurrent links both
     * read "available", only one commits, and the loser's write is rejected by
     * Firestore's optimistic concurrency check.
     *
     * The booking is written in the same transaction so an order can never show
     * a serial that the serial collection does not agree with.
     *
     * `replaceExisting` is the recovery path for a mis-scanned sticker. The old
     * serial cannot simply be voided first, because a linked serial is refused
     * by voidSerial — that refusal is what stops a serial being pulled off an
     * order that still has it. So the swap releases the old number back to
     * "available" in this same transaction instead, and that number becomes
     * linkable again.
     */
    linkSerialToOrder: builder.mutation<
      { success: boolean; serial: string; orderId: string; replacedSerial?: string | null },
      { serial: string; orderId: string; linkedByName?: string; replaceExisting?: boolean }
    >({
      queryFn: async ({ serial, orderId, linkedByName, replaceExisting }) => {
        try {
          const user = await ensureFirebaseAuth()
          const canonical = normalizeSerialInput(serial)
          if (!canonical) {
            return {
              error: toCustomError(
                "That is not a valid serial number. Use the full form, e.g. ROG-2026-000123."
              ),
            }
          }
          if (!orderId) {
            return { error: toCustomError("Order is required.") }
          }

          const serialRef = doc(db, SERIALS_COLLECTION, canonical)
          const bookingRef = doc(db, "bookings", orderId)
          const linkedBy = user.uid

          const outcome = await runTransaction(db, async (tx) => {
            const [serialSnap, bookingSnap] = await Promise.all([
              tx.get(serialRef),
              tx.get(bookingRef),
            ])

            if (!serialSnap.exists()) {
              return { error: "Serial not found in the database." }
            }
            if (!bookingSnap.exists()) {
              return { error: "Order not found." }
            }

            const serialData = serialSnap.data() as Record<string, any>
            const bookingData = bookingSnap.data() as Record<string, any>

            if (serialData.status === "void") {
              return { error: "This serial has been voided and can never be used." }
            }
            if (serialData.status === "linked") {
              return { error: "This serial is already linked to another order." }
            }

            const currentSerial =
              typeof bookingData.serialNumber === "string" ? bookingData.serialNumber.trim() : ""
            const isReplacing = !!currentSerial && currentSerial !== canonical

            if (isReplacing && !replaceExisting) {
              return {
                error: `This order already has serial ${currentSerial} linked.`,
              }
            }

            // Firestore requires every read to precede every write, so the serial
            // being released is read before anything is written.
            const previousRef = isReplacing ? doc(db, SERIALS_COLLECTION, currentSerial) : null
            const previousSnap = previousRef ? await tx.get(previousRef) : null

            const now = serverTimestamp()
            const orderLabel = String(bookingData.bookingId || orderId)

            // A serial can only be released if it is still linked to this order.
            // If it moved on in the meantime the swap is refused rather than
            // handing a live number back to the pool.
            if (isReplacing && previousSnap?.exists()) {
              const previousData = previousSnap.data() as Record<string, any>
              if (previousData.status !== "linked" || previousData.linkedOrderId !== orderId) {
                return {
                  error: `Serial ${currentSerial} is no longer linked to this order, so it cannot be replaced automatically. Reload the order and try again.`,
                }
              }
              tx.update(previousRef!, {
                status: "available",
                linkedAt: deleteField(),
                linkedOrderId: deleteField(),
                linkedOrderLabel: deleteField(),
                linkedByEmployeeId: deleteField(),
                linkedByEmployeeName: deleteField(),
                linkedByAdmin: deleteField(),
                unlinkedAt: now,
                unlinkedFromOrderId: orderId,
                unlinkedBy: linkedBy,
                updatedAt: now,
              })
            }

            tx.update(serialRef, {
              status: "linked",
              linkedAt: now,
              linkedOrderId: orderId,
              linkedOrderLabel: orderLabel,
              linkedByEmployeeId: linkedBy,
              linkedByEmployeeName: linkedByName || linkedBy,
              linkedByAdmin: true,
            })
            tx.update(bookingRef, {
              serialNumber: canonical,
              serialLinkedAt: now,
              serialLinkedBy: linkedBy,
              serialLinkedByName: linkedByName || linkedBy,
              updatedAt: now,
            })

            return { error: null as string | null, replacedSerial: isReplacing ? currentSerial : null }
          })

          if (outcome.error) return { error: toCustomError(outcome.error) }

          return {
            data: {
              success: true,
              serial: canonical,
              orderId,
              replacedSerial: outcome.replacedSerial,
            },
          }
        } catch (error: any) {
          console.error("Error linking serial to order:", error)
          return {
            error: toCustomError(
              describeFirestoreError(error, "Failed to link serial to order")
            ),
          }
        }
      },
      invalidatesTags: ["SerialNumbers", "SerialBatches", "Bookings"],
    }),

    /**
     * Voiding re-reads the serial inside a transaction so a serial cannot be voided
     * at the same moment an employee is linking it to an order.
     * Voided numbers are never returned to the available pool.
     */
    voidSerial: builder.mutation<{ success: boolean }, { serial: string; reason?: string }>({
      queryFn: async ({ serial, reason }) => {
        try {
          const user = await ensureFirebaseAuth()
          const serialRef = doc(db, SERIALS_COLLECTION, serial)
          const voidedBy = user.uid

          const outcome = await runTransaction(db, async (tx) => {
            const snap = await tx.get(serialRef)
            if (!snap.exists()) return { error: "Serial not found in the database." }
            const data = snap.data()
            if (data.status === "void") return { error: "This serial is already voided." }
            if (data.status === "linked") {
              return { error: "This serial is already linked to an order and cannot be voided." }
            }
            tx.update(serialRef, {
              status: "void",
              voidedAt: serverTimestamp(),
              voidedBy,
              voidReason: reason?.trim() || "",
            })
            return { error: null as string | null }
          })

          if (outcome.error) return { error: toCustomError(outcome.error) }

          return { data: { success: true } }
        } catch (error: any) {
          console.error("Error voiding serial:", error)
          return { error: toCustomError(describeFirestoreError(error, "Failed to void serial")) }
        }
      },
      invalidatesTags: ["SerialNumbers", "SerialBatches"],
    }),
  }),
})

export const {
  useGetSerialsQuery,
  useGenerateSerialsMutation,
  useLinkSerialToOrderMutation,
  useVoidSerialMutation,
} = serialNumbersApi
