import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, Timestamp, deleteField, query, where, setDoc, serverTimestamp } from "firebase/firestore"
import { db, storage } from "@/lib/firebase/config"
import { ref, deleteObject } from "firebase/storage"
import type { Order } from "@/data/orders"

const REVIEW_ELIGIBILITY_COLLECTION = "reviewEligibility"

export interface BookingsResponse {
  bookings: Order[]
  total: number
}

export interface BookingResponse {
  booking: Order | null
}

/** User ke liye woh categories jahan wo review de sakta hai (sirf jahan koi order Delivered hai) */
export interface ReviewEligibleCategoriesResponse {
  categoryIds: string[]
  categories: { categoryId: string; categoryName: string }[]
}

// Helper function to convert Firestore timestamp to date string with time
const convertTimestamp = (timestamp: any): string => {
  if (!timestamp) return new Date().toISOString()

  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString()
  }

  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString()
  }

  if (typeof timestamp === "string") {
    try {
      const date = new Date(timestamp)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
    } catch (e) {}
    return timestamp
  }

  return new Date().toISOString()
}

// Helper to convert Firestore timestamp to full ISO string (for statusTimestamps)
const timestampToISO = (timestamp: any): string | undefined => {
  if (!timestamp) return undefined
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString()
  }
  if (timestamp?.seconds != null) {
    return new Date(timestamp.seconds * 1000).toISOString()
  }
  if (typeof timestamp === "string") {
    try {
      const date = new Date(timestamp)
      return isNaN(date.getTime()) ? undefined : date.toISOString()
    } catch (e) {}
  }
  return undefined
}

// Helper function to map payment method from Firebase to Order type
const mapPaymentMethod = (paymentMethod: string): "UPI" | "Cash" | "Card" => {
  const method = paymentMethod?.toLowerCase() || ""
  if (method === "cod" || method === "cash") {
    return "Cash"
  }
  if (method === "upi" || method === "wallet") {
    return "UPI"
  }
  if (method === "card" || method === "credit" || method === "debit") {
    return "Card"
  }
  return "Cash" // Default to Cash
}

// Helper function to map payment status based on payment method
const mapPaymentStatus = (paymentMethod: string): "pending" | "paid" | "cash" => {
  const method = paymentMethod?.toLowerCase() || ""
  if (method === "cod") {
    return "pending"
  }
  if (method === "cash") {
    return "cash"
  }
  return "paid" // For UPI, Card, etc.
}

// Helper function to map status from Firebase to Order type
const mapStatus = (status: string): Order["status"] => {
  const statusLower = status?.toLowerCase() || "pending"
  
  // Map Firebase status to Order status
  const statusMap: Record<string, Order["status"]> = {
    pending: "booked",
    booked: "booked",
    confirmed: "confirmed",
    picked: "picked",
    servicecenter: "serviceCenter",
    "service-center": "serviceCenter",
    repair: "repair",
    outfordelivery: "outForDelivery",
    "out-for-delivery": "outForDelivery",
    delivered: "delivered",
    cancelled: "cancelled",
  }

  return statusMap[statusLower] || "booked"
}

