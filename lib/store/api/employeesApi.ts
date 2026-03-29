import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, Timestamp, serverTimestamp } from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { db, auth } from "@/lib/firebase/config"
import { uploadImageToStorage, deleteImageFromStorage, deleteFileFromStorage, isFirebaseStorageUrl } from "@/lib/utils/storage"
import type { Employee } from "@/data/employees"

export interface EmployeesResponse {
  employees: Employee[]
  total: number
}

export interface EmployeeResponse {
  employee: Employee | null
}

// Helper function to convert Firestore timestamp to date string with time
const convertTimestamp = (timestamp: any): string => {
  if (!timestamp) return new Date().toISOString()

  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString()
  }

  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString()
  }

  if (typeof timestamp === "string") {
    return timestamp
  }

  return new Date().toISOString()
}

// Helper function to convert Firestore document to Employee
const convertFirestoreDocToEmployee = (docData: any, docId: string): Employee => {
  // Build full name from firstName and lastName
  const fullName = `${docData.firstName || ""} ${docData.lastName || ""}`.trim() || docData.name || "Unknown"

  // Determine status - default to active if role is employee
  let status: "active" | "inactive" = "active"
  if (docData.status === "active" || docData.status === "inactive") {
    status = docData.status
  } else if (docData.isActive === false) {
    status = "inactive"
  } else if (docData.role === "employee") {
    status = "active" // Default for employees
  }

  return {
    id: docId || docData.id || "",
    uid: docData.uid || "",
    name: fullName,
    firstName: docData.firstName || undefined,
    lastName: docData.lastName || undefined,
    avatar: docData.image || docData.avatar || docData.profilePicture || undefined,
    age: docData.age || undefined,
    email: docData.email || "",
    phone: docData.phone || docData.mobileNumber || "",
    mobileNumber: docData.phone || docData.mobileNumber || undefined,
    address: docData.address || "",
    aadharNumber: docData.aadharNumber || undefined,
    panCardNumber: docData.panCardNumber || undefined,
    employeeFile: docData.employeeFile || undefined,
    status: status,
    joinDate: convertTimestamp(docData.createdAt || docData.joinDate || docData.created),
    tasksAssigned: docData.tasksAssigned || 0,
    performanceScore: docData.performanceScore || 0,
  }
}

