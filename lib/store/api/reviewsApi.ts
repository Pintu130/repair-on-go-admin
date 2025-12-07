import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, Timestamp, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export interface Review {
  id: string
  customer: string
  customerFirstName?: string
  customerLastName?: string
  customerAvatar?: string
  product: string
  rating: number
  comment: string
  status: "approved" | "pending"
  date: string
  city?: string
  createdAt?: string
  updatedAt?: string
}

export interface ReviewsResponse {
  reviews: Review[]
  total: number
}

export interface ReviewResponse {
  review: Review | null
}

// Convert Firestore document to Review
const convertFirestoreDocToReview = (docData: any, docId: string): Review => {
  const convertTimestamp = (timestamp: any): string => {
    if (!timestamp) return ""
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toISOString().split("T")[0]
    }
    if (timestamp?.toDate) {
      return timestamp.toDate().toISOString().split("T")[0]
    }
    if (typeof timestamp === "string") {
      return timestamp
    }
    return ""
  }

  return {
    id: docId || docData.id || "",
    customer: docData.customer || "",
    customerFirstName: docData.customerFirstName || "",
    customerLastName: docData.customerLastName || "",
    customerAvatar: docData.customerAvatar || "",
    product: docData.product || "",
    rating: docData.rating || 0,
    comment: docData.comment || "",
    status: docData.status || "pending",
    date: docData.date || convertTimestamp(docData.createdAt) || new Date().toISOString().split("T")[0],
    city: docData.city || "",
    createdAt: convertTimestamp(docData.createdAt),
    updatedAt: convertTimestamp(docData.updatedAt),
  }
}

