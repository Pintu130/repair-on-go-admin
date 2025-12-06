import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, Timestamp, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { uploadImageToStorage, deleteImageFromStorage, isFirebaseStorageUrl } from "@/lib/utils/storage"

export interface Category {
  id: string
  name: string
  description: string
  icon: string
  seoImage: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  count?: number
  createdAt?: string
  updatedAt?: string
}

export interface CategoriesResponse {
  categories: Category[]
  total: number
}

export interface CategoryResponse {
  category: Category | null
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

  return {
    id: docId || docData.id || "",
    name: docData.name || "",
    description: docData.description || "",
    icon: docData.icon || "",
    seoImage: docData.seoImage || "",
    seoTitle: docData.seoTitle || "",
    seoDescription: docData.seoDescription || "",
    seoKeywords: docData.seoKeywords || "",
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

          // Sort by name alphabetically
          categories.sort((a, b) => a.name.localeCompare(b.name))

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
    createCategory: builder.mutation<{ success: boolean; categoryId: string }, Partial<Category> & { iconData?: string; seoImageData?: string }>({
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

          // Prepare Firestore data
          const firestoreData: any = {
            id: categoryId,
            name: categoryData.name.trim(),
            description: categoryData.description?.trim() || "",
            seoTitle: categoryData.seoTitle?.trim() || "",
            seoDescription: categoryData.seoDescription?.trim() || "",
            seoKeywords: categoryData.seoKeywords?.trim() || "",
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
    updateCategory: builder.mutation<{ success: boolean }, { categoryId: string; categoryData: Partial<Category> & { iconData?: string; seoImageData?: string } }>({
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

