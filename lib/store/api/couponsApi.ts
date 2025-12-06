import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, Timestamp, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export interface Coupon {
  id: string
  code: string
  discountType: "percentage" | "fixed"
  discountValue: number
  validFrom: string
  validTo: string
  status: "active" | "inactive"
  usageLimit?: number
  minimumOrderAmount?: number
  usedCount?: number
  maxUsagePerUser?: number // For future: limit per user
  applicableCategories?: string[] // For future: specific categories
  excludedCategories?: string[] // For future: excluded categories
  createdAt?: string
  updatedAt?: string
}

export interface CouponsResponse {
  coupons: Coupon[]
  total: number
}

export interface CouponResponse {
  coupon: Coupon | null
}

// Convert Firestore document to Coupon
const convertFirestoreDocToCoupon = (docData: any, docId: string): Coupon => {
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
    code: docData.code || "",
    discountType: docData.discountType || "percentage",
    discountValue: docData.discountValue || 0,
    validFrom: docData.validFrom || convertTimestamp(docData.validFromTimestamp) || "",
    validTo: docData.validTo || convertTimestamp(docData.validToTimestamp) || "",
    status: docData.status || "active",
    usageLimit: docData.usageLimit || undefined,
    minimumOrderAmount: docData.minimumOrderAmount || undefined,
    usedCount: docData.usedCount || 0,
    maxUsagePerUser: docData.maxUsagePerUser || undefined,
    applicableCategories: docData.applicableCategories || undefined,
    excludedCategories: docData.excludedCategories || undefined,
    createdAt: convertTimestamp(docData.createdAt),
    updatedAt: convertTimestamp(docData.updatedAt),
  }
}

