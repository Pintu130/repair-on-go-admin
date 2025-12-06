import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, Timestamp, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export interface FAQ {
  id: string
  question: string
  answer: string
  createdAt?: string
  updatedAt?: string
  order?: number // For future: ordering FAQs
}

export interface FAQsResponse {
  faqs: FAQ[]
  total: number
}

export interface FAQResponse {
  faq: FAQ | null
}

// Convert Firestore document to FAQ
const convertFirestoreDocToFAQ = (docData: any, docId: string): FAQ => {
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

  return {
    id: docId || docData.id || "",
    question: docData.question || "",
    answer: docData.answer || "",
    order: docData.order || 0,
    createdAt: convertTimestamp(docData.createdAt),
    updatedAt: convertTimestamp(docData.updatedAt),
  }
}

export const faqsApi = createApi({
  reducerPath: "faqsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["FAQs"],
  endpoints: (builder) => ({
    getFAQs: builder.query<FAQsResponse, void>({
      queryFn: async () => {
        try {
          const faqsRef = collection(db, "faq")
          const querySnapshot = await getDocs(faqsRef)

          const faqs: FAQ[] = querySnapshot.docs.map((docSnapshot) => {
            const docData = docSnapshot.data()
            return convertFirestoreDocToFAQ(docData, docSnapshot.id)
          })

          // Sort by order (if exists) or createdAt descending (newest first)
          faqs.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
              return a.order - b.order
            }
            const dateA = new Date(a.createdAt || "").getTime()
            const dateB = new Date(b.createdAt || "").getTime()
            return dateB - dateA
          })

          return {
            data: {
              faqs,
              total: faqs.length,
            },
          }
        } catch (error: any) {
          console.error("❌ Error fetching FAQs:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch FAQs",
              data: error.message || "Failed to fetch FAQs",
            },
          }
        }
      },
      providesTags: ["FAQs"],
    }),
    getFAQById: builder.query<FAQResponse, string>({
      queryFn: async (faqId: string) => {
        try {
          const faqDocRef = doc(db, "faq", faqId)
          const faqDoc = await getDoc(faqDocRef)

          if (!faqDoc.exists()) {
            return {
              data: {
                faq: null,
              },
            }
          }

          const docData = faqDoc.data()
          const faq = convertFirestoreDocToFAQ(docData, faqDoc.id)

          return {
            data: {
              faq,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error fetching FAQ ${faqId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch FAQ",
              data: error.message || "Failed to fetch FAQ",
            },
          }
        }
      },
      providesTags: (result, error, faqId) => [{ type: "FAQs", id: faqId }],
    }),
    createFAQ: builder.mutation<{ success: boolean; faqId: string }, Partial<FAQ>>({
      queryFn: async (faqData) => {
        try {
          // Validate required fields
          if (!faqData.question || !faqData.answer) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Question and answer are required",
                data: "Question and answer are required",
              },
            }
          }

          // Generate unique document ID
          const faqsRef = collection(db, "faq")
          const newFAQRef = doc(faqsRef)
          const faqId = newFAQRef.id

          // Prepare Firestore data
          const firestoreData: any = {
            id: faqId,
            question: faqData.question.trim(),
            answer: faqData.answer.trim(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }

          // Add optional fields
          if (faqData.order !== undefined) {
            firestoreData.order = faqData.order
          }

          // Save to Firestore
          await setDoc(newFAQRef, firestoreData)

          return {
            data: {
              success: true,
              faqId,
            },
          }
        } catch (error: any) {
          console.error("❌ Error creating FAQ:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to create FAQ",
              data: error.message || "Failed to create FAQ",
            },
          }
        }
      },
      invalidatesTags: ["FAQs"],
    }),
    updateFAQ: builder.mutation<{ success: boolean }, { faqId: string; faqData: Partial<FAQ> }>({
      queryFn: async ({ faqId, faqData }) => {
        try {
          const faqDocRef = doc(db, "faq", faqId)
          const faqDoc = await getDoc(faqDocRef)

          if (!faqDoc.exists()) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "FAQ not found",
                data: "FAQ not found",
              },
            }
          }

          // Prepare update data
          const updateData: any = {
            updatedAt: serverTimestamp(),
          }

          if (faqData.question !== undefined) {
            updateData.question = faqData.question.trim()
          }
          if (faqData.answer !== undefined) {
            updateData.answer = faqData.answer.trim()
          }
          if (faqData.order !== undefined) {
            updateData.order = faqData.order
          }

          // Update in Firestore
          await updateDoc(faqDocRef, updateData)

          return {
            data: {
              success: true,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error updating FAQ ${faqId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to update FAQ",
              data: error.message || "Failed to update FAQ",
            },
          }
        }
      },
      invalidatesTags: (result, error, { faqId }) => [
        { type: "FAQs", id: faqId },
        "FAQs",
      ],
    }),
    deleteFAQ: builder.mutation<{ success: boolean }, string>({
      queryFn: async (faqId: string) => {
        try {
          const faqDocRef = doc(db, "faq", faqId)
          await deleteDoc(faqDocRef)

          return {
            data: {
              success: true,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error deleting FAQ ${faqId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to delete FAQ",
              data: error.message || "Failed to delete FAQ",
            },
          }
        }
      },
      invalidatesTags: ["FAQs"],
    }),
  }),
})

export const {
  useGetFAQsQuery,
  useGetFAQByIdQuery,
  useCreateFAQMutation,
  useUpdateFAQMutation,
  useDeleteFAQMutation,
} = faqsApi

