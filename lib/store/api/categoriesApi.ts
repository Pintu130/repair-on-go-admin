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
  writeBatch,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { uploadImageToStorage, deleteImageFromStorage, isFirebaseStorageUrl } from "@/lib/utils/storage"

export type CategoryStatus = "active" | "inactive"

/** Customer-facing reference photo slots (Firebase Storage URLs). */
export interface CategoryReferenceImages {
  frontView?: string
  problemArea?: string
  modelBrand?: string
}

export interface Category {
  id: string
  name: string
  description: string
  icon: string
  seoImage: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  /** Firestore: "active" | "inactive". Defaults to active if missing. */
  status?: CategoryStatus
  /** Display order (lower = first). Customer app should sort by this. */
  sortOrder?: number
  /** Reference images for booking UI (3 slots). */
  referenceImages?: CategoryReferenceImages
  /** Important guidelines shown to customers (array of strings). */
  guidelines?: string[]
  count?: number
  createdAt?: string
  updatedAt?: string
}

/** Extra fields for create/update from admin form (flat image fields + base64 payloads). */
export type CategoryFormPayload = Partial<Category> & {
  iconData?: string
  seoImageData?: string
  referenceFrontData?: string
  referenceProblemData?: string
  referenceModelData?: string
  referenceFront?: string
  referenceProblem?: string
  referenceModel?: string
}

export interface CategoriesResponse {
  categories: Category[]
  total: number
}

export interface CategoryResponse {
  category: Category | null
}

const ORDER_FALLBACK_SORT = 1_000_000

/** Numeric sortOrder from Firestore doc (≥1). Missing / invalid → large fallback. */
function getSortOrderFromDoc(data: any): number {
  const so = data?.sortOrder
  if (typeof so === "number" && !Number.isNaN(so)) {
    return Math.max(1, Math.floor(so))
  }
  if (so != null && so !== "") {
    const n = parseInt(String(so), 10)
    if (!Number.isNaN(n)) return Math.max(1, n)
  }
  return ORDER_FALLBACK_SORT
}

/**
 * Jab koi category order N leti hai, baaki sab categories jinka order ≥ N hai unko +1 karo
 * (pehle sabse bada order update karo taaki duplicate na aaye).
 * @param excludeDocId — edit mode: is category ko bump mat karo
 */
async function bumpSortOrdersFromN(
  targetOrder: number,
  excludeDocId?: string
): Promise<void> {
  const N = Math.max(1, Math.floor(targetOrder))
  const snap = await getDocs(collection(db, "categories"))
  const toBump = snap.docs
    .filter((d) => d.id !== excludeDocId)
    .map((d) => ({
      ref: d.ref,
      sortOrder: getSortOrderFromDoc(d.data()),
    }))
    .filter((x) => x.sortOrder >= N)
    .sort((a, b) => b.sortOrder - a.sortOrder)

  const BATCH_LIMIT = 450
  for (let i = 0; i < toBump.length; i += BATCH_LIMIT) {
    const chunk = toBump.slice(i, i + BATCH_LIMIT)
    const batch = writeBatch(db)
    for (const item of chunk) {
      batch.update(item.ref, {
        sortOrder: item.sortOrder + 1,
        updatedAt: serverTimestamp(),
      })
    }
    await batch.commit()
  }
}

/** Upload one reference image slot to Storage (`categories/{id}/reference/{slot}.ext`). */
async function uploadReferenceSlot(
  dataUrl: string,
  categoryId: string,
  slot: "frontView" | "problemArea" | "modelBrand"
): Promise<string | null> {
  if (!dataUrl?.trim()) return null
  try {
    const fileExtension = dataUrl.startsWith("data:image/")
      ? dataUrl.split(";")[0].split("/")[1] || "jpg"
      : "jpg"
    const storagePath = `categories/${categoryId}/reference/${slot}.${fileExtension}`
    return await uploadImageToStorage(dataUrl, storagePath)
  } catch (e) {
    console.warn("⚠️ Reference image upload failed:", slot, e)
    return null
  }
}

