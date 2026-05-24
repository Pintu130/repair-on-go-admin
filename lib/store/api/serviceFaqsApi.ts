import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export interface ServiceFaqItem {
  question: string
  answer: string
}

export interface ServiceFaq {
  id: string
  categoryId: string
  categoryName?: string
  faqs: ServiceFaqItem[]
  createdAt?: string
  updatedAt?: string
}

export type ServiceFaqFormPayload = Partial<ServiceFaq>

export interface ServiceFaqsResponse {
  serviceFaqs: ServiceFaq[]
  total: number
}

export interface ServiceFaqResponse {
  serviceFaq: ServiceFaq | null
}

// Convert Firestore document to ServiceFaq
const convertFirestoreDocToServiceFaq = (docData: any, docId: string): ServiceFaq => {
  const convertTimestamp = (timestamp: any): string => {
    if (!timestamp) return ""
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toISOString()
    }
    if (timestamp?.toDate) {
      return timestamp.toDate().toISOString()
    }
    if (typeof timestamp === "string") {
      return timestamp
    }
    return ""
  }

  let faqs: ServiceFaqItem[] = []
  if (Array.isArray(docData.faqs)) {
    faqs = docData.faqs
      .filter((item: any) => item && typeof item === "object")
      .map((item: any) => ({
        question: typeof item.question === "string" ? item.question.trim() : "",
        answer: typeof item.answer === "string" ? item.answer.trim() : "",
      }))
      .filter((item) => item.question || item.answer)
  }

  return {
    id: docId || docData.id || "",
    categoryId: docData.categoryId || "",
    categoryName: docData.categoryName || "",
    faqs,
    createdAt: convertTimestamp(docData.createdAt),
    updatedAt: convertTimestamp(docData.updatedAt),
  }
}

