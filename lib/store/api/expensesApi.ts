import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { StorageService } from "@/lib/firebase/storage"
import type { Expense } from "@/data/expenses"

export interface ExpenseResponse {
  expenses: Expense[]
  total: number
}

// Convert Firestore document to Expense
const convertFirestoreDocToExpense = (docData: any, docId: string): Expense => {
  return {
    id: docId,
    title: docData.title || "",
    amount: docData.amount || 0,
    date: docData.date || "",
    description: docData.description || "",
    // status: docData.status || "pending",
    paymentMethod: docData.paymentMethod || "",
    attachmentUrl: docData.attachmentUrl || "",
    attachmentPath: docData.attachmentPath || "",
    createdAt: docData.createdAt,
    updatedAt: docData.updatedAt,
  }
}

export const expensesApi = createApi({
  reducerPath: "expensesApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Expenses"],
  endpoints: (builder) => ({
    getExpenses: builder.query<ExpenseResponse, void>({
      queryFn: async () => {
        try {
          const expensesRef = collection(db, "expenses")
          const querySnapshot = await getDocs(expensesRef)

          const expenses: Expense[] = querySnapshot.docs.map((docSnapshot) => {
            const docData = docSnapshot.data()
            return convertFirestoreDocToExpense(docData, docSnapshot.id)
          })

          // Sort by date (newest first)
          expenses.sort((a, b) => {
            const dateA = new Date(a.date || "").getTime()
            const dateB = new Date(b.date || "").getTime()
            return dateB - dateA
          })

          return {
            data: {
              expenses,
              total: expenses.length,
            },
          }
        } catch (error: any) {
          console.error("Error fetching expenses:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch expenses",
              data: error.message || "Failed to fetch expenses",
            },
          }
        }
      },
      providesTags: ["Expenses"],
    }),
    createExpense: builder.mutation<{ success: boolean; expenseId: string }, Partial<Expense>>({
      queryFn: async (expenseData) => {
        try {
          // Handle file upload if there's a new attachment
          let attachmentUrl = ""
          let attachmentPath = ""
          
          if (expenseData.attachment && expenseData.attachment instanceof File) {
            const uploadResult = await StorageService.uploadFile(expenseData.attachment, `expense_${Date.now()}`)
            attachmentUrl = uploadResult.url
            attachmentPath = uploadResult.path
          }

          // Generate a new document ID
          const expensesRef = collection(db, "expenses")
          const newExpenseRef = doc(expensesRef)
          const expenseId = newExpenseRef.id

          // Prepare Firestore data
          const firestoreData: any = {
            id: expenseId,
            title: expenseData.title?.trim() || "",
            amount: expenseData.amount || 0,
            date: expenseData.date || new Date().toISOString().split("T")[0],
            description: expenseData.description?.trim() || "",
            // status: expenseData.status || "pending",
            paymentMethod: expenseData.paymentMethod || "",
            attachmentUrl: attachmentUrl || expenseData.attachmentUrl || "",
            attachmentPath: attachmentPath || expenseData.attachmentPath || "",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }

          // Save to Firestore
          await setDoc(newExpenseRef, firestoreData)

          return {
            data: {
              success: true,
              expenseId,
            },
          }
        } catch (error: any) {
          console.error("Error creating expense:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to create expense",
              data: error.message || "Failed to create expense",
            },
          }
        }
      },
      invalidatesTags: ["Expenses"],
    }),
    updateExpense: builder.mutation<
      { success: boolean },
      { expenseId: string; expenseData: Partial<Expense> }
    >({
      queryFn: async ({ expenseId, expenseData }) => {
        try {
          const expenseRef = doc(db, "expenses", expenseId)
          const expenseSnapshot = await getDoc(expenseRef)

          if (!expenseSnapshot.exists()) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Expense not found",
                data: "Expense not found",
              },
            }
          }

          const existingData = expenseSnapshot.data()

          // Handle file upload if there's a new attachment
          let attachmentUrl = expenseData.attachmentUrl || existingData.attachmentUrl || ""
          let attachmentPath = expenseData.attachmentPath || existingData.attachmentPath || ""
          
          if (expenseData.attachment && expenseData.attachment instanceof File) {
            // Delete old attachment if it exists
            if (existingData.attachmentPath) {
              await StorageService.deleteFile(existingData.attachmentPath)
            }
            
            const uploadResult = await StorageService.uploadFile(expenseData.attachment, expenseId)
            attachmentUrl = uploadResult.url
            attachmentPath = uploadResult.path
          }

          // Prepare update data
          const updateData: any = {
            updatedAt: serverTimestamp(),
          }

          if (expenseData.title !== undefined) updateData.title = expenseData.title.trim()
          if (expenseData.amount !== undefined) updateData.amount = expenseData.amount
          if (expenseData.date !== undefined) updateData.date = expenseData.date
          if (expenseData.description !== undefined) updateData.description = expenseData.description.trim()
          // if (expenseData.status !== undefined) updateData.status = expenseData.status
          if (expenseData.paymentMethod !== undefined) updateData.paymentMethod = expenseData.paymentMethod
          if (attachmentUrl) updateData.attachmentUrl = attachmentUrl
          if (attachmentPath) updateData.attachmentPath = attachmentPath

          // Update Firestore document
          await updateDoc(expenseRef, updateData)

          return {
            data: {
              success: true,
            },
          }
        } catch (error: any) {
          console.error("Error updating expense:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to update expense",
              data: error.message || "Failed to update expense",
            },
          }
        }
      },
      invalidatesTags: (result, error, { expenseId }) => [
        { type: "Expenses", id: expenseId },
        "Expenses",
      ],
    }),
    deleteExpense: builder.mutation<{ success: boolean }, string>({
      queryFn: async (expenseId: string) => {
        try {
          const expenseRef = doc(db, "expenses", expenseId)
          const expenseSnapshot = await getDoc(expenseRef)

          if (!expenseSnapshot.exists()) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Expense not found",
                data: "Expense not found",
              },
            }
          }

          const expenseData = expenseSnapshot.data()

          // Delete attachment from Firebase Storage if it exists
          if (expenseData.attachmentPath) {
            await StorageService.deleteFile(expenseData.attachmentPath)
          }

          // Delete from Firestore
          await deleteDoc(expenseRef)

          return {
            data: {
              success: true,
            },
          }
        } catch (error: any) {
          console.error("Error deleting expense:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to delete expense",
              data: error.message || "Failed to delete expense",
            },
          }
        }
      },
      invalidatesTags: ["Expenses"],
    }),
  }),
})

export const {
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} = expensesApi
