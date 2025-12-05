import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, Timestamp, serverTimestamp } from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { db, auth } from "@/lib/firebase/config"
// Image upload logic commented out - storing base64 directly in Firestore
// import { uploadImageToStorage, deleteImageFromStorage, isFirebaseStorageUrl } from "@/lib/utils/storage"
import type { Customer } from "@/data/customers"

export interface CustomersResponse {
  customers: Customer[]
  total: number
}

export interface CustomerResponse {
  customer: Customer | null
}

// Helper function to convert Firestore timestamp to date string
const convertTimestamp = (timestamp: any): string => {
  if (!timestamp) return new Date().toISOString().split("T")[0]

  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString().split("T")[0]
  }

  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString().split("T")[0]
  }

  if (typeof timestamp === "string") {
    return timestamp
  }

  return new Date().toISOString().split("T")[0]
}

// Helper function to convert Firestore document to Customer
const convertFirestoreDocToCustomer = (docData: any, docId: string): Customer => {
  // Get firstName and lastName directly from Firebase
  const firstName = docData.firstName || ""
  const lastName = docData.lastName || ""

  // Build full name from firstName and lastName
  const fullName = `${firstName} ${lastName}`.trim() || docData.name || "Unknown"

  // Get phone number - Firebase uses mobileNumber
  const phoneNumber = docData.mobileNumber || docData.phone || docData.mobile || ""

  // Determine status - default to active if role is customer
  let status: "active" | "inactive" = "active"
  if (docData.status === "active" || docData.status === "inactive") {
    status = docData.status
  } else if (docData.isActive === false) {
    status = "inactive"
  } else if (docData.role === "customer") {
    status = "active" // Default for customers
  }

  return {
    id: docId || docData.id || "",
    name: fullName,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    avatar: docData.image || docData.avatar || docData.profilePicture || undefined,
    age: docData.age || undefined,
    email: docData.email || "",
    phone: phoneNumber,
    mobileNumber: docData.mobileNumber || undefined,
    city: docData.city || docData.address?.city || "",
    totalOrders: docData.totalOrders || docData.ordersCount || docData.orders?.length || 0,
    status: status,
    joinDate: convertTimestamp(docData.createdAt || docData.joinDate || docData.created),
    // Address Information - Firebase uses different field names
    houseNo: docData.houseNoBuildingName || docData.houseNo || docData.address?.houseNo || undefined,
    roadName: docData.roadNameAreaColony || docData.roadName || docData.address?.roadName || undefined,
    nearbyLandmark: docData.nearbyLandmark || docData.address?.nearbyLandmark || undefined,
    state: docData.state || docData.address?.state || undefined,
    pincode: docData.pincode || docData.address?.pincode || undefined,
    addressType: docData.addressType || docData.address?.type || undefined,
  }
}