export const couponsApi = createApi({
  reducerPath: "couponsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Coupons"],
  endpoints: (builder) => ({
    getCoupons: builder.query<CouponsResponse, void>({
      queryFn: async () => {
        try {
          const couponsRef = collection(db, "coupons")
          const querySnapshot = await getDocs(couponsRef)

          const coupons: Coupon[] = querySnapshot.docs.map((docSnapshot) => {
            const docData = docSnapshot.data()
            return convertFirestoreDocToCoupon(docData, docSnapshot.id)
          })

          // Sort by createdAt descending (newest first)
          coupons.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.validFrom).getTime()
            const dateB = new Date(b.createdAt || b.validFrom).getTime()
            return dateB - dateA
          })

          return {
            data: {
              coupons,
              total: coupons.length,
            },
          }
        } catch (error: any) {
          console.error("❌ Error fetching coupons:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch coupons",
              data: error.message || "Failed to fetch coupons",
            },
          }
        }
      },
      providesTags: ["Coupons"],
    }),
    getCouponById: builder.query<CouponResponse, string>({
      queryFn: async (couponId: string) => {
        try {
          const couponDocRef = doc(db, "coupons", couponId)
          const couponDoc = await getDoc(couponDocRef)

          if (!couponDoc.exists()) {
            return {
              data: {
                coupon: null,
              },
            }
          }

          const docData = couponDoc.data()
          const coupon = convertFirestoreDocToCoupon(docData, couponDoc.id)

          return {
            data: {
              coupon,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error fetching coupon ${couponId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch coupon",
              data: error.message || "Failed to fetch coupon",
            },
          }
        }
      },
      providesTags: (result, error, couponId) => [{ type: "Coupons", id: couponId }],
    }),
    createCoupon: builder.mutation<{ success: boolean; couponId: string }, Partial<Coupon>>({
      queryFn: async (couponData) => {
        try {
          // Validate required fields
          if (!couponData.code || !couponData.validFrom || !couponData.validTo || !couponData.discountValue) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Missing required fields: code, validFrom, validTo, and discountValue are required",
                data: "Missing required fields: code, validFrom, validTo, and discountValue are required",
              },
            }
          }

          // Generate unique document ID
          const couponsRef = collection(db, "coupons")
          const newCouponRef = doc(couponsRef)
          const couponId = newCouponRef.id

          // Prepare Firestore data
          const firestoreData: any = {
            id: couponId,
            code: couponData.code.toUpperCase().trim(),
            discountType: couponData.discountType || "percentage",
            discountValue: couponData.discountValue,
            validFrom: couponData.validFrom,
            validTo: couponData.validTo,
            status: couponData.status || "active",
            usedCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }

          // Add optional fields
          if (couponData.usageLimit !== undefined) {
            firestoreData.usageLimit = couponData.usageLimit
          }
          if (couponData.minimumOrderAmount !== undefined) {
            firestoreData.minimumOrderAmount = couponData.minimumOrderAmount
          }
          if (couponData.maxUsagePerUser !== undefined) {
            firestoreData.maxUsagePerUser = couponData.maxUsagePerUser
          }
          if (couponData.applicableCategories && couponData.applicableCategories.length > 0) {
            firestoreData.applicableCategories = couponData.applicableCategories
          }
          if (couponData.excludedCategories && couponData.excludedCategories.length > 0) {
            firestoreData.excludedCategories = couponData.excludedCategories
          }

          // Save to Firestore
          await setDoc(newCouponRef, firestoreData)

          return {
            data: {
              success: true,
              couponId,
            },
          }
        } catch (error: any) {
          console.error("❌ Error creating coupon:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to create coupon",
              data: error.message || "Failed to create coupon",
            },
          }
        }
      },
      invalidatesTags: ["Coupons"],
    }),
    updateCoupon: builder.mutation<
      { success: boolean },
      { couponId: string; couponData: Partial<Coupon> }
    >({
      queryFn: async ({ couponId, couponData }) => {
        try {
          const couponDocRef = doc(db, "coupons", couponId)
          const couponDoc = await getDoc(couponDocRef)

          if (!couponDoc.exists()) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Coupon not found",
                data: "Coupon not found",
              },
            }
          }

          // Prepare update data
          const updateData: any = {
            updatedAt: serverTimestamp(),
          }

          if (couponData.code !== undefined) {
            updateData.code = couponData.code.toUpperCase().trim()
          }
          if (couponData.discountType !== undefined) {
            updateData.discountType = couponData.discountType
          }
          if (couponData.discountValue !== undefined) {
            updateData.discountValue = couponData.discountValue
          }
          if (couponData.validFrom !== undefined) {
            updateData.validFrom = couponData.validFrom
          }
          if (couponData.validTo !== undefined) {
            updateData.validTo = couponData.validTo
          }
          if (couponData.status !== undefined) {
            updateData.status = couponData.status
          }
          if (couponData.usageLimit !== undefined) {
            updateData.usageLimit = couponData.usageLimit
          }
          if (couponData.minimumOrderAmount !== undefined) {
            updateData.minimumOrderAmount = couponData.minimumOrderAmount
          }
          if (couponData.maxUsagePerUser !== undefined) {
            updateData.maxUsagePerUser = couponData.maxUsagePerUser
          }
          if (couponData.applicableCategories !== undefined) {
            updateData.applicableCategories = couponData.applicableCategories
          }
          if (couponData.excludedCategories !== undefined) {
            updateData.excludedCategories = couponData.excludedCategories
          }

          // Update in Firestore
          await updateDoc(couponDocRef, updateData)

          return {
            data: {
              success: true,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error updating coupon ${couponId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to update coupon",
              data: error.message || "Failed to update coupon",
            },
          }
        }
      },
      invalidatesTags: (result, error, { couponId }) => [
        { type: "Coupons", id: couponId },
        "Coupons",
      ],
    }),
    deleteCoupon: builder.mutation<{ success: boolean }, string>({
      queryFn: async (couponId: string) => {
        try {
          const couponDocRef = doc(db, "coupons", couponId)
          await deleteDoc(couponDocRef)

          return {
            data: {
              success: true,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error deleting coupon ${couponId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to delete coupon",
              data: error.message || "Failed to delete coupon",
            },
          }
        }
      },
      invalidatesTags: ["Coupons"],
    }),
  }),
})

export const {
  useGetCouponsQuery,
  useGetCouponByIdQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} = couponsApi

