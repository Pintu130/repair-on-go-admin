import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { collection, getDocs, doc, getDoc, updateDoc, Timestamp, deleteField } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { Order } from "@/data/orders"

export interface BookingsResponse {
  bookings: Order[]
  total: number
}

export interface BookingResponse {
  booking: Order | null
}

// Helper function to convert Firestore timestamp to date string
const convertTimestamp = (timestamp: any): string => {
  if (!timestamp) return new Date().toISOString().split("T")[0]

  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString().split("T")[0]
  }

  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString().split("T")[0]
  }

  if (typeof timestamp === "string") {
    // If it's already a date string, try to parse and format it
    try {
      const date = new Date(timestamp)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0]
      }
    } catch (e) {
      // If parsing fails, return as is
    }
    return timestamp.split("T")[0] // Extract date part if it's ISO string
  }

  return new Date().toISOString().split("T")[0]
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

  return {
    id: docId || "",
    bookingId: docData.bookingId || docId || "",
    customer: customerName,
    service: textDescription || category, // Use description as service or fallback to category
    mobileNumber: mobileNumber,
    paymentStatus: paymentStatus,
    paymentMethod: paymentMethod,
    category: category,
    amount: amount,
    status: status,
    date: date,
    images: images.length > 0 ? images : undefined,
    audioRecording: audioRecording,
    textDescription: textDescription,
    serviceReason: serviceReason,
    serviceAmount: serviceAmount,
    cancelledAtStatus: cancelledAtStatus,
  }
}

export const bookingsApi = createApi({
  reducerPath: "bookingsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Bookings"],
  endpoints: (builder) => ({
    getBookings: builder.query<BookingsResponse, void>({
      queryFn: async () => {
        try {
          console.log("🔥 Fetching bookings from Firestore...")

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

          console.log(`✅ Fetched ${bookings.length} bookings from Firestore`)

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
          console.log(`🔥 Fetching booking ${bookingId} from Firestore...`)

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
          
          let bookingDocRef = null
          for (const docSnapshot of querySnapshot.docs) {
            const docData = docSnapshot.data()
            if (docData.bookingId === bookingId || docSnapshot.id === bookingId) {
              bookingDocRef = doc(db, "bookings", docSnapshot.id)
              break
            }
          }

          // If not found by bookingId, try by document ID
          if (!bookingDocRef) {
            try {
              const docRef = doc(db, "bookings", bookingId)
              const docSnap = await getDoc(docRef)
              if (docSnap.exists()) {
                bookingDocRef = docRef
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
            // Map status to Firebase format
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
            updateData.status = statusMap[updates.status] || updates.status
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

          // Update the document
          await updateDoc(bookingDocRef, updateData)

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
      invalidatesTags: (result, error, { bookingId }) => [
        { type: "Bookings", id: bookingId },
        { type: "Bookings" },
      ],
    }),
  }),
})

export const {
  useGetBookingsQuery,
  useGetBookingByIdQuery,
  useUpdateBookingMutation,
} = bookingsApi