export const serviceFaqsApi = createApi({
  reducerPath: "serviceFaqsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["ServiceFaqs"],
  endpoints: (builder) => ({
    getServiceFaqs: builder.query<ServiceFaqsResponse, void>({
      queryFn: async () => {
        try {
          const serviceFaqsRef = collection(db, "serviceFaqs")
          const querySnapshot = await getDocs(serviceFaqsRef)

          const serviceFaqs: ServiceFaq[] = querySnapshot.docs.map((docSnapshot) => {
            const docData = docSnapshot.data()
            return convertFirestoreDocToServiceFaq(docData, docSnapshot.id)
          })

          // Sort by categoryName
          serviceFaqs.sort((a, b) =>
            (a.categoryName || "").localeCompare(b.categoryName || "")
          )

          return {
            data: {
              serviceFaqs,
              total: serviceFaqs.length,
            },
          }
        } catch (error: any) {
          console.error("❌ Error fetching service FAQs:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch service FAQs",
              data: error.message || "Failed to fetch service FAQs",
            },
          }
        }
      },
      providesTags: ["ServiceFaqs"],
    }),

    getServiceFaqById: builder.query<ServiceFaqResponse, string>({
      queryFn: async (serviceFaqId: string) => {
        try {
          const serviceFaqDocRef = doc(db, "serviceFaqs", serviceFaqId)
          const serviceFaqDoc = await getDoc(serviceFaqDocRef)

          if (!serviceFaqDoc.exists()) {
            return {
              data: {
                serviceFaq: null,
              },
            }
          }

          const docData = serviceFaqDoc.data()
          const serviceFaq = convertFirestoreDocToServiceFaq(docData, serviceFaqDoc.id)

          return {
            data: {
              serviceFaq,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error fetching service FAQ ${serviceFaqId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch service FAQ",
              data: error.message || "Failed to fetch service FAQ",
            },
          }
        }
      },
      providesTags: (result, error, serviceFaqId) => [
        { type: "ServiceFaqs", id: serviceFaqId },
      ],
    }),

    createServiceFaq: builder.mutation<
      { success: boolean; serviceFaqId: string },
      ServiceFaqFormPayload
    >({
      queryFn: async (serviceFaqData) => {
        try {
          // Validate required fields
          if (!serviceFaqData.categoryId) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Category is required",
                data: "Category is required",
              },
            }
          }

          if (!Array.isArray(serviceFaqData.faqs) || serviceFaqData.faqs.length === 0) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "At least one FAQ is required",
                data: "At least one FAQ is required",
              },
            }
          }

          // Generate unique document ID
          const serviceFaqsRef = collection(db, "serviceFaqs")
          const newServiceFaqRef = doc(serviceFaqsRef)
          const serviceFaqId = newServiceFaqRef.id

          // Clean FAQs
          const faqsClean = serviceFaqData.faqs
            .map((faq) => ({
              question: typeof faq.question === "string" ? faq.question.trim() : "",
              answer: typeof faq.answer === "string" ? faq.answer.trim() : "",
            }))
            .filter((faq) => faq.question && faq.answer)

          if (faqsClean.length === 0) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "At least one complete FAQ (question + answer) is required",
                data: "At least one complete FAQ (question + answer) is required",
              },
            }
          }

          const firestoreData: any = {
            id: serviceFaqId,
            categoryId: serviceFaqData.categoryId,
            categoryName: serviceFaqData.categoryName || "",
            faqs: faqsClean,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }

          // Save to Firestore
          await setDoc(newServiceFaqRef, firestoreData)

          console.log("✅ Service FAQ created successfully:", serviceFaqId)

          return {
            data: {
              success: true,
              serviceFaqId,
            },
          }
        } catch (error: any) {
          console.error("❌ Error creating service FAQ:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to create service FAQ",
              data: error.message || "Failed to create service FAQ",
            },
          }
        }
      },
      invalidatesTags: ["ServiceFaqs"],
    }),

    updateServiceFaq: builder.mutation<
      { success: boolean },
      { serviceFaqId: string; serviceFaqData: ServiceFaqFormPayload }
    >({
      queryFn: async ({ serviceFaqId, serviceFaqData }) => {
        try {
          const serviceFaqDocRef = doc(db, "serviceFaqs", serviceFaqId)
          const serviceFaqDoc = await getDoc(serviceFaqDocRef)

          if (!serviceFaqDoc.exists()) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Service FAQ not found",
                data: "Service FAQ not found",
              },
            }
          }

          // Prepare update data
          const updateData: any = {
            updatedAt: serverTimestamp(),
          }

          if (serviceFaqData.categoryId !== undefined) {
            updateData.categoryId = serviceFaqData.categoryId
          }

          if (serviceFaqData.categoryName !== undefined) {
            updateData.categoryName = serviceFaqData.categoryName
          }

          if (serviceFaqData.faqs !== undefined) {
            if (!Array.isArray(serviceFaqData.faqs) || serviceFaqData.faqs.length === 0) {
              return {
                error: {
                  status: "CUSTOM_ERROR",
                  error: "At least one FAQ is required",
                  data: "At least one FAQ is required",
                },
              }
            }

            const faqsClean = serviceFaqData.faqs
              .map((faq) => ({
                question: typeof faq.question === "string" ? faq.question.trim() : "",
                answer: typeof faq.answer === "string" ? faq.answer.trim() : "",
              }))
              .filter((faq) => faq.question && faq.answer)

            if (faqsClean.length === 0) {
              return {
                error: {
                  status: "CUSTOM_ERROR",
                  error: "At least one complete FAQ (question + answer) is required",
                  data: "At least one complete FAQ (question + answer) is required",
                },
              }
            }

            updateData.faqs = faqsClean
          }

          // Update in Firestore
          await updateDoc(serviceFaqDocRef, updateData)

          console.log("✅ Service FAQ updated successfully:", serviceFaqId)

          return {
            data: {
              success: true,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error updating service FAQ ${serviceFaqId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to update service FAQ",
              data: error.message || "Failed to update service FAQ",
            },
          }
        }
      },
      invalidatesTags: (result, error, { serviceFaqId }) => [
        { type: "ServiceFaqs", id: serviceFaqId },
        "ServiceFaqs",
      ],
    }),

    deleteServiceFaq: builder.mutation<{ success: boolean }, string>({
      queryFn: async (serviceFaqId: string) => {
        try {
          const serviceFaqDocRef = doc(db, "serviceFaqs", serviceFaqId)
          const serviceFaqDoc = await getDoc(serviceFaqDocRef)

          if (!serviceFaqDoc.exists()) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Service FAQ not found",
                data: "Service FAQ not found",
              },
            }
          }

          // Delete service FAQ document from Firestore
          await deleteDoc(serviceFaqDocRef)

          console.log("✅ Service FAQ deleted successfully:", serviceFaqId)

          return {
            data: {
              success: true,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error deleting service FAQ ${serviceFaqId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to delete service FAQ",
              data: error.message || "Failed to delete service FAQ",
            },
          }
        }
      },
      invalidatesTags: ["ServiceFaqs"],
    }),
  }),
})

export const {
  useGetServiceFaqsQuery,
  useGetServiceFaqByIdQuery,
  useCreateServiceFaqMutation,
  useUpdateServiceFaqMutation,
  useDeleteServiceFaqMutation,
} = serviceFaqsApi