export const reviewsApi = createApi({
  reducerPath: "reviewsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Reviews"],
  endpoints: (builder) => ({
    getReviews: builder.query<ReviewsResponse, void>({
      queryFn: async () => {
        try {
          const reviewsRef = collection(db, "reviews")
          const querySnapshot = await getDocs(reviewsRef)

          const reviews: Review[] = querySnapshot.docs.map((docSnapshot) => {
            const docData = docSnapshot.data()
            return convertFirestoreDocToReview(docData, docSnapshot.id)
          })

          // Sort by date (newest first)
          reviews.sort((a, b) => {
            const dateA = new Date(a.date || a.createdAt || "").getTime()
            const dateB = new Date(b.date || b.createdAt || "").getTime()
            return dateB - dateA
          })

          return {
            data: {
              reviews,
              total: reviews.length,
            },
          }
        } catch (error: any) {
          console.error("❌ Error fetching reviews:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch reviews",
              data: error.message || "Failed to fetch reviews",
            },
          }
        }
      },
      providesTags: ["Reviews"],
    }),
    getReviewById: builder.query<ReviewResponse, string>({
      queryFn: async (reviewId: string) => {
        try {
          const reviewRef = doc(db, "reviews", reviewId)
          const reviewSnapshot = await getDoc(reviewRef)

          if (!reviewSnapshot.exists()) {
            return {
              data: {
                review: null,
              },
            }
          }

          const docData = reviewSnapshot.data()
          const review = convertFirestoreDocToReview(docData, reviewSnapshot.id)

          return {
            data: {
              review,
            },
          }
        } catch (error: any) {
          console.error("❌ Error fetching review:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch review",
              data: error.message || "Failed to fetch review",
            },
          }
        }
      },
      providesTags: (result, error, reviewId) => [{ type: "Reviews", id: reviewId }],
    }),
    createReview: builder.mutation<{ success: boolean; reviewId: string }, Partial<Review>>({
      queryFn: async (reviewData) => {
        try {
          // Generate a new document ID
          const reviewsRef = collection(db, "reviews")
          const newReviewRef = doc(reviewsRef)
          const reviewId = newReviewRef.id

          // Parse customer name into first and last name if needed
          let customerFirstName = reviewData.customerFirstName || ""
          let customerLastName = reviewData.customerLastName || ""
          
          if (!customerFirstName && !customerLastName && reviewData.customer) {
            const nameParts = reviewData.customer.trim().split(" ")
            customerFirstName = nameParts[0] || ""
            customerLastName = nameParts.slice(1).join(" ") || ""
          }

          // Prepare Firestore data
          const firestoreData: any = {
            id: reviewId,
            customer: reviewData.customer?.trim() || "",
            customerFirstName: customerFirstName,
            customerLastName: customerLastName,
            customerAvatar: reviewData.customerAvatar || "",
            product: reviewData.product?.trim() || "",
            rating: reviewData.rating || 5,
            comment: reviewData.comment?.trim() || "",
            status: reviewData.status || "pending",
            date: reviewData.date || new Date().toISOString().split("T")[0],
            city: reviewData.city?.trim() || "",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }

          // Save to Firestore
          await setDoc(newReviewRef, firestoreData)

          return {
            data: {
              success: true,
              reviewId,
            },
          }
        } catch (error: any) {
          console.error("❌ Error creating review:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to create review",
              data: error.message || "Failed to create review",
            },
          }
        }
      },
      invalidatesTags: ["Reviews"],
    }),
    updateReview: builder.mutation<
      { success: boolean },
      { reviewId: string; reviewData: Partial<Review> }
    >({
      queryFn: async ({ reviewId, reviewData }) => {
        try {
          const reviewRef = doc(db, "reviews", reviewId)
          const reviewSnapshot = await getDoc(reviewRef)

          if (!reviewSnapshot.exists()) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Review not found",
                data: "Review not found",
              },
            }
          }

          // Parse customer name into first and last name if needed
          let customerFirstName = reviewData.customerFirstName
          let customerLastName = reviewData.customerLastName
          
          if (!customerFirstName && !customerLastName && reviewData.customer) {
            const nameParts = reviewData.customer.trim().split(" ")
            customerFirstName = nameParts[0] || ""
            customerLastName = nameParts.slice(1).join(" ") || ""
          }

          // Prepare update data
          const updateData: any = {
            updatedAt: serverTimestamp(),
          }

          if (reviewData.customer !== undefined) {
            updateData.customer = reviewData.customer.trim()
          }
          if (customerFirstName !== undefined) {
            updateData.customerFirstName = customerFirstName
          }
          if (customerLastName !== undefined) {
            updateData.customerLastName = customerLastName
          }
          if (reviewData.customerAvatar !== undefined) {
            updateData.customerAvatar = reviewData.customerAvatar
          }
          if (reviewData.product !== undefined) {
            updateData.product = reviewData.product.trim()
          }
          if (reviewData.rating !== undefined) {
            updateData.rating = reviewData.rating
          }
          if (reviewData.comment !== undefined) {
            updateData.comment = reviewData.comment.trim()
          }
          if (reviewData.status !== undefined) {
            updateData.status = reviewData.status
          }
          if (reviewData.date !== undefined) {
            updateData.date = reviewData.date
          }
          if (reviewData.city !== undefined) {
            updateData.city = reviewData.city.trim()
          }

          // Update Firestore document
          await updateDoc(reviewRef, updateData)

          return {
            data: {
              success: true,
            },
          }
        } catch (error: any) {
          console.error("❌ Error updating review:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to update review",
              data: error.message || "Failed to update review",
            },
          }
        }
      },
      invalidatesTags: (result, error, { reviewId }) => [
        { type: "Reviews", id: reviewId },
        "Reviews",
      ],
    }),
    deleteReview: builder.mutation<{ success: boolean }, string>({
      queryFn: async (reviewId: string) => {
        try {
          const reviewRef = doc(db, "reviews", reviewId)
          const reviewSnapshot = await getDoc(reviewRef)

          if (!reviewSnapshot.exists()) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Review not found",
                data: "Review not found",
              },
            }
          }

          // Delete from Firestore
          await deleteDoc(reviewRef)

          return {
            data: {
              success: true,
            },
          }
        } catch (error: any) {
          console.error("❌ Error deleting review:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to delete review",
              data: error.message || "Failed to delete review",
            },
          }
        }
      },
      invalidatesTags: ["Reviews"],
    }),
    updateReviewStatus: builder.mutation<
      { success: boolean },
      { reviewId: string; status: "approved" | "pending" }
    >({
      queryFn: async ({ reviewId, status }) => {
        try {
          const reviewRef = doc(db, "reviews", reviewId)
          const reviewSnapshot = await getDoc(reviewRef)

          if (!reviewSnapshot.exists()) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Review not found",
                data: "Review not found",
              },
            }
          }

          // Update status
          await updateDoc(reviewRef, {
            status,
            updatedAt: serverTimestamp(),
          })

          return {
            data: {
              success: true,
            },
          }
        } catch (error: any) {
          console.error("❌ Error updating review status:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to update review status",
              data: error.message || "Failed to update review status",
            },
          }
        }
      },
      invalidatesTags: (result, error, { reviewId }) => [
        { type: "Reviews", id: reviewId },
        "Reviews",
      ],
    }),
  }),
})

export const {
  useGetReviewsQuery,
  useGetReviewByIdQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useUpdateReviewStatusMutation,
} = reviewsApi