async function resolveReferenceImageUpdate(
  categoryId: string,
  slot: "frontView" | "problemArea" | "modelBrand",
  dataField: string | undefined,
  urlField: string | undefined,
  existingUrl: string
): Promise<string | null> {
  const existing = existingUrl || ""
  if (dataField && dataField.trim()) {
    if (isFirebaseStorageUrl(dataField)) {
      return dataField
    }
    try {
      const uploaded = await uploadReferenceSlot(dataField, categoryId, slot)
      if (
        uploaded &&
        existing &&
        isFirebaseStorageUrl(existing) &&
        existing !== uploaded
      ) {
        try {
          await deleteImageFromStorage(existing)
        } catch (delErr: any) {
          console.warn("⚠️ Error deleting old reference image:", delErr)
        }
      }
      return uploaded
    } catch (e) {
      console.warn("⚠️ Reference upload failed, keeping previous:", e)
      return existing || null
    }
  }
  if (urlField !== undefined) {
    if (!urlField) {
      if (existing && isFirebaseStorageUrl(existing)) {
        try {
          await deleteImageFromStorage(existing)
        } catch (delErr: any) {
          console.warn("⚠️ Error deleting reference image:", delErr)
        }
      }
      return null
    }
    return urlField
  }
  return existing || null
}

// Convert Firestore document to Category
const convertFirestoreDocToCategory = (docData: any, docId: string): Category => {
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

  const rawStatus = docData.status
  const s = typeof rawStatus === "string" ? rawStatus.toLowerCase() : rawStatus
  let status: CategoryStatus = "active"
  if (s === "inactive" || rawStatus === false) {
    status = "inactive"
  } else if (s === "active" || rawStatus === true) {
    status = "active"
  }

  let sortOrder: number | undefined
  const so = docData.sortOrder
  if (typeof so === "number" && !Number.isNaN(so)) {
    sortOrder = Math.floor(so)
  } else if (so != null && so !== "") {
    const n = parseInt(String(so), 10)
    if (!Number.isNaN(n)) sortOrder = n
  }
  if (sortOrder !== undefined && sortOrder < 1) {
    sortOrder = 1
  }

  const rawRef = docData.referenceImages || {}
  const referenceImages: CategoryReferenceImages | undefined =
    rawRef && typeof rawRef === "object"
      ? {
          frontView:
            typeof rawRef.frontView === "string" && rawRef.frontView.trim()
              ? rawRef.frontView
              : undefined,
          problemArea:
            typeof rawRef.problemArea === "string" && rawRef.problemArea.trim()
              ? rawRef.problemArea
              : undefined,
          modelBrand:
            typeof rawRef.modelBrand === "string" && rawRef.modelBrand.trim()
              ? rawRef.modelBrand
              : undefined,
        }
      : undefined
  const hasAnyRef =
    referenceImages &&
    (referenceImages.frontView || referenceImages.problemArea || referenceImages.modelBrand)

  let guidelines: string[] | undefined
  if (Array.isArray(docData.guidelines)) {
    const g = docData.guidelines
      .filter((x: unknown) => typeof x === "string")
      .map((x: string) => x.trim())
      .filter(Boolean)
    guidelines = g.length > 0 ? g : undefined
  }

  return {
    id: docId || docData.id || "",
    name: docData.name || "",
    description: docData.description || "",
    icon: docData.icon || "",
    seoImage: docData.seoImage || "",
    seoTitle: docData.seoTitle || "",
    seoDescription: docData.seoDescription || "",
    seoKeywords: docData.seoKeywords || "",
    status,
    sortOrder,
    referenceImages: hasAnyRef ? referenceImages : undefined,
    guidelines,
    count: docData.count || 0,
    createdAt: convertTimestamp(docData.createdAt),
    updatedAt: convertTimestamp(docData.updatedAt),
  }
}