// Helper function to convert Firestore document to Order
const convertFirestoreDocToOrder = (docData: any, docId: string): Order => {
  // Get customer name from address or use customerId
  const customerName = docData.address?.fullName || "Unknown Customer"
  
  // Get mobile number from address
  const mobileNumber = docData.address?.phone || ""
  
  // Get category name
  const category = docData.categoryName || "Unknown"
  
  // Get amount
  const amount = docData.amount || 0
  
  // Map payment method and status
  const paymentMethod = mapPaymentMethod(docData.paymentMethod)
  const paymentStatus = mapPaymentStatus(docData.paymentMethod)
  
  // Map status
  const status = mapStatus(docData.status)
  
  // Get date from createdAt
  const date = convertTimestamp(docData.createdAt)
  
  // Get images array
  const images = docData.images || []
  
  // Get audio URL
  const audioRecording = docData.audioUrl || undefined
  
  // Get description
  const textDescription = docData.description || undefined

  // Get service reason and amount
  const serviceReason = docData.serviceReason || undefined
  const serviceAmount = docData.serviceAmount || undefined

  // Get cancelledAtStatus
  const cancelledAtStatus = docData.cancelledAtStatus || undefined

  // Build statusTimestamps: each status -> when it was set (ISO string)
  const statusTimestamps: Record<string, string> = {}
  const rawStatusTimestamps = docData.statusTimestamps || {}
  for (const [key, value] of Object.entries(rawStatusTimestamps)) {
    const iso = timestampToISO(value)
    if (iso) statusTimestamps[key] = iso
  }
  // "booked" = createdAt if not already in statusTimestamps (backward compatibility)
  const createdAtIso = docData.createdAt ? timestampToISO(docData.createdAt) : undefined
  if (!statusTimestamps.booked && createdAtIso) {
    statusTimestamps.booked = createdAtIso
  }

  // When user books with payment paid, status is set directly to "confirmed" — same date/time for Booked & Confirmed
  const confirmedOrLater = ["confirmed", "picked", "serviceCenter", "repair", "outForDelivery", "delivered"]
  if (!statusTimestamps.confirmed && confirmedOrLater.includes(status) && createdAtIso) {
    statusTimestamps.confirmed = createdAtIso
  }

  const updatedAt = timestampToISO(docData.updatedAt) || undefined

  return {
    id: docId || "",
    bookingId: docData.bookingId || docId || "",
    cancellationMessage: docData.cancellationMessage || "",
    customerUid: docData.customerUid || "",
    customer: customerName,
    service: textDescription || category, // Use description as service or fallback to category
    mobileNumber: mobileNumber,
    paymentStatus: paymentStatus,
    paymentMethod: paymentMethod,
    category: category,
    amount: amount,
    status: status,
    date: date,
    statusTimestamps: Object.keys(statusTimestamps).length > 0 ? statusTimestamps : undefined,
    updatedAt,
    images: images.length > 0 ? images : undefined,
    audioRecording: audioRecording,
    textDescription: textDescription,
    serviceReason: serviceReason,
    serviceAmount: serviceAmount,
    cancelledAtStatus: cancelledAtStatus,
  }
}

// --- reviewEligibility collection: user -> categories jahan review de sakta hai ---

/** Bookings se compute karo: is user ke kaun se categories delivered hai */
async function computeEligibleCategoriesFromBookings(customerUid: string): Promise<ReviewEligibleCategoriesResponse> {
  const bookingsRef = collection(db, "bookings")
  const q = query(
    bookingsRef,
    where("customerUid", "==", customerUid.trim()),
    where("status", "==", "delivered")
  )
  const snapshot = await getDocs(q)
  const seen = new Set<string>()
  const categories: { categoryId: string; categoryName: string }[] = []
  snapshot.docs.forEach((docSnap) => {
    const d = docSnap.data()
    const categoryId = (d.categoryId ?? "").toString().trim()
    const categoryName = (d.categoryName ?? "Unknown").toString().trim()
    if (!categoryId || seen.has(categoryId)) return
    seen.add(categoryId)
    categories.push({ categoryId, categoryName })
  })
  return { categoryIds: categories.map((c) => c.categoryId), categories }
}

/** reviewEligibility collection mein is user ka doc update karo (bookings se compute karke) */
async function syncReviewEligibilityForUser(customerUid: string): Promise<void> {
  const { categories } = await computeEligibleCategoriesFromBookings(customerUid)
  const ref = doc(db, REVIEW_ELIGIBILITY_COLLECTION, customerUid)
  await setDoc(ref, {
    eligibleCategories: categories,
    updatedAt: serverTimestamp(),
  })
}

