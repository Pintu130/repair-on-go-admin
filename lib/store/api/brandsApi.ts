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
import { uploadImageToStorage, deleteImageFromStorage, isFirebaseStorageUrl } from "@/lib/utils/storage"

export type BrandStatus = "active" | "inactive"

export interface Brand {
  id: string
  name: string
  image: string
  status: BrandStatus
  createdAt?: string
  updatedAt?: string
}

/** Extra fields for create/update from admin form (base64 payloads). */
export type BrandFormPayload = Partial<Brand> & {
  imageData?: string
}

// Helper function to convert Firestore document to Brand
function convertDocToBrand(doc: any): Brand {
  const data = doc.data()
  return {
    id: doc.id,
    name: data.name || "",
    image: data.image || "",
    status: data.status || "active",
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || "",
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || "",
  }
}

// Helper function to generate storage path for brand images
function getBrandImagePath(brandId: string, fileName: string): string {
  return `brands/${brandId}/${fileName}`
}

// Helper function to extract file name from URL or generate random name
function getImageFileName(imageUrl?: string, imageData?: string): string {
  if (imageUrl && isFirebaseStorageUrl(imageUrl)) {
    // Extract existing file name from Firebase Storage URL
    const urlParts = imageUrl.split("/")
    return urlParts[urlParts.length - 1].split("?")[0]
  }
  
  if (imageData) {
    // Generate random file name for new uploads
    const randomId = Math.random().toString(36).substring(2, 15)
    const mimeType = imageData.split(":")[1]?.split(";")[0] || "image/jpeg"
    const extension = mimeType.split("/")[1] || "jpg"
    return `brand_${randomId}.${extension}`
  }
  
  return `brand_${Date.now()}.jpg`
}

