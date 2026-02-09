import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { uploadImageToStorage, deleteImageFromStorage, isFirebaseStorageUrl } from "@/lib/utils/storage"

export interface GalleryItem {
  id: string
  type: "image" | "video"
  sourceType: "file" | "url"
  url: string
  title: string
  description: string
  status: "active" | "inactive"
  createdAt?: string
  updatedAt?: string
}

export interface GalleryResponse {
  items: GalleryItem[]
  total: number
}

function convertDocToItem(data: any, id: string): GalleryItem {
  return {
    id,
    type: (data.type as "image" | "video") || "image",
    sourceType: (data.sourceType as "file" | "url") || (isFirebaseStorageUrl(data.url || "") ? "file" : "url"),
    url: data.url || "",
    title: data.title || "",
    description: data.description || "",
    status: (data.status as "active" | "inactive") || "active",
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || "",
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || "",
  }
}

export const galleryApi = createApi({
  reducerPath: "galleryApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Gallery"],
  endpoints: (builder) => ({
    getGallery: builder.query<GalleryResponse, void>({
      queryFn: async () => {
        try {
          const ref = collection(db, "gallery")
          const snap = await getDocs(ref)
          const items: GalleryItem[] = snap.docs.map((d) => convertDocToItem(d.data(), d.id))
          // sort by createdAt desc then title (updates won't change position)
          items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "") || a.title.localeCompare(b.title))
          return { data: { items, total: items.length } }
        } catch (error: any) {
          console.error("❌ Error fetching gallery:", error)
          return { error: { status: "CUSTOM_ERROR", error: error.message || "Failed to fetch gallery", data: error.message || "Failed to fetch gallery" } }
        }
      },
      providesTags: ["Gallery"],
    }),
    createGalleryItem: builder.mutation<{ success: boolean; id: string }, Partial<GalleryItem> & { mediaData?: string }>({
      queryFn: async (payload) => {
        try {
          if (!payload.title || !payload.title.trim()) {
            return { error: { status: "CUSTOM_ERROR", error: "Title is required", data: "Title is required" } }
          }
          const ref = collection(db, "gallery")
          const newDoc = doc(ref)
          const id = newDoc.id

          let url = payload.url || ""
          // Upload file to storage when sourceType=file and mediaData provided
          if (payload.sourceType === "file" && payload.mediaData && payload.mediaData.trim()) {
            try {
              const isVideo = payload.type === "video"
              const fileExtension = payload.mediaData.startsWith("data:")
                ? payload.mediaData.split(";")[0].split("/")[1] || (isVideo ? "mp4" : "jpg")
                : isVideo ? "mp4" : "jpg"
              const storagePath = `gallery/${id}/media.${fileExtension}`
              url = await uploadImageToStorage(payload.mediaData, storagePath)
            } catch (e: any) {
              console.warn("⚠️ Upload failed, continuing without Storage URL:", e?.message)
            }
          }

          const docData: any = {
            id,
            type: payload.type || "image",
            sourceType: payload.sourceType || (isFirebaseStorageUrl(url) ? "file" : "url"),
            url: url || "",
            title: payload.title?.trim() || "",
            description: payload.description?.trim() || "",
            status: payload.status || "active",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }

          await setDoc(newDoc, docData)
          return { data: { success: true, id } }
        } catch (error: any) {
          console.error("❌ Error creating gallery item:", error)
          return { error: { status: "CUSTOM_ERROR", error: error.message || "Failed to create item", data: error.message || "Failed to create item" } }
        }
      },
      invalidatesTags: ["Gallery"],
    }),
    updateGalleryItem: builder.mutation<{ success: boolean }, { id: string; data: Partial<GalleryItem> & { mediaData?: string } }>({
      queryFn: async ({ id, data }) => {
        try {
          const docRef = doc(db, "gallery", id)
          const docSnap = await getDoc(docRef)
          if (!docSnap.exists()) {
            return { error: { status: "CUSTOM_ERROR", error: "Item not found", data: "Item not found" } }
          }

          const existing = docSnap.data()
          const existingUrl = existing.url || ""
          let newUrl: string | null = null

          // Decide URL update
          if (data.sourceType === "file" && data.mediaData && data.mediaData.trim()) {
            // If mediaData is storage URL, reuse
            if (isFirebaseStorageUrl(data.mediaData)) {
              newUrl = data.mediaData
            } else {
              try {
                const isVideo = (data.type || existing.type) === "video"
                const fileExtension = data.mediaData.startsWith("data:")
                  ? data.mediaData.split(";")[0].split("/")[1] || (isVideo ? "mp4" : "jpg")
                  : isVideo ? "mp4" : "jpg"
                const storagePath = `gallery/${id}/media.${fileExtension}`
                newUrl = await uploadImageToStorage(data.mediaData, storagePath)
                // Delete old media if it was in Storage and different
                if (existingUrl && isFirebaseStorageUrl(existingUrl) && existingUrl !== newUrl) {
                  try {
                    await deleteImageFromStorage(existingUrl)
                  } catch (delErr: any) {
                    console.warn("⚠️ Error deleting old media:", delErr?.message)
                  }
                }
              } catch (e: any) {
                console.error("❌ Upload failed:", e)
                newUrl = existingUrl
              }
            }
          } else if (data.url !== undefined) {
            // If explicit url change
            newUrl = data.url || ""
            // Removal case: delete existing storage media if clearing
            if (!newUrl && existingUrl && isFirebaseStorageUrl(existingUrl)) {
              try {
                await deleteImageFromStorage(existingUrl)
              } catch (delErr: any) {
                console.warn("⚠️ Error deleting media:", delErr?.message)
              }
            }
          } else {
            newUrl = existingUrl
          }

          const updateData: any = { updatedAt: serverTimestamp() }
          if (data.type !== undefined) updateData.type = data.type
          if (data.sourceType !== undefined) updateData.sourceType = data.sourceType
          if (data.title !== undefined) updateData.title = data.title?.trim?.() || ""
          if (data.description !== undefined) updateData.description = data.description?.trim?.() || ""
          if (data.status !== undefined) updateData.status = data.status
          if (newUrl !== null) updateData.url = newUrl

          await updateDoc(docRef, updateData)
          return { data: { success: true } }
        } catch (error: any) {
          console.error("❌ Error updating gallery item:", error)
          return { error: { status: "CUSTOM_ERROR", error: error.message || "Failed to update item", data: error.message || "Failed to update item" } }
        }
      },
      invalidatesTags: (result, error, { id }) => [{ type: "Gallery", id }, "Gallery"],
    }),
    deleteGalleryItem: builder.mutation<{ success: boolean }, string>({
      queryFn: async (id: string) => {
        try {
          const docRef = doc(db, "gallery", id)
          const docSnap = await getDoc(docRef)
          if (!docSnap.exists()) {
            return { error: { status: "CUSTOM_ERROR", error: "Item not found", data: "Item not found" } }
          }
          const data = docSnap.data()
          const existingUrl = data.url || ""
          if (existingUrl && isFirebaseStorageUrl(existingUrl)) {
            try {
              await deleteImageFromStorage(existingUrl)
            } catch (delErr: any) {
              console.warn("⚠️ Error deleting media:", delErr?.message)
            }
          }
          await deleteDoc(docRef)
          return { data: { success: true } }
        } catch (error: any) {
          console.error("❌ Error deleting gallery item:", error)
          return { error: { status: "CUSTOM_ERROR", error: error.message || "Failed to delete item", data: error.message || "Failed to delete item" } }
        }
      },
      invalidatesTags: ["Gallery"],
    }),
  }),
})

export const {
  useGetGalleryQuery,
  useCreateGalleryItemMutation,
  useUpdateGalleryItemMutation,
  useDeleteGalleryItemMutation,
} = galleryApi
