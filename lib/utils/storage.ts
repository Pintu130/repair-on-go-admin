import { ref, uploadBytes, getDownloadURL, deleteObject, UploadResult } from "firebase/storage"
import { storage, auth } from "@/lib/firebase/config"

/**
 * Convert base64 string to Blob
 * @param base64String - Base64 encoded image string (data:image/... format)
 * @returns Blob object
 */
function base64ToBlob(base64String: string): Blob {
  // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
  const base64Data = base64String.includes(",") 
    ? base64String.split(",")[1] 
    : base64String
  
  // Convert base64 to binary
  const byteCharacters = atob(base64Data)
  const byteNumbers = new Array(byteCharacters.length)
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  
  const byteArray = new Uint8Array(byteNumbers)
  
  // Determine MIME type from base64 string
  let mimeType = "image/jpeg" // default
  if (base64String.startsWith("data:")) {
    const mimeMatch = base64String.match(/data:([^;]+)/)
    if (mimeMatch) {
      mimeType = mimeMatch[1]
    }
  }
  
  return new Blob([byteArray], { type: mimeType })
}

/**
 * Ensure Firebase Auth is authenticated before upload
 * Firebase Storage SDK automatically uses auth token if user is authenticated
 * CORS error occurs if user is not authenticated and Storage rules require auth
 */
async function ensureAuth(): Promise<void> {
  if (!auth) {
    console.warn("⚠️ Firebase Auth not initialized")
    return
  }
  
  // Check if user is already authenticated in Firebase Auth
  const currentUser = auth.currentUser
  if (currentUser) {
    console.log("✅ Firebase Auth user already authenticated:", currentUser.uid)
    return
  }
  
  console.warn("⚠️ Firebase Auth user not authenticated. Upload may fail if Storage rules require authentication.")
  console.warn("💡 Please ensure user is logged in before uploading images.")
}

/**
 * Upload image to Firebase Storage
 * @param file - File object or base64 string
 * @param path - Storage path (e.g., "customers/customerId/image.jpg")
 * @returns Promise with download URL
 */
export async function uploadImageToStorage(
  file: File | string,
  path: string
): Promise<string> {
  try {
    // Check if we're on client side
    if (typeof window === "undefined") {
      throw new Error("Storage upload can only be done on client side")
    }

    if (!storage) {
      // Try to initialize storage if not already initialized
      const { storage: storageInstance } = await import("@/lib/firebase/config")
      if (!storageInstance) {
        throw new Error("Firebase Storage is not initialized. Please check Firebase configuration.")
      }
      // Note: We can't reassign the imported storage, so we'll use the instance
      throw new Error("Firebase Storage is not initialized. Please refresh the page.")
    }

    // Ensure auth is ready (Firebase SDK handles auth automatically)
    await ensureAuth()

    const storageRef = ref(storage, path)
    let fileBlob: Blob

    if (typeof file === "string") {
      // Convert base64 to blob directly (no fetch, avoids CORS)
      fileBlob = base64ToBlob(file)
    } else {
      // File object
      fileBlob = file
    }
    
    // Upload with metadata
    const metadata = {
      contentType: fileBlob.type || "image/jpeg",
    }
    
    const snapshot = await uploadBytes(storageRef, fileBlob, metadata)
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    return downloadURL
  } catch (error: any) {
    console.error(`❌ Error uploading image to storage:`, error)
    
    // More detailed error message
    if (error.code === "storage/unauthorized") {
      throw new Error("Unauthorized: Please check Firebase Storage rules and authentication")
    } else if (error.code === "storage/canceled") {
      throw new Error("Upload was canceled")
    } else if (error.code === "storage/unknown") {
      throw new Error(`Storage error: ${error.message}`)
    } else if (error.message?.includes("not initialized")) {
      throw new Error("Firebase Storage is not initialized. Please refresh the page and try again.")
    }
    
    throw new Error(`Failed to upload image: ${error.message || "Unknown error"}`)
  }
}

/**
 * Delete image from Firebase Storage
 * @param imageUrl - Full URL or storage path of the image to delete
 * @returns Promise<void>
 */
export async function deleteImageFromStorage(imageUrl: string): Promise<void> {
  try {
    if (!storage) {
      throw new Error("Firebase Storage is not initialized")
    }

    // If imageUrl is a full URL, extract the path
    let storagePath = imageUrl
    
    if (imageUrl.startsWith("https://")) {
      // Extract path from URL
      // Format: https://firebasestorage.googleapis.com/v0/b/bucket/o/path?token=...
      const urlParts = imageUrl.split("/o/")
      if (urlParts.length > 1) {
        storagePath = decodeURIComponent(urlParts[1].split("?")[0])
      }
    }

    const storageRef = ref(storage, storagePath)
    await deleteObject(storageRef)
  } catch (error: any) {
    // If file doesn't exist, that's okay (might have been deleted already)
    if (error.code === "storage/object-not-found") {
      console.warn(`⚠️ Image not found in storage (might be already deleted):`, imageUrl)
      return
    }
    console.error(`❌ Error deleting image from storage:`, error)
    throw new Error(`Failed to delete image: ${error.message}`)
  }
}

/**
 * Check if URL is a Firebase Storage URL
 */
export function isFirebaseStorageUrl(url: string): boolean {
  return url.includes("firebasestorage.googleapis.com") || url.includes("firebase.storage")
}

