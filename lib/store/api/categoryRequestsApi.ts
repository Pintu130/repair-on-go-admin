import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { collection, getDocs, Timestamp, writeBatch, doc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export interface Location {
  city: string
  country: string
  countryCode: string
  ip: string
  lat: number
  lon: number
  pincode: string
  region: string
  timezone: string
}

export interface CategoryRequest {
  id: string
  query: string
  userId: string
  userName: string
  userEmail: string
  location: Location
  date: string
  createdAt: string
  updatedAt: string
  timestamp: string
}

export interface CategoryRequestsResponse {
  requests: CategoryRequest[]
  total: number
}

// Helper function to convert Firestore timestamp to date string
const convertTimestamp = (timestamp: any): string => {
  if (!timestamp) return new Date().toISOString()

  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString()
  }

  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString()
  }

  if (typeof timestamp === "string") {
    return timestamp
  }

  return new Date().toISOString()
}

// Helper function to convert Firestore document to CategoryRequest
const convertFirestoreDocToCategoryRequest = (docData: any, docId: string): CategoryRequest => {
  return {
    id: docId,
    query: docData.query || "",
    userId: docData.userId || "",
    userName: docData.userName || "",
    userEmail: docData.userEmail || "",
    location: docData.location || {
      city: "",
      country: "",
      countryCode: "",
      ip: "",
      lat: 0,
      lon: 0,
      pincode: "",
      region: "",
      timezone: "",
    },
    date: docData.date || convertTimestamp(docData.timestamp),
    createdAt: convertTimestamp(docData.createdAt),
    updatedAt: convertTimestamp(docData.updatedAt),
    timestamp: convertTimestamp(docData.timestamp),
  }
}

export const categoryRequestsApi = createApi({
  reducerPath: "categoryRequestsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["CategoryRequests"],
  endpoints: (builder) => ({
    getCategoryRequests: builder.query<CategoryRequestsResponse, void>({
      queryFn: async () => {
        try {
          const requestsRef = collection(db, "categoriesSearch")
          const querySnapshot = await getDocs(requestsRef)

          const requests: CategoryRequest[] = querySnapshot.docs.map((docSnapshot) => {
            const docData = docSnapshot.data()
            return convertFirestoreDocToCategoryRequest(docData, docSnapshot.id)
          })

          // Sort by timestamp descending (newest first)
          requests.sort((a, b) => {
            const dateA = new Date(a.timestamp || a.createdAt || "").getTime()
            const dateB = new Date(b.timestamp || b.createdAt || "").getTime()
            return dateB - dateA
          })

          return {
            data: {
              requests,
              total: requests.length,
            },
          }
        } catch (error: any) {
          console.error("❌ Error fetching category requests:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch category requests",
              data: error.message || "Failed to fetch category requests",
            },
          }
        }
      },
      providesTags: ["CategoryRequests"],
    }),
    deleteAllCategoryRequests: builder.mutation<{ success: boolean }, void>({
      queryFn: async () => {
        try {
          const requestsRef = collection(db, "categoriesSearch")
          const querySnapshot = await getDocs(requestsRef)

          // Use batch delete for better performance
          const batch = writeBatch(db)
          querySnapshot.docs.forEach((docSnapshot) => {
            batch.delete(docSnapshot.ref)
          })

          await batch.commit()

          return {
            data: {
              success: true,
            },
          }
        } catch (error: any) {
          console.error("❌ Error deleting category requests:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to delete category requests",
              data: error.message || "Failed to delete category requests",
            },
          }
        }
      },
      invalidatesTags: ["CategoryRequests"],
    }),
  }),
})

export const { useGetCategoryRequestsQuery, useDeleteAllCategoryRequestsMutation } = categoryRequestsApi