export const customersApi = createApi({
  reducerPath: "customersApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Customers"],
  endpoints: (builder) => ({
    getCustomers: builder.query<CustomersResponse, void>({
      queryFn: async () => {
        try {
          console.log("🔥 Fetching customers from Firestore...")

          const customersRef = collection(db, "customers")
          const querySnapshot = await getDocs(customersRef)

          console.log(`✅ Found ${querySnapshot.size} customers in Firestore`)

          const customers: Customer[] = querySnapshot.docs.map((docSnapshot) => {
            const docData = docSnapshot.data()
            console.log(`📄 Processing customer document ${docSnapshot.id}:`, {
              firstName: docData.firstName,
              lastName: docData.lastName,
              email: docData.email,
              mobileNumber: docData.mobileNumber,
              city: docData.city,
            })
            return convertFirestoreDocToCustomer(docData, docSnapshot.id)
          })

          console.log(`✅ Converted ${customers.length} customers:`, customers.map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            city: c.city,
          })))

          // Sort by joinDate descending (newest first)
          customers.sort((a, b) => {
            const dateA = new Date(a.joinDate).getTime()
            const dateB = new Date(b.joinDate).getTime()
            return dateB - dateA
          })

          return {
            data: {
              customers,
              total: customers.length,
            },
          }
        } catch (error: any) {
          console.error("❌ Error fetching customers:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch customers",
              data: error.message || "Failed to fetch customers",
            },
          }
        }
      },
      providesTags: ["Customers"],
    }),
    getCustomerById: builder.query<CustomerResponse, string>({
      queryFn: async (customerId: string) => {
        try {
          console.log(`🔥 Fetching customer ${customerId} from Firestore...`)

          const customerDocRef = doc(db, "customers", customerId)
          const customerDoc = await getDoc(customerDocRef)

          if (!customerDoc.exists()) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Customer not found",
                data: "Customer not found",
              },
            }
          }

          const docData = customerDoc.data()
          const customer = convertFirestoreDocToCustomer(docData, customerDoc.id)

          return {
            data: {
              customer,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error fetching customer ${customerId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch customer",
              data: error.message || "Failed to fetch customer",
            },
          }
        }
      },
      providesTags: (result, error, customerId) => [{ type: "Customers", id: customerId }],
    }),
    createCustomer: builder.mutation<{ success: boolean; customerId: string }, any>({
      queryFn: async (customerData) => {
        try {
          console.log("🔥 Creating new customer with Firebase Authentication...", customerData)

          // Get email and password for Firebase Auth
          const email = customerData.emailAddress || customerData.email || ""
          const password = customerData.password || ""

          // Validate email and password
          if (!email || !password) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Email and password are required to create a customer",
                data: "Email and password are required to create a customer",
              },
            }
          }

          // Step 1: Create Firebase Authentication user
          console.log("🔐 Creating Firebase Auth user...")
          let firebaseUser
          let uid: string

          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            firebaseUser = userCredential.user
            uid = firebaseUser.uid
            console.log(`✅ Firebase Auth user created successfully with UID: ${uid}`)
          } catch (authError: any) {
            console.error("❌ Error creating Firebase Auth user:", authError)

            // Handle specific Firebase Auth errors
            let errorMessage = "Failed to create customer authentication"
            if (authError.code === "auth/email-already-in-use") {
              errorMessage = "This email is already registered. Please use a different email."
            } else if (authError.code === "auth/invalid-email") {
              errorMessage = "Invalid email address. Please check and try again."
            } else if (authError.code === "auth/weak-password") {
              errorMessage = "Password is too weak. Please use a stronger password (at least 6 characters)."
            } else if (authError.message) {
              errorMessage = authError.message
            }

            return {
              error: {
                status: "CUSTOM_ERROR",
                error: errorMessage,
                data: errorMessage,
              },
            }
          }

          // Step 2: Generate unique document ID for Firestore
          const customersRef = collection(db, "customers")
          const newCustomerRef = doc(customersRef)
          const customerId = newCustomerRef.id

          // Step 3: Store image as base64 directly in Firestore (no Storage upload)
          let imageUrl: string | null = null
          imageUrl = customerData.image || customerData.avatar || null

          // Step 4: Prepare customer data for Firestore
          const firestoreData: any = {
            id: customerId,
            uid: uid, // Store Firebase Auth UID
            firstName: customerData.firstName || "",
            lastName: customerData.lastName || "",
            email: email,
            mobileNumber: customerData.mobileNumber || customerData.phone || "",
            age: customerData.age || null,
            city: customerData.city || null,
            state: customerData.state || null,
            pincode: customerData.pincode || null,
            houseNoBuildingName: customerData.houseNo || null,
            roadNameAreaColony: customerData.roadName || null,
            nearbyLandmark: customerData.nearbyLandmark || null,
            addressType: customerData.addressType || null,
            role: "customer",
            status: customerData.status || "active",
            image: imageUrl,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }

          // Remove null/undefined/empty fields
          Object.keys(firestoreData).forEach((key) => {
            if (firestoreData[key] === null || firestoreData[key] === undefined || firestoreData[key] === "") {
              delete firestoreData[key]
            }
          })

          console.log("📝 Saving customer data to Firestore:", firestoreData)

          // Step 5: Save to Firestore
          try {
            await setDoc(newCustomerRef, firestoreData)
            console.log(`✅ Customer created successfully with ID: ${customerId} and UID: ${uid}`)
          } catch (firestoreError: any) {
            console.error("❌ Error saving customer to Firestore:", firestoreError)

            // If Firestore save fails, we should clean up the Firebase Auth user
            // However, deleting a user requires admin privileges on client-side
            // Log a warning for manual cleanup if needed
            console.warn(`⚠️ Firebase Auth user created (UID: ${uid}) but Firestore save failed. Manual cleanup may be required.`)

            return {
              error: {
                status: "CUSTOM_ERROR",
                error: firestoreError.message || "Failed to save customer data. Please try again.",
                data: firestoreError.message || "Failed to save customer data. Please try again.",
              },
            }
          }

          return {
            data: {
              success: true,
              customerId: customerId,
            },
          }
        } catch (error: any) {
          console.error("❌ Error creating customer:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to create customer",
              data: error.message || "Failed to create customer",
            },
          }
        }
      },
      invalidatesTags: ["Customers"],
    }),
    updateCustomer: builder.mutation<{ success: boolean }, { customerId: string; customerData: any }>({
      queryFn: async ({ customerId, customerData }) => {
        try {
          console.log(`🔥 Updating customer ${customerId} in Firestore...`, customerData)

          // Get existing customer document
          const customerDocRef = doc(db, "customers", customerId)
          const customerDoc = await getDoc(customerDocRef)

          if (!customerDoc.exists()) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Customer not found",
                data: "Customer not found",
              },
            }
          }

          const existingData = customerDoc.data()
          const existingImageUrl = existingData.image || existingData.avatar || null
          const newImageData = customerData.image || customerData.avatar

          // Image upload logic commented out - storing base64 directly in Firestore
          // Handle image update
          // let imageUrl: string | null = existingImageUrl
          // let shouldDeleteOldImage = false
          // 
          // if (newImageData) {
          //   if (isFirebaseStorageUrl(newImageData)) {
          //     // Already a Firebase Storage URL (not changed)
          //     imageUrl = newImageData
          //   } else {
          //     // New image uploaded (base64 or file object)
          //     // Delete old image from storage if it exists
          //     if (existingImageUrl && isFirebaseStorageUrl(existingImageUrl)) {
          //       shouldDeleteOldImage = true
          //     }
          //     
          //     // Upload new image
          //     const fileExtension = newImageData.startsWith("data:image/") 
          //       ? newImageData.split(";")[0].split("/")[1] || "jpg"
          //       : "jpg"
          //     const storagePath = `customers/${customerId}/image.${fileExtension}`
          //     
          //     console.log("📤 Uploading new customer image to Firebase Storage...")
          //     imageUrl = await uploadImageToStorage(newImageData, storagePath)
          //     
          //     // Delete old image after successful upload
          //     if (shouldDeleteOldImage && existingImageUrl) {
          //       console.log("🗑️ Deleting old customer image from Firebase Storage...")
          //       try {
          //         await deleteImageFromStorage(existingImageUrl)
          //       } catch (deleteError) {
          //         console.warn("⚠️ Failed to delete old image, but continuing with update:", deleteError)
          //       }
          //     }
          //   }
          // }

          // Store image as base64 directly in Firestore (no Storage upload)
          let imageUrl: string | null = existingImageUrl
          if (newImageData) {
            // Update image if new one provided
            imageUrl = newImageData
          }

          // Prepare update data (don't update email)
          const updateData: any = {
            firstName: customerData.firstName || "",
            lastName: customerData.lastName || "",
            // email is NOT updated - kept from existing document
            mobileNumber: customerData.mobileNumber || customerData.phone || "",
            age: customerData.age || null,
            city: customerData.city || null,
            state: customerData.state || null,
            pincode: customerData.pincode || null,
            houseNoBuildingName: customerData.houseNo || null,
            roadNameAreaColony: customerData.roadName || null,
            nearbyLandmark: customerData.nearbyLandmark || null,
            addressType: customerData.addressType || null,
            status: customerData.status || "active",
            updatedAt: serverTimestamp(),
          }

          // Only update image if it changed
          if (imageUrl !== existingImageUrl) {
            updateData.image = imageUrl
          }

          // Remove null/undefined/empty fields
          Object.keys(updateData).forEach((key) => {
            if (updateData[key] === null || updateData[key] === undefined || updateData[key] === "") {
              delete updateData[key]
            }
          })

          console.log("📝 Updating customer data:", updateData)

          // Update in Firestore
          await updateDoc(customerDocRef, updateData)

          console.log(`✅ Customer updated successfully: ${customerId}`)

          return {
            data: {
              success: true,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error updating customer ${customerId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to update customer",
              data: error.message || "Failed to update customer",
            },
          }
        }
      },
      invalidatesTags: (result, error, { customerId }) => [
        { type: "Customers", id: customerId },
        "Customers",
      ],
    }),
  }),
})

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
} = customersApi