export const employeesApi = createApi({
  reducerPath: "employeesApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Employees"],
  endpoints: (builder) => ({
    getEmployees: builder.query<EmployeesResponse, void>({
      queryFn: async () => {
        try {
          const employeesRef = collection(db, "employees")
          const querySnapshot = await getDocs(employeesRef)

          const employees: Employee[] = querySnapshot.docs.map((docSnapshot) => {
            const docData = docSnapshot.data()
            return convertFirestoreDocToEmployee(docData, docSnapshot.id)
          })

          // Sort by joinDate descending (newest first)
          employees.sort((a, b) => {
            const dateA = new Date(a.joinDate).getTime()
            const dateB = new Date(b.joinDate).getTime()
            return dateB - dateA
          })

          return {
            data: {
              employees,
              total: employees.length,
            },
          }
        } catch (error: any) {
          console.error("❌ Error fetching employees:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch employees",
              data: error.message || "Failed to fetch employees",
            },
          }
        }
      },
      providesTags: ["Employees"],
    }),
    getEmployeeById: builder.query<EmployeeResponse, string>({
      queryFn: async (employeeId: string) => {
        try {
          console.log(`🔥 Fetching employee ${employeeId} from Firestore...`)

          const employeeDocRef = doc(db, "employees", employeeId)
          const employeeDoc = await getDoc(employeeDocRef)

          if (!employeeDoc.exists()) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Employee not found",
                data: "Employee not found",
              },
            }
          }

          const docData = employeeDoc.data()
          const employee = convertFirestoreDocToEmployee(docData, employeeDoc.id)

          return {
            data: {
              employee,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error fetching employee ${employeeId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch employee",
              data: error.message || "Failed to fetch employee",
            },
          }
        }
      },
      providesTags: (result, error, employeeId) => [{ type: "Employees", id: employeeId }],
    }),
    createEmployee: builder.mutation<{ success: boolean; employeeId: string }, any>({
      queryFn: async (employeeData) => {
        try {
          // Get email and password for Firebase Auth
          const email = employeeData.email || ""
          const password = employeeData.password || ""

          // Validate email and password
          if (!email || !password) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Email and password are required to create an employee",
                data: "Email and password are required to create an employee",
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
            let errorMessage = "Failed to create employee authentication"
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
          const employeesRef = collection(db, "employees")
          const newEmployeeRef = doc(employeesRef)
          const employeeId = newEmployeeRef.id

          // Step 3: Upload image to Firebase Storage (if image provided)
          let imageUrl: string | null = null
          const imageData = (employeeData.image || employeeData.avatar || "").trim() || null
          
          if (imageData && imageData.length > 0) {
            try {
              // Check if it's already a Firebase Storage URL (shouldn't happen on create, but just in case)
              if (isFirebaseStorageUrl(imageData)) {
                imageUrl = imageData
              } else {
                // Upload new image to Firebase Storage
                // Path: employees/{employeeId}/profile.{extension}
                const fileExtension = imageData.startsWith("data:image/")
                  ? imageData.split(";")[0].split("/")[1] || "jpg"
                  : "jpg"
                const storagePath = `employees/${employeeId}/profile.${fileExtension}`
                
                console.log("📤 Uploading employee image to Firebase Storage...", {
                  employeeId,
                  storagePath,
                  fileExtension,
                  imageDataPreview: imageData.substring(0, 50) + "...",
                })
                imageUrl = await uploadImageToStorage(imageData, storagePath)
                console.log(`✅ Employee image uploaded successfully: ${imageUrl}`)
              }
            } catch (storageError: any) {
              console.error("❌ Error uploading image to Storage:", storageError)
              // Continue without image - don't fail the entire employee creation
              console.warn("⚠️ Continuing employee creation without image")
            }
          } else {
            console.warn("⚠️ No image data provided for employee creation")
          }

          // Step 4: Upload employee file to Firebase Storage (if file provided)
          let employeeFileUrl: string | null = null
          const employeeFileData = (employeeData.employeeFile || "").trim() || null
          
          if (employeeFileData && employeeFileData.length > 0) {
            try {
              // Check if it's already a Firebase Storage URL (shouldn't happen on create, but just in case)
              if (isFirebaseStorageUrl(employeeFileData)) {
                employeeFileUrl = employeeFileData
              } else {
                // Upload new file to Firebase Storage
                // Path: employees/{employeeId}/document.{extension}
                const fileExtension = employeeFileData.startsWith("data:")
                  ? employeeFileData.split(";")[0].split("/")[1] || "pdf"
                  : "pdf"
                const storagePath = `employees/${employeeId}/document.${fileExtension}`
                
                console.log("📤 Uploading employee file to Firebase Storage...", {
                  employeeId,
                  storagePath,
                  fileExtension,
                  fileDataPreview: employeeFileData.substring(0, 50) + "...",
                })
                employeeFileUrl = await uploadImageToStorage(employeeFileData, storagePath)
                console.log(`✅ Employee file uploaded successfully: ${employeeFileUrl}`)
              }
            } catch (storageError: any) {
              console.error("❌ Error uploading file to Storage:", storageError)
              // Continue without file - don't fail the entire employee creation
              console.warn("⚠️ Continuing employee creation without file")
            }
          } else {
            console.warn("⚠️ No file data provided for employee creation")
          }

          // Step 5: Prepare employee data for Firestore
          const firestoreData: any = {
            id: employeeId,
            uid: uid, // Store Firebase Auth UID
            firstName: employeeData.firstName || "",
            lastName: employeeData.lastName || "",
            email: email,
            phone: employeeData.phone || employeeData.mobileNumber || "",
            age: employeeData.age || null,
            address: employeeData.address || null,
            aadharNumber: employeeData.aadharNumber || null,
            panCardNumber: employeeData.panCardNumber || null,
            role: "employee",
            status: employeeData.status || "active",
            tasksAssigned: 0,
            performanceScore: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }

          // Add image URL only if it exists
          if (imageUrl) {
            firestoreData.avatar = imageUrl
          }

          // Add file URL only if it exists
          if (employeeFileUrl) {
            firestoreData.employeeFile = employeeFileUrl
          }

          // Remove null/undefined/empty fields
          Object.keys(firestoreData).forEach((key) => {
            if (key !== "image" && key !== "avatar" && key !== "employeeFile" && 
                (firestoreData[key] === null || firestoreData[key] === undefined || firestoreData[key] === "")) {
              delete firestoreData[key]
            }
          })

          // Step 6: Save to Firestore
          try {
            await setDoc(newEmployeeRef, firestoreData)
          } catch (firestoreError: any) {
            console.error("❌ Error saving employee to Firestore:", firestoreError)

            return {
              error: {
                status: "CUSTOM_ERROR",
                error: firestoreError.message || "Failed to save employee data. Please try again.",
                data: firestoreError.message || "Failed to save employee data. Please try again.",
              },
            }
          }

          return {
            data: {
              success: true,
              employeeId: employeeId,
            },
          }
        } catch (error: any) {
          console.error("❌ Error creating employee:", error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to create employee",
              data: error.message || "Failed to create employee",
            },
          }
        }
      },
      invalidatesTags: ["Employees"],
    }),
    updateEmployee: builder.mutation<{ success: boolean }, { employeeId: string; employeeData: any }>({
      queryFn: async ({ employeeId, employeeData }) => {
        try {
          // Get existing employee document
          const employeeDocRef = doc(db, "employees", employeeId)
          const employeeDoc = await getDoc(employeeDocRef)

          if (!employeeDoc.exists()) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Employee not found",
                data: "Employee not found",
              },
            }
          }

          const existingData = employeeDoc.data()
          const existingImageUrl = existingData.avatar || null
          const existingFileUrl = existingData.employeeFile || null
          const newImageData = employeeData.avatar
          const newFileData = employeeData.employeeFile

          // Handle image update - Upload to Firebase Storage and delete old image
          let imageUrl: string | null = existingImageUrl
          let shouldDeleteOldImage = false

          if (newImageData) {
            if (isFirebaseStorageUrl(newImageData)) {
              // Already a Firebase Storage URL (not changed)
              imageUrl = newImageData
              console.log("✅ Image is already a Firebase Storage URL, no upload needed")
            } else {
              // New image uploaded (base64 or file object)
              // Mark old image for deletion if it exists and is a Storage URL
              if (existingImageUrl && isFirebaseStorageUrl(existingImageUrl)) {
                shouldDeleteOldImage = true
              }

              // Upload new image to Firebase Storage
              const fileExtension = newImageData.startsWith("data:image/")
                ? newImageData.split(";")[0].split("/")[1] || "jpg"
                : "jpg"
              const storagePath = `employees/${employeeId}/profile.${fileExtension}`

              console.log("📤 Uploading new employee image to Firebase Storage...")
              try {
                imageUrl = await uploadImageToStorage(newImageData, storagePath)
                console.log(`✅ New employee image uploaded successfully: ${imageUrl}`)

                // Delete old image after successful upload
                if (shouldDeleteOldImage && existingImageUrl) {
                  console.log("🗑️ Deleting old employee image from Firebase Storage...")
                  try {
                    await deleteImageFromStorage(existingImageUrl)
                    console.log("✅ Old employee image deleted successfully")
                  } catch (deleteError: any) {
                    // Log error but continue - old image deletion failure shouldn't block update
                    console.warn("⚠️ Failed to delete old image, but continuing with update:", deleteError)
                  }
                }
              } catch (uploadError: any) {
                console.error("❌ Error uploading new image to Storage:", uploadError)
                // Continue with existing image if upload fails
                console.warn("⚠️ Continuing update with existing image")
                imageUrl = existingImageUrl
              }
            }
          }

          // Handle file update - Upload to Firebase Storage and delete old file
          let fileUrl: string | null = existingFileUrl
          let shouldDeleteOldFile = false

          if (newFileData) {
            if (isFirebaseStorageUrl(newFileData)) {
              // Already a Firebase Storage URL (not changed)
              fileUrl = newFileData
              console.log("✅ File is already a Firebase Storage URL, no upload needed")
            } else {
              // New file uploaded (base64 or file object)
              // Mark old file for deletion if it exists and is a Storage URL
              if (existingFileUrl && isFirebaseStorageUrl(existingFileUrl)) {
                shouldDeleteOldFile = true
              }

              // Upload new file to Firebase Storage
              const fileExtension = newFileData.startsWith("data:")
                ? newFileData.split(";")[0].split("/")[1] || "pdf"
                : "pdf"
              const storagePath = `employees/${employeeId}/document.${fileExtension}`

              console.log("📤 Uploading new employee file to Firebase Storage...")
              try {
                fileUrl = await uploadImageToStorage(newFileData, storagePath)
                console.log(`✅ New employee file uploaded successfully: ${fileUrl}`)

                // Delete old file after successful upload
                if (shouldDeleteOldFile && existingFileUrl) {
                  console.log("🗑️ Deleting old employee file from Firebase Storage...")
                  try {
                    await deleteFileFromStorage(existingFileUrl)
                    console.log("✅ Old employee file deleted successfully")
                  } catch (deleteError: any) {
                    // Log error but continue - old file deletion failure shouldn't block update
                    console.warn("⚠️ Failed to delete old file, but continuing with update:", deleteError)
                  }
                }
              } catch (uploadError: any) {
                console.error("❌ Error uploading new file to Storage:", uploadError)
                // Continue with existing file if upload fails
                console.warn("⚠️ Continuing update with existing file")
                fileUrl = existingFileUrl
              }
            }
          } else if (newFileData === null || newFileData === "") {
            // File was removed by user (empty string or null)
            console.log("🗑️ File was removed by user, deleting from Firebase Storage...")
            if (existingFileUrl && isFirebaseStorageUrl(existingFileUrl)) {
              try {
                await deleteFileFromStorage(existingFileUrl)
                console.log("✅ Employee file deleted successfully from Firebase Storage")
              } catch (deleteError: any) {
                console.error("❌ Error deleting employee file from Storage:", deleteError)
                // Continue with update even if deletion fails
                console.warn("⚠️ Continuing update even though file deletion failed")
              }
            }
            fileUrl = null // Set to null to remove file from Firestore
          }

          // Prepare update data (don't update email)
          const updateData: any = {
            firstName: employeeData.firstName || "",
            lastName: employeeData.lastName || "",
            // email is NOT updated - kept from existing document
            phone: employeeData.phone || employeeData.mobileNumber || "",
            age: employeeData.age || null,
            address: employeeData.address || null,
            aadharNumber: employeeData.aadharNumber || null,
            panCardNumber: employeeData.panCardNumber || null,
            status: employeeData.status || "active",
            updatedAt: serverTimestamp(),
          }

          // Only update image if it changed
          if (imageUrl !== existingImageUrl) {
            updateData.avatar = imageUrl
          }

          // Only update file if it changed
          if (fileUrl !== existingFileUrl) {
            if (fileUrl === null) {
              // File was removed - explicitly set to null in Firestore
              updateData.employeeFile = null
            } else {
              // File was updated
              updateData.employeeFile = fileUrl
            }
          }

          // Remove undefined/empty fields, but keep null for file removal
          Object.keys(updateData).forEach((key) => {
            if (updateData[key] === undefined || updateData[key] === "") {
              delete updateData[key]
            }
            // Keep null values for explicit field removal (like employeeFile)
          })

          // Update in Firestore
          await updateDoc(employeeDocRef, updateData)

          return {
            data: {
              success: true,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error updating employee ${employeeId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to update employee",
              data: error.message || "Failed to update employee",
            },
          }
        }
      },
      invalidatesTags: (result, error, { employeeId }) => [
        { type: "Employees", id: employeeId },
        "Employees",
      ],
    }),
    deleteEmployee: builder.mutation<{ success: boolean }, string>({
      queryFn: async (employeeId: string) => {
        try {
          console.log(`🔥 Deleting employee ${employeeId}...`)

          // Call server-side API route to delete employee
          // This will delete from Firestore, Firebase Auth, and Storage
          const deleteResponse = await fetch(`/api/employees/${employeeId}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          })

          if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json()
            throw new Error(errorData.error || "Failed to delete employee")
          }

          const deleteResult = await deleteResponse.json()
          console.log(`✅ Employee deleted successfully:`, deleteResult)

          return {
            data: {
              success: true,
            },
          }
        } catch (error: any) {
          console.error(`❌ Error deleting employee ${employeeId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to delete employee",
              data: error.message || "Failed to delete employee",
            },
          }
        }
      },
      invalidatesTags: ["Employees"],
    }),
  }),
})

export const {
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} = employeesApi
