import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { collection, deleteField, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { THEME_TOKENS, type ThemeColorKey, type ThemeColors } from "@/lib/theme-tokens"

/**
 * `theme*` fields are flattened onto the same document so the landing site needs
 * a single read. They are merged, never replaced wholesale, so saving web
 * settings cannot clobber a saved theme and vice versa.
 */
export type WebSettings = ThemeColors & {
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
  announcement?: string
  baseFee?: number
  perKmCharge?: number
  serviceCenterLatitude?: number
  serviceCenterLongitude?: number
  distancePricingEnabled?: boolean
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
    /**
     * Merge-only write for the theme page. A key whose value is `undefined` is
     * removed from the document so the landing site falls back to the palette
     * authored in its own `globals.css` — that is how "reset to defaults"
     * is persisted.
     */
    updateThemeColors: builder.mutation<{ success: boolean }, { colors: ThemeColors }>({
      queryFn: async ({ colors }) => {
        try {
          const docRef = doc(collection(db, COLLECTION), DOC_ID)
          const payload: Record<string, unknown> = {}
          let hasValues = false
          for (const token of THEME_TOKENS) {
            const value = colors[token.key as ThemeColorKey]
            if (typeof value === "string" && value.trim()) {
              payload[token.key] = value.trim()
              hasValues = true
            } else {
              payload[token.key] = deleteField()
            }
          }
          // A pure reset only needs to touch Firestore when the document already
          // exists, otherwise we would create a stub with no settings in it.
          if (!hasValues && !(await getDoc(docRef)).exists()) {
            return { data: { success: true } }
          }
          payload.updatedAt = serverTimestamp()
          await setDoc(docRef, payload, { merge: true })
          return { data: { success: true } }
        } catch (error: any) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to update theme colors",
              data: error.message || "Failed to update theme colors",
            },
          }
        }
      },
      invalidatesTags: ["WebSettings"],
    }),
  }),
})

export const {
  useGetWebSettingsQuery,
  useUpdateWebSettingsMutation,
  useUpdateThemeColorsMutation,
} = webSettingsApi