export const bookingsApi = createApi({
  reducerPath: "bookingsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Bookings", "ReviewEligibility"],
  endpoints: (builder) => ({
    getBookings: builder.query<BookingsResponse, void>({
      queryFn: async () => {
        try {
          const bookingsRef = collection(db, "bookings")
          const querySnapshot = await getDocs(bookingsRef)

          const bookings: Order[] = querySnapshot.docs.map((docSnapshot) => {
            const docData = docSnapshot.data()
            return convertFirestoreDocToOrder(docData, docSnapshot.id)
          })

          // Sort by date descending (newest first)
          bookings.sort((a, b) => {
            const dateA = new Date(a.date).getTime()
            const dateB = new Date(b.date).getTime()
            return dateB - dateA
          })
          return {
            data: {
              bookings,
              total: bookings.length,
            },
          }
        } catch (error: any) {
          console.error("❌ Error fetching bookings:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch bookings",
              data: error.message || "Failed to fetch bookings",
            },
          }
        }
      },
      providesTags: ["Bookings"],
    }),
    getBookingById: builder.query<BookingResponse, string>({
      queryFn: async (bookingId: string) => {
        try {
          // First try to find by bookingId field
          const bookingsRef = collection(db, "bookings")
          const querySnapshot = await getDocs(bookingsRef)
          
          let bookingDoc = null
          for (const docSnapshot of querySnapshot.docs) {
            const docData = docSnapshot.data()
            if (docData.bookingId === bookingId || docSnapshot.id === bookingId) {
              bookingDoc = { id: docSnapshot.id, data: docData }
              break
            }
          }

          if (!bookingDoc) {
            // Try by document ID as fallback
            try {
              const bookingDocRef = doc(db, "bookings", bookingId)
              const docSnap = await getDoc(bookingDocRef)
              if (docSnap.exists()) {
                bookingDoc = { id: docSnap.id, data: docSnap.data() }
              }
            } catch (e) {
              // Document doesn't exist
            }
          }

          if (!bookingDoc) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Booking not found",
                data: "Booking not found",
              },
            }
          }

          const order = convertFirestoreDocToOrder(bookingDoc.data, bookingDoc.id)

          return {
            data: {
              booking: order,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error fetching booking ${bookingId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch booking",
              data: error.message || "Failed to fetch booking",
            },
          }
        }
      },
      providesTags: (result, error, bookingId) => [{ type: "Bookings", id: bookingId }],
    }),
    /**
     * reviewEligibility collection se: is user ke liye kaun si categories mein review de sakta hai.
     * Agar doc nahi hai toh pehle bookings se compute karke collection mein likhenge, phir return.
     */
    getReviewEligibleCategories: builder.query<ReviewEligibleCategoriesResponse, string>({
      queryFn: async (customerUid: string) => {
        try {
          if (!customerUid?.trim()) {
            return { data: { categoryIds: [], categories: [] } }
          }
          const uid = customerUid.trim()
          const ref = doc(db, REVIEW_ELIGIBILITY_COLLECTION, uid)
          let snap = await getDoc(ref)
          if (!snap.exists()) {
            await syncReviewEligibilityForUser(uid)
            snap = await getDoc(ref)
          }
          const data = snap.data()
          const categories = Array.isArray(data?.eligibleCategories) ? data.eligibleCategories : []
          const categoryIds = categories.map((c: { categoryId?: string }) => (c?.categoryId ?? "").trim()).filter(Boolean)
          return {
            data: { categoryIds, categories },
          }
        } catch (error: any) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch review-eligible categories",
              data: error.message,
            },
          }
        }
      },
      providesTags: (result, error, customerUid) =>
        result ? [{ type: "ReviewEligibility", id: customerUid }] : [],
    }),
    getBookingsByCustomerId: builder.query<BookingsResponse, string>({
      queryFn: async (customerId: string) => {
        try {
          console.log(`🔥 Fetching bookings for customer ${customerId} from Firestore...`)
          
          const bookingsRef = collection(db, "bookings")
          const q = query(bookingsRef, where("customerId", "==", customerId))
          const querySnapshot = await getDocs(q)
          
          const bookings: Order[] = []
          querySnapshot.forEach((doc) => {
            const bookingData = convertFirestoreDocToOrder(doc.data(), doc.id)
            bookings.push(bookingData)
          })
          
          console.log(`✅ Found ${bookings.length} bookings for customer ${customerId}`)
          
          return {
            data: {
              bookings,
              total: bookings.length,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error fetching bookings for customer ${customerId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch customer bookings",
              data: error.message || "Failed to fetch customer bookings",
            },
          }
        }
      },
      providesTags: ["Bookings"],
    }),
    updateBooking: builder.mutation<
      { success: boolean; message: string },
      { bookingId: string; updates: { status?: string; serviceReason?: string; serviceAmount?: number; cancelledAtStatus?: string } }
    >({
      queryFn: async ({ bookingId, updates }) => {
        try {
          console.log(`🔥 Updating booking ${bookingId} in Firestore...`, updates)

          // Find the booking document by bookingId or document ID
          const bookingsRef = collection(db, "bookings")
          const querySnapshot = await getDocs(bookingsRef)
          let bookingDocRef: ReturnType<typeof doc> | null = null
          let customerUidForSync: string | null = null

          for (const docSnapshot of querySnapshot.docs) {
            const docData = docSnapshot.data()
            if (docData.bookingId === bookingId || docSnapshot.id === bookingId) {
              bookingDocRef = doc(db, "bookings", docSnapshot.id)
              customerUidForSync = (docData.customerUid ?? "").toString().trim() || null
              break
            }
          }

          if (!bookingDocRef) {
            try {
              const docRef = doc(db, "bookings", bookingId)
              const docSnap = await getDoc(docRef)
              if (docSnap.exists()) {
                bookingDocRef = docRef
                const d = docSnap.data()
                customerUidForSync = (d?.customerUid ?? "").toString().trim() || null
              }
            } catch (e) {
              // Document doesn't exist
            }
          }

          if (!bookingDocRef) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Booking not found",
                data: "Booking not found",
              },
            }
          }

          // Prepare update data - map status to Firebase format if needed
          const updateData: any = {}
          
          if (updates.status !== undefined) {
            const statusMap: Record<string, string> = {
              booked: "booked",
              confirmed: "confirmed",
              picked: "picked",
              serviceCenter: "serviceCenter",
              repair: "repair",
              outForDelivery: "outForDelivery",
              delivered: "delivered",
              cancelled: "cancelled",
            }
            const firebaseStatus = statusMap[updates.status] || updates.status
            updateData.status = firebaseStatus
            updateData.updatedAt = serverTimestamp()

            const statusStepsOrder = ["booked", "confirmed", "picked", "serviceCenter", "repair", "outForDelivery", "delivered"]

            if (firebaseStatus === "cancelled") {
              updateData["statusTimestamps.cancelled"] = serverTimestamp()
            } else {
              // Get current status from document to know how many steps were skipped
              const docSnap = await getDoc(bookingDocRef)
              const currentStatus = (docSnap.data()?.status as string) ?? "booked"
              const currentIndex = statusStepsOrder.indexOf(currentStatus)
              const newIndex = statusStepsOrder.indexOf(firebaseStatus)

              // Set timestamp for new status AND all in-between steps (same update time for skipped steps)
              if (newIndex > currentIndex) {
                for (let i = currentIndex + 1; i <= newIndex; i++) {
                  updateData[`statusTimestamps.${statusStepsOrder[i]}`] = serverTimestamp()
                }
              } else {
                updateData[`statusTimestamps.${firebaseStatus}`] = serverTimestamp()
              }
            }
          }

          if (updates.serviceReason !== undefined) {
            // If null/empty, delete the field; otherwise update it
            if (updates.serviceReason === null || updates.serviceReason === "") {
              updateData.serviceReason = deleteField()
            } else {
              updateData.serviceReason = updates.serviceReason
            }
          }

          if (updates.serviceAmount !== undefined) {
            // If null/0/empty, delete the field; otherwise update it
            if (updates.serviceAmount === null || updates.serviceAmount === 0) {
              updateData.serviceAmount = deleteField()
            } else {
              updateData.serviceAmount = updates.serviceAmount
            }
          }

          if (updates.cancelledAtStatus !== undefined) {
            updateData.cancelledAtStatus = updates.cancelledAtStatus
          }

          await updateDoc(bookingDocRef, updateData)

          // Status change hone par reviewEligibility collection sync karo (user ka "review de sakta hai" list)
          if (updates.status !== undefined && customerUidForSync) {
            try {
              await syncReviewEligibilityForUser(customerUidForSync)
            } catch (syncErr: any) {
              console.warn("⚠️ reviewEligibility sync failed:", syncErr)
            }
          }

          console.log(`✅ Successfully updated booking ${bookingId}`)

          return {
            data: {
              success: true,
              message: "Booking updated successfully",
            },
          }
        } catch (error: any) {
          console.error(`❌ Error updating booking ${bookingId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to update booking",
              data: error.message || "Failed to update booking",
            },
          }
        }
      },
      invalidatesTags: (result, error) => [
        { type: "Bookings" },
        { type: "ReviewEligibility" },
      ],
    }),
    deleteBooking: builder.mutation<
      { success: boolean; message: string },
      { bookingId: string }
    >({
      queryFn: async ({ bookingId }) => {
        try {
          console.log(`🔥 Deleting booking ${bookingId} from Firestore...`)

          // Find the booking document by bookingId or document ID
          const bookingsRef = collection(db, "bookings")
          const querySnapshot = await getDocs(bookingsRef)
          let bookingDocRef: ReturnType<typeof doc> | null = null
          let bookingData: any = null
          let customerUidForSync: string | null = null

          for (const docSnapshot of querySnapshot.docs) {
            const data = docSnapshot.data()
            if (data.bookingId === bookingId || docSnapshot.id === bookingId) {
              bookingDocRef = doc(db, "bookings", docSnapshot.id)
              bookingData = data
              customerUidForSync = (data.customerUid ?? "").toString().trim() || null
              break
            }
          }

          if (!bookingDocRef) {
            try {
              const docRef = doc(db, "bookings", bookingId)
              const docSnap = await getDoc(docRef)
              if (docSnap.exists()) {
                bookingDocRef = docRef
                bookingData = docSnap.data()
                customerUidForSync = (bookingData?.customerUid ?? "").toString().trim() || null
              }
            } catch (e) {
              // Document doesn't exist
            }
          }

          if (!bookingDocRef || !bookingData) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Booking not found",
                data: "Booking not found",
              },
            }
          }

          // Helper function to extract file path from Firebase Storage URL
          const extractFilePath = (url: string): string | null => {
            try {
              // Firebase Storage URLs typically look like:
              // https://firebasestorage.googleapis.com/v0/b/BUCKET_NAME/o/PATH?token=TOKEN
              // We need to extract the PATH part and decode it
              const urlObj = new URL(url)
              const pathWithToken = urlObj.pathname.split('/o/')[1]
              if (!pathWithToken) return null
              
              // Remove the token parameter and decode URL encoding
              const path = pathWithToken.split('?')[0]
              return decodeURIComponent(path)
            } catch (error) {
              console.warn(`⚠️ Failed to extract path from URL: ${url}`, error)
              return null
            }
          }

          // Delete images from Firebase Storage if they exist
          if (bookingData.images && Array.isArray(bookingData.images)) {
            for (const imageUrl of bookingData.images) {
              try {
                const filePath = extractFilePath(imageUrl)
                if (filePath && storage) {
                  const imageRef = ref(storage, filePath)
                  await deleteObject(imageRef)
                  console.log(`✅ Deleted image: ${filePath}`)
                } else {
                  console.warn(`⚠️ Could not extract path for image: ${imageUrl}`)
                }
              } catch (error: any) {
                console.warn(`⚠️ Failed to delete image ${imageUrl}:`, error.message)
                // Continue with deletion even if image deletion fails
              }
            }
          }

          // Delete audio file from Firebase Storage if it exists
          if (bookingData.audioUrl) {
            try {
              const filePath = extractFilePath(bookingData.audioUrl)
              if (filePath && storage) {
                const audioRef = ref(storage, filePath)
                await deleteObject(audioRef)
                console.log(`✅ Deleted audio: ${filePath}`)
              } else {
                console.warn(`⚠️ Could not extract path for audio: ${bookingData.audioUrl}`)
              }
            } catch (error: any) {
              console.warn(`⚠️ Failed to delete audio ${bookingData.audioUrl}:`, error.message)
              // Continue with deletion even if audio deletion fails
            }
          }

          // Delete the Firestore document
          await deleteDoc(bookingDocRef)

          // Sync reviewEligibility collection after deletion
          if (customerUidForSync) {
            try {
              await syncReviewEligibilityForUser(customerUidForSync)
            } catch (syncErr: any) {
              console.warn("⚠️ reviewEligibility sync failed:", syncErr)
            }
          }

          console.log(`✅ Successfully deleted booking ${bookingId}`)

          return {
            data: {
              success: true,
              message: "Booking deleted successfully",
            },
          }
        } catch (error: any) {
          console.error(`❌ Error deleting booking ${bookingId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to delete booking",
              data: error.message || "Failed to delete booking",
            },
          }
        }
      },
      invalidatesTags: (result, error) => [
        { type: "Bookings" },
        { type: "ReviewEligibility" },
      ],
    }),
  }),
})


export const {
  useGetBookingsQuery,
  useGetBookingByIdQuery,
  useGetReviewEligibleCategoriesQuery,
  useGetBookingsByCustomerIdQuery,
  useUpdateBookingMutation,
  useDeleteBookingMutation,
} = bookingsApi

