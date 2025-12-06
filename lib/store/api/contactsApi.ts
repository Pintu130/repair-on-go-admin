import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, Timestamp, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export interface Contact {
  id: string
  name: string
  email: string
  phone: string
  message: string
  status: "new" | "read"
  date: string
  createdAt?: string
  updatedAt?: string
}

export interface ContactsResponse {
  contacts: Contact[]
  total: number
}

export interface ContactResponse {
  contact: Contact | null
}

// Convert Firestore document to Contact
const convertFirestoreDocToContact = (docData: any, docId: string): Contact => {
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
    name: docData.name || "",
    email: docData.email || "",
    phone: docData.phone || "",
    message: docData.message || "",
    status: docData.status || "new",
    date: docData.date || convertTimestamp(docData.createdAt) || "",
    createdAt: convertTimestamp(docData.createdAt),
    updatedAt: convertTimestamp(docData.updatedAt),
  }
}

export const contactsApi = createApi({
  reducerPath: "contactsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Contacts"],
  endpoints: (builder) => ({
    getContacts: builder.query<ContactsResponse, void>({
      queryFn: async () => {
        try {
          const contactsRef = collection(db, "contacts")
          const querySnapshot = await getDocs(contactsRef)

          const contacts: Contact[] = querySnapshot.docs.map((docSnapshot) => {
            const docData = docSnapshot.data()
            return convertFirestoreDocToContact(docData, docSnapshot.id)
          })

          // Sort by date descending (newest first)
          contacts.sort((a, b) => {
            const dateA = new Date(a.date || a.createdAt || "").getTime()
            const dateB = new Date(b.date || b.createdAt || "").getTime()
            return dateB - dateA
          })

          return {
            data: {
              contacts,
              total: contacts.length,
            },
          }
        } catch (error: any) {
          console.error("❌ Error fetching contacts:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch contacts",
              data: error.message || "Failed to fetch contacts",
            },
          }
        }
      },
      providesTags: ["Contacts"],
    }),
    getContactById: builder.query<ContactResponse, string>({
      queryFn: async (contactId: string) => {
        try {
          const contactDocRef = doc(db, "contacts", contactId)
          const contactDoc = await getDoc(contactDocRef)

          if (!contactDoc.exists()) {
            return {
              data: {
                contact: null,
              },
            }
          }

          const docData = contactDoc.data()
          const contact = convertFirestoreDocToContact(docData, contactDoc.id)

          return {
            data: {
              contact,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error fetching contact ${contactId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch contact",
              data: error.message || "Failed to fetch contact",
            },
          }
        }
      },
      providesTags: (result, error, contactId) => [{ type: "Contacts", id: contactId }],
    }),
    createContact: builder.mutation<{ success: boolean; contactId: string }, Partial<Contact>>({
      queryFn: async (contactData) => {
        try {
          // Validate required fields
          if (!contactData.name || !contactData.email || !contactData.message) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Name, email, and message are required",
                data: "Name, email, and message are required",
              },
            }
          }

          // Generate unique document ID
          const contactsRef = collection(db, "contacts")
          const newContactRef = doc(contactsRef)
          const contactId = newContactRef.id

          // Get current date in YYYY-MM-DD format
          const currentDate = new Date().toISOString().split("T")[0]

          // Prepare Firestore data
          const firestoreData: any = {
            id: contactId,
            name: contactData.name.trim(),
            email: contactData.email.trim(),
            phone: contactData.phone?.trim() || "",
            message: contactData.message.trim(),
            status: "new",
            date: currentDate,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }

          // Save to Firestore
          await setDoc(newContactRef, firestoreData)

          return {
            data: {
              success: true,
              contactId,
            },
          }
        } catch (error: any) {
          console.error("❌ Error creating contact:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to create contact",
              data: error.message || "Failed to create contact",
            },
          }
        }
      },
      invalidatesTags: ["Contacts"],
    }),
    updateContactStatus: builder.mutation<{ success: boolean }, { contactId: string; status: "new" | "read" }>({
      queryFn: async ({ contactId, status }) => {
        try {
          const contactDocRef = doc(db, "contacts", contactId)
          const contactDoc = await getDoc(contactDocRef)

          if (!contactDoc.exists()) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Contact not found",
                data: "Contact not found",
              },
            }
          }

          // Update status
          await updateDoc(contactDocRef, {
            status,
            updatedAt: serverTimestamp(),
          })

          return {
            data: {
              success: true,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error updating contact status ${contactId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to update contact status",
              data: error.message || "Failed to update contact status",
            },
          }
        }
      },
      invalidatesTags: (result, error, { contactId }) => [
        { type: "Contacts", id: contactId },
        "Contacts",
      ],
    }),
    deleteContact: builder.mutation<{ success: boolean }, string>({
      queryFn: async (contactId: string) => {
        try {
          const contactDocRef = doc(db, "contacts", contactId)
          await deleteDoc(contactDocRef)

          return {
            data: {
              success: true,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error deleting contact ${contactId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to delete contact",
              data: error.message || "Failed to delete contact",
            },
          }
        }
      },
      invalidatesTags: ["Contacts"],
    }),
  }),
})

export const {
  useGetContactsQuery,
  useGetContactByIdQuery,
  useCreateContactMutation,
  useUpdateContactStatusMutation,
  useDeleteContactMutation,
} = contactsApi