export const categoriesApi = createApi({
  reducerPath: "categoriesApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Categories"],
  endpoints: (builder) => ({
    getCategories: builder.query<CategoriesResponse, void>({
      queryFn: async () => {
        try {
          const categoriesRef = collection(db, "categories")
          const querySnapshot = await getDocs(categoriesRef)

          const categories: Category[] = querySnapshot.docs.map((docSnapshot) => {
            const docData = docSnapshot.data()
            return convertFirestoreDocToCategory(docData, docSnapshot.id)
          })

          // Sort by sortOrder (asc), then name — matches customer app list order
          const ORDER_FALLBACK = 1_000_000
          categories.sort((a, b) => {
            const oa = a.sortOrder ?? ORDER_FALLBACK
            const ob = b.sortOrder ?? ORDER_FALLBACK
            if (oa !== ob) return oa - ob
            return a.name.localeCompare(b.name)
          })

          return {
            data: {
              categories,
              total: categories.length,
            },
          }
        } catch (error: any) {
          console.error("❌ Error fetching categories:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch categories",
              data: error.message || "Failed to fetch categories",
            },
          }
        }
      },
      providesTags: ["Categories"],
    }),
    getCategoryById: builder.query<CategoryResponse, string>({
      queryFn: async (categoryId: string) => {
        try {
          const categoryDocRef = doc(db, "categories", categoryId)
          const categoryDoc = await getDoc(categoryDocRef)

          if (!categoryDoc.exists()) {
            return {
              data: {
                category: null,
              },
            }
          }

          const docData = categoryDoc.data()
          const category = convertFirestoreDocToCategory(docData, categoryDoc.id)

          return {
            data: {
              category,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error fetching category ${categoryId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch category",
              data: error.message || "Failed to fetch category",
            },
          }
        }
      },
      providesTags: (result, error, categoryId) => [{ type: "Categories", id: categoryId }],
    }),
    createCategory: builder.mutation<{ success: boolean; categoryId: string }, CategoryFormPayload>({
      queryFn: async (categoryData) => {
        try {
          // Validate required fields
          if (!categoryData.name || !categoryData.name.trim()) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Category name is required",
                data: "Category name is required",
              },
            }
          }

          // Generate unique document ID
          const categoriesRef = collection(db, "categories")
          const newCategoryRef = doc(categoriesRef)
          const categoryId = newCategoryRef.id

          // Upload images to Firebase Storage
          let iconUrl: string | null = null
          let seoImageUrl: string | null = null

          // Upload icon image
          if (categoryData.iconData && categoryData.iconData.trim()) {
            try {
              const fileExtension = categoryData.iconData.startsWith("data:image/")
                ? categoryData.iconData.split(";")[0].split("/")[1] || "jpg"
                : "jpg"
              const storagePath = `categories/${categoryId}/icon.${fileExtension}`
              
              console.log("📤 Uploading category icon to Firebase Storage...", {
                categoryId,
                storagePath,
              })
              iconUrl = await uploadImageToStorage(categoryData.iconData, storagePath)
              console.log(`✅ Category icon uploaded successfully: ${iconUrl}`)
            } catch (storageError: any) {
              console.error("❌ Error uploading icon to Storage:", storageError)
              // Continue without icon - don't fail the entire category creation
              console.warn("⚠️ Continuing category creation without icon")
            }
          }

          // Upload SEO image
          if (categoryData.seoImageData && categoryData.seoImageData.trim()) {
            try {
              const fileExtension = categoryData.seoImageData.startsWith("data:image/")
                ? categoryData.seoImageData.split(";")[0].split("/")[1] || "jpg"
                : "jpg"
              const storagePath = `categories/${categoryId}/seoImage.${fileExtension}`
              
              console.log("📤 Uploading category SEO image to Firebase Storage...", {
                categoryId,
                storagePath,
              })
              seoImageUrl = await uploadImageToStorage(categoryData.seoImageData, storagePath)
              console.log(`✅ Category SEO image uploaded successfully: ${seoImageUrl}`)
            } catch (storageError: any) {
              console.error("❌ Error uploading SEO image to Storage:", storageError)
              // Continue without SEO image - don't fail the entire category creation
              console.warn("⚠️ Continuing category creation without SEO image")
            }
          }

          // Reference images (3 slots) for customer booking UI
          let refFrontUrl: string | null = null
          let refProblemUrl: string | null = null
          let refModelUrl: string | null = null
          if (categoryData.referenceFrontData?.trim()) {
            refFrontUrl = await uploadReferenceSlot(
              categoryData.referenceFrontData,
              categoryId,
              "frontView"
            )
          }
          if (categoryData.referenceProblemData?.trim()) {
            refProblemUrl = await uploadReferenceSlot(
              categoryData.referenceProblemData,
              categoryId,
              "problemArea"
            )
          }
          if (categoryData.referenceModelData?.trim()) {
            refModelUrl = await uploadReferenceSlot(
              categoryData.referenceModelData,
              categoryId,
              "modelBrand"
            )
          }

          const guidelinesClean = Array.isArray(categoryData.guidelines)
            ? categoryData.guidelines
                .map((g) => (typeof g === "string" ? g.trim() : ""))
                .filter(Boolean)
            : []

          // Prepare Firestore data
          const status: CategoryStatus =
            categoryData.status === "inactive" ? "inactive" : "active"

          let sortOrder = 1
          /** User ne order number diya → duplicate par baaki categories +1 shift */
          let userSpecifiedSortOrder = false
          if (
            categoryData.sortOrder !== undefined &&
            categoryData.sortOrder !== null &&
            !Number.isNaN(Number(categoryData.sortOrder))
          ) {
            sortOrder = Math.max(1, Math.floor(Number(categoryData.sortOrder)))
            userSpecifiedSortOrder = true
          } else {
            const snap = await getDocs(categoriesRef)
            let max = 0
            snap.docs.forEach((d) => {
              const v = d.data()?.sortOrder
              if (typeof v === "number" && !Number.isNaN(v)) {
                max = Math.max(max, Math.floor(v))
              } else if (v != null && v !== "") {
                const n = parseInt(String(v), 10)
                if (!Number.isNaN(n)) max = Math.max(max, n)
              }
            })
            sortOrder = max + 1
          }

          if (userSpecifiedSortOrder) {
            await bumpSortOrdersFromN(sortOrder)
          }

          const firestoreData: any = {
            id: categoryId,
            name: categoryData.name.trim(),
            description: categoryData.description?.trim() || "",
            seoTitle: categoryData.seoTitle?.trim() || "",
            seoDescription: categoryData.seoDescription?.trim() || "",
            seoKeywords: categoryData.seoKeywords?.trim() || "",
            status,
            sortOrder,
            count: categoryData.count || 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }

          // Add image URLs only if they exist
          if (iconUrl) {
            firestoreData.icon = iconUrl
          }
          if (seoImageUrl) {
            firestoreData.seoImage = seoImageUrl
          }
          if (guidelinesClean.length > 0) {
            firestoreData.guidelines = guidelinesClean
          }
          const referenceImagesOut: CategoryReferenceImages = {}
          if (refFrontUrl) referenceImagesOut.frontView = refFrontUrl
          if (refProblemUrl) referenceImagesOut.problemArea = refProblemUrl
          if (refModelUrl) referenceImagesOut.modelBrand = refModelUrl
          if (Object.keys(referenceImagesOut).length > 0) {
            firestoreData.referenceImages = referenceImagesOut
          }

          // Save to Firestore
          await setDoc(newCategoryRef, firestoreData)

          return {
            data: {
              success: true,
              categoryId,
            },
          }
        } catch (error: any) {
          console.error("❌ Error creating category:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to create category",
              data: error.message || "Failed to create category",
            },
          }
        }
      },
      invalidatesTags: ["Categories"],
    }),
    updateCategory: builder.mutation<{ success: boolean }, { categoryId: string; categoryData: CategoryFormPayload }>({
      queryFn: async ({ categoryId, categoryData }) => {
        try {
          const categoryDocRef = doc(db, "categories", categoryId)
          const categoryDoc = await getDoc(categoryDocRef)

          if (!categoryDoc.exists()) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Category not found",
                data: "Category not found",
              },
            }
          }

          const existingData = categoryDoc.data()
          const existingIconUrl = existingData.icon || ""
          const existingSeoImageUrl = existingData.seoImage || ""

          // Handle icon image update
          let iconUrl: string | null = null
          if (categoryData.iconData && categoryData.iconData.trim()) {
            // Check if it's a new image (base64) or existing URL
            if (isFirebaseStorageUrl(categoryData.iconData)) {
              // It's already a Firebase Storage URL, use it as is
              iconUrl = categoryData.iconData
            } else {
              // It's a new base64 image, upload it
              try {
                const fileExtension = categoryData.iconData.startsWith("data:image/")
                  ? categoryData.iconData.split(";")[0].split("/")[1] || "jpg"
                  : "jpg"
                const storagePath = `categories/${categoryId}/icon.${fileExtension}`
                
                console.log("📤 Uploading new category icon to Firebase Storage...", {
                  categoryId,
                  storagePath,
                })
                iconUrl = await uploadImageToStorage(categoryData.iconData, storagePath)
                console.log(`✅ New category icon uploaded successfully: ${iconUrl}`)

                // Delete old icon if it exists and is different
                if (existingIconUrl && isFirebaseStorageUrl(existingIconUrl) && existingIconUrl !== iconUrl) {
                  try {
                    await deleteImageFromStorage(existingIconUrl)
                    console.log(`✅ Old category icon deleted successfully`)
                  } catch (deleteError: any) {
                    console.warn("⚠️ Error deleting old icon (continuing anyway):", deleteError)
                  }
                }
              } catch (storageError: any) {
                console.error("❌ Error uploading new icon to Storage:", storageError)
                // Revert to existing icon if upload fails
                iconUrl = existingIconUrl
                console.warn("⚠️ Reverting to existing icon")
              }
            }
          } else if (categoryData.icon !== undefined) {
            // icon field explicitly set (could be empty string to remove)
            iconUrl = categoryData.icon || null
            // If removing icon and old one exists, delete it
            if (!iconUrl && existingIconUrl && isFirebaseStorageUrl(existingIconUrl)) {
              try {
                await deleteImageFromStorage(existingIconUrl)
                console.log(`✅ Category icon deleted successfully`)
              } catch (deleteError: any) {
                console.warn("⚠️ Error deleting icon (continuing anyway):", deleteError)
              }
            }
          } else {
            // Keep existing icon
            iconUrl = existingIconUrl || null
          }

          // Handle SEO image update
          let seoImageUrl: string | null = null
          if (categoryData.seoImageData && categoryData.seoImageData.trim()) {
            // Check if it's a new image (base64) or existing URL
            if (isFirebaseStorageUrl(categoryData.seoImageData)) {
              // It's already a Firebase Storage URL, use it as is
              seoImageUrl = categoryData.seoImageData
            } else {
              // It's a new base64 image, upload it
              try {
                const fileExtension = categoryData.seoImageData.startsWith("data:image/")
                  ? categoryData.seoImageData.split(";")[0].split("/")[1] || "jpg"
                  : "jpg"
                const storagePath = `categories/${categoryId}/seoImage.${fileExtension}`
                
                console.log("📤 Uploading new category SEO image to Firebase Storage...", {
                  categoryId,
                  storagePath,
                })
                seoImageUrl = await uploadImageToStorage(categoryData.seoImageData, storagePath)
                console.log(`✅ New category SEO image uploaded successfully: ${seoImageUrl}`)

                // Delete old SEO image if it exists and is different
                if (existingSeoImageUrl && isFirebaseStorageUrl(existingSeoImageUrl) && existingSeoImageUrl !== seoImageUrl) {
                  try {
                    await deleteImageFromStorage(existingSeoImageUrl)
                    console.log(`✅ Old category SEO image deleted successfully`)
                  } catch (deleteError: any) {
                    console.warn("⚠️ Error deleting old SEO image (continuing anyway):", deleteError)
                  }
                }
              } catch (storageError: any) {
                console.error("❌ Error uploading new SEO image to Storage:", storageError)
                // Revert to existing SEO image if upload fails
                seoImageUrl = existingSeoImageUrl
                console.warn("⚠️ Reverting to existing SEO image")
              }
            }
          } else if (categoryData.seoImage !== undefined) {
            // seoImage field explicitly set (could be empty string to remove)
            seoImageUrl = categoryData.seoImage || null
            // If removing SEO image and old one exists, delete it
            if (!seoImageUrl && existingSeoImageUrl && isFirebaseStorageUrl(existingSeoImageUrl)) {
              try {
                await deleteImageFromStorage(existingSeoImageUrl)
                console.log(`✅ Category SEO image deleted successfully`)
              } catch (deleteError: any) {
                console.warn("⚠️ Error deleting SEO image (continuing anyway):", deleteError)
              }
            }
          } else {
            // Keep existing SEO image
            seoImageUrl = existingSeoImageUrl || null
          }

          const existingRef = (existingData.referenceImages || {}) as CategoryReferenceImages

          const refFrontFinal = await resolveReferenceImageUpdate(
            categoryId,
            "frontView",
            categoryData.referenceFrontData,
            categoryData.referenceFront,
            existingRef.frontView || ""
          )
          const refProblemFinal = await resolveReferenceImageUpdate(
            categoryId,
            "problemArea",
            categoryData.referenceProblemData,
            categoryData.referenceProblem,
            existingRef.problemArea || ""
          )
          const refModelFinal = await resolveReferenceImageUpdate(
            categoryId,
            "modelBrand",
            categoryData.referenceModelData,
            categoryData.referenceModel,
            existingRef.modelBrand || ""
          )

          // Prepare update data
          const updateData: any = {
            updatedAt: serverTimestamp(),
          }

          if (categoryData.name !== undefined) {
            updateData.name = categoryData.name.trim()
          }
          if (categoryData.description !== undefined) {
            updateData.description = categoryData.description.trim()
          }
          if (categoryData.seoTitle !== undefined) {
            updateData.seoTitle = categoryData.seoTitle.trim()
          }
          if (categoryData.seoDescription !== undefined) {
            updateData.seoDescription = categoryData.seoDescription.trim()
          }
          if (categoryData.seoKeywords !== undefined) {
            updateData.seoKeywords = categoryData.seoKeywords.trim()
          }
          if (categoryData.count !== undefined) {
            updateData.count = categoryData.count
          }
          if (categoryData.status !== undefined) {
            updateData.status =
              categoryData.status === "inactive" ? "inactive" : "active"
          }

          const oldSortOrder = getSortOrderFromDoc(existingData)
          let resolvedNewSortOrder: number | null = null
          if (categoryData.sortOrder !== undefined && categoryData.sortOrder !== null) {
            const n = Number(categoryData.sortOrder)
            if (!Number.isNaN(n)) {
              resolvedNewSortOrder = Math.max(1, Math.floor(n))
            }
          }
          if (resolvedNewSortOrder !== null) {
            if (resolvedNewSortOrder !== oldSortOrder) {
              await bumpSortOrdersFromN(resolvedNewSortOrder, categoryId)
            }
            updateData.sortOrder = resolvedNewSortOrder
          }

          if (categoryData.guidelines !== undefined) {
            const g = Array.isArray(categoryData.guidelines)
              ? categoryData.guidelines
                  .map((x) => (typeof x === "string" ? x.trim() : ""))
                  .filter(Boolean)
              : []
            updateData.guidelines = g
          }

          const nextReferenceImages: CategoryReferenceImages = {}
          if (refFrontFinal) nextReferenceImages.frontView = refFrontFinal
          if (refProblemFinal) nextReferenceImages.problemArea = refProblemFinal
          if (refModelFinal) nextReferenceImages.modelBrand = refModelFinal
          updateData.referenceImages = nextReferenceImages

          // Update image URLs
          if (iconUrl !== null) {
            updateData.icon = iconUrl || ""
          }
          if (seoImageUrl !== null) {
            updateData.seoImage = seoImageUrl || ""
          }

          // Update in Firestore
          await updateDoc(categoryDocRef, updateData)

          return {
            data: {
              success: true,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error updating category ${categoryId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to update category",
              data: error.message || "Failed to update category",
            },
          }
        }
      },
      invalidatesTags: (result, error, { categoryId }) => [
        { type: "Categories", id: categoryId },
        "Categories",
      ],
    }),
    deleteCategory: builder.mutation<{ success: boolean }, string>({
      queryFn: async (categoryId: string) => {
        try {
          const categoryDocRef = doc(db, "categories", categoryId)
          const categoryDoc = await getDoc(categoryDocRef)

          if (!categoryDoc.exists()) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Category not found",
                data: "Category not found",
              },
            }
          }

          const docData = categoryDoc.data()
          const iconUrl = docData.icon || ""
          const seoImageUrl = docData.seoImage || ""
          const refImages = (docData.referenceImages || {}) as CategoryReferenceImages

          // Delete images from Storage
          if (iconUrl && isFirebaseStorageUrl(iconUrl)) {
            try {
              await deleteImageFromStorage(iconUrl)
              console.log(`✅ Category icon deleted from Storage`)
            } catch (deleteError: any) {
              console.warn("⚠️ Error deleting icon from Storage (continuing anyway):", deleteError)
            }
          }

          if (seoImageUrl && isFirebaseStorageUrl(seoImageUrl)) {
            try {
              await deleteImageFromStorage(seoImageUrl)
              console.log(`✅ Category SEO image deleted from Storage`)
            } catch (deleteError: any) {
              console.warn("⚠️ Error deleting SEO image from Storage (continuing anyway):", deleteError)
            }
          }

          for (const key of ["frontView", "problemArea", "modelBrand"] as const) {
            const u = refImages[key]
            if (u && isFirebaseStorageUrl(u)) {
              try {
                await deleteImageFromStorage(u)
                console.log(`✅ Category reference image ${key} deleted from Storage`)
              } catch (deleteError: any) {
                console.warn(`⚠️ Error deleting reference ${key} (continuing anyway):`, deleteError)
              }
            }
          }

          // Delete category document from Firestore
          await deleteDoc(categoryDocRef)

          return {
            data: {
              success: true,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error deleting category ${categoryId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to delete category",
              data: error.message || "Failed to delete category",
            },
          }
        }
      },
      invalidatesTags: ["Categories"],
    }),
  }),
})

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi

