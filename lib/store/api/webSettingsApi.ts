import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { collection, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export interface WebSettings {
  businessName: string
  email: string
  phone: string
  address: string
  city?: string
  zipCode?: string
  facebook?: string
  twitter?: string
  instagram?: string
  linkedin?: string
  logo?: string
  favicon?: string
  happyCustomers?: string
  successRate?: string
  supportAvailable?: string
  serviceAreas?: string
  supportHours?: string
  createdAt?: string
  updatedAt?: string
}

export interface WebSettingsResponse {
  settings: WebSettings | null
}

const COLLECTION = "websettings"
const DOC_ID = "default"

export const webSettingsApi = createApi({
  reducerPath: "webSettingsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["WebSettings"],
  endpoints: (builder) => ({
    getWebSettings: builder.query<WebSettingsResponse, void>({
      queryFn: async () => {
        try {
          const docRef = doc(collection(db, COLLECTION), DOC_ID)
          const snap = await getDoc(docRef)
          if (!snap.exists()) {
            return { data: { settings: null } }
          }
          const data = snap.data() as WebSettings
          return { data: { settings: data } }
        } catch (error: any) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch web settings",
              data: error.message || "Failed to fetch web settings",
            },
          }
        }
      },
      providesTags: ["WebSettings"],
    }),
    updateWebSettings: builder.mutation<{ success: boolean }, { settings: WebSettings }>({
      queryFn: async ({ settings }) => {
        try {
          const docRef = doc(collection(db, COLLECTION), DOC_ID)
          const snapshot = await getDoc(docRef)
          const payload: any = {
            ...settings,
            updatedAt: serverTimestamp(),
          }
          if (!snapshot.exists()) {
            payload.createdAt = serverTimestamp()
            await setDoc(docRef, payload)
          } else {
            await updateDoc(docRef, payload)
          }
          return { data: { success: true } }
        } catch (error: any) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to update web settings",
              data: error.message || "Failed to update web settings",
            },
          }
        }
      },
      invalidatesTags: ["WebSettings"],
    }),
  }),
})

export const { useGetWebSettingsQuery, useUpdateWebSettingsMutation } = webSettingsApi