// Create the RTK Query API
export const brandsApi = createApi({
  reducerPath: "brandsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/",
  }),
  tagTypes: ["Brand"],
  endpoints: (builder) => ({
    // Get all brands
    getBrands: builder.query<{ brands: Brand[] }, void>({
      queryFn: async () => {
        try {
          const brandsCollection = collection(db, "brands")
          const snapshot = await getDocs(brandsCollection)
          const brands = snapshot.docs.map(convertDocToBrand)
          
          // Sort by createdAt (newest first) or name if no date
          brands.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            }
            return a.name.localeCompare(b.name)
          })

          return { data: { brands } }
        } catch (error: any) {
          console.error("❌ Error fetching brands:", error)
          return {
            error: {
              status: 500,
              data: { error: error.message || "Failed to fetch brands" },
            },
          }
        }
      },
      providesTags: ["Brand"],
    }),

    // Get single brand by ID
    getBrandById: builder.query<Brand, string>({
      queryFn: async (brandId) => {
        try {
          const brandDoc = doc(db, "brands", brandId)
          const snapshot = await getDoc(brandDoc)
          
          if (!snapshot.exists()) {
            return {
              error: {
                status: 404,
                data: { error: "Brand not found" },
              },
            }
          }

          const brand = convertDocToBrand(snapshot)
          return { data: brand }
        } catch (error: any) {
          console.error("❌ Error fetching brand:", error)
          return {
            error: {
              status: 500,
              data: { error: error.message || "Failed to fetch brand" },
            },
          }
        }
      },
      providesTags: (result, error, brandId) => [{ type: "Brand", id: brandId }],
    }),

    // Create new brand
    createBrand: builder.mutation<Brand, BrandFormPayload>({
      queryFn: async (brandData) => {
        try {
          if (!brandData.name?.trim()) {
            return {
              error: {
                status: 400,
                data: { error: "Brand name is required" },
              },
            }
          }

          // Generate new brand ID
          const brandId = doc(collection(db, "brands")).id
          let imageUrl = brandData.image || ""

          // Handle image upload if new image data is provided
          if (brandData.imageData && brandData.imageData.startsWith("data:image/")) {
            try {
              const fileName = getImageFileName(undefined, brandData.imageData)
              const imagePath = getBrandImagePath(brandId, fileName)
              imageUrl = await uploadImageToStorage(brandData.imageData, imagePath)
            } catch (uploadError: any) {
              console.error("❌ Error uploading brand image:", uploadError)
              return {
                error: {
                  status: 500,
                  data: { error: `Failed to upload image: ${uploadError.message}` },
                },
              }
            }
          }

          // Create brand document
          const brandDoc = doc(db, "brands", brandId)
          const now = serverTimestamp()
          
          await setDoc(brandDoc, {
            name: brandData.name.trim(),
            image: imageUrl,
            status: brandData.status || "active",
            createdAt: now,
            updatedAt: now,
          })

          // Return the created brand
          const createdBrand: Brand = {
            id: brandId,
            name: brandData.name.trim(),
            image: imageUrl,
            status: brandData.status || "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          return { data: createdBrand }
        } catch (error: any) {
          console.error("❌ Error creating brand:", error)
          return {
            error: {
              status: 500,
              data: { error: error.message || "Failed to create brand" },
            },
          }
        }
      },
      invalidatesTags: ["Brand"],
    }),

    // Update existing brand
    updateBrand: builder.mutation<Brand, { categoryId: string; categoryData: BrandFormPayload }>({
      queryFn: async ({ categoryId, categoryData }) => {
        try {
          if (!categoryData.name?.trim()) {
            return {
              error: {
                status: 400,
                data: { error: "Brand name is required" },
              },
            }
          }

          const brandDoc = doc(db, "brands", categoryId)
          const brandSnapshot = await getDoc(brandDoc)

          if (!brandSnapshot.exists()) {
            return {
              error: {
                status: 404,
                data: { error: "Brand not found" },
              },
            }
          }

          const existingBrand = convertDocToBrand(brandSnapshot)
          let imageUrl = categoryData.image || existingBrand.image
          let oldImageUrl: string | undefined

          // Handle image update if new image data is provided
          if (categoryData.imageData && categoryData.imageData.startsWith("data:image/")) {
            try {
              // Delete old image if it exists and is from Firebase Storage
              if (existingBrand.image && isFirebaseStorageUrl(existingBrand.image)) {
                oldImageUrl = existingBrand.image
              }

              // Upload new image
              const fileName = getImageFileName(undefined, categoryData.imageData)
              const imagePath = getBrandImagePath(categoryId, fileName)
              imageUrl = await uploadImageToStorage(categoryData.imageData, imagePath)
            } catch (uploadError: any) {
              console.error("❌ Error uploading brand image:", uploadError)
              return {
                error: {
                  status: 500,
                  data: { error: `Failed to upload image: ${uploadError.message}` },
                },
              }
            }
          }

          // Update brand document
          const updateData: any = {
            name: categoryData.name.trim(),
            status: categoryData.status || existingBrand.status,
            updatedAt: serverTimestamp(),
          }

          // Only update image if it changed
          if (imageUrl !== existingBrand.image) {
            updateData.image = imageUrl
          }

          await updateDoc(brandDoc, updateData)

          // Delete old image after successful update
          if (oldImageUrl) {
            try {
              await deleteImageFromStorage(oldImageUrl)
              console.log("✅ Old brand image deleted successfully")
            } catch (deleteError: any) {
              console.warn("⚠️ Warning: Failed to delete old brand image:", deleteError)
              // Don't fail the operation if image deletion fails
            }
          }

          // Return the updated brand
          const updatedBrand: Brand = {
            id: categoryId,
            name: categoryData.name.trim(),
            image: imageUrl,
            status: categoryData.status || existingBrand.status,
            createdAt: existingBrand.createdAt,
            updatedAt: new Date().toISOString(),
          }

          return { data: updatedBrand }
        } catch (error: any) {
          console.error("❌ Error updating brand:", error)
          return {
            error: {
              status: 500,
              data: { error: error.message || "Failed to update brand" },
            },
          }
        }
      },
      invalidatesTags: (result, error, { categoryId }) => [{ type: "Brand", id: categoryId }, "Brand"],
    }),

    // Delete brand
    deleteBrand: builder.mutation<void, string>({
      queryFn: async (brandId) => {
        try {
          const brandDoc = doc(db, "brands", brandId)
          const brandSnapshot = await getDoc(brandDoc)

          if (!brandSnapshot.exists()) {
            return {
              error: {
                status: 404,
                data: { error: "Brand not found" },
              },
            }
          }

          const existingBrand = convertDocToBrand(brandSnapshot)

          // Delete brand image if it exists and is from Firebase Storage
          if (existingBrand.image && isFirebaseStorageUrl(existingBrand.image)) {
            try {
              await deleteImageFromStorage(existingBrand.image)
              console.log("✅ Brand image deleted successfully")
            } catch (deleteError: any) {
              console.warn("⚠️ Warning: Failed to delete brand image:", deleteError)
              // Don't fail the operation if image deletion fails
            }
          }

          // Delete brand document
          await deleteDoc(brandDoc)

          return { data: undefined }
        } catch (error: any) {
          console.error("❌ Error deleting brand:", error)
          return {
            error: {
              status: 500,
              data: { error: error.message || "Failed to delete brand" },
            },
          }
        }
      },
      invalidatesTags: ["Brand"],
    }),
  }),
})

// Export hooks
export const {
  useGetBrandsQuery,
  useGetBrandByIdQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} = brandsApi
