import { getDownloadURL, ref, uploadBytes, deleteObject } from "firebase/storage"
import { storage } from "./config"

export interface UploadResult {
  url: string
  path: string
}

export class StorageService {
  private static readonly EXPENSES_FOLDER = "expenses"

  /**
   * Upload file to Firebase Storage
   */
  static async uploadFile(file: File, expenseId: string): Promise<UploadResult> {
    if (!file) {
      throw new Error("No file provided")
    }

    // Create a unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${expenseId}_${timestamp}.${fileExtension}`
    const filePath = `${this.EXPENSES_FOLDER}/${fileName}`

    // Create storage reference
    if (!storage) {
      throw new Error("Storage is not available. Make sure you're on the client side.")
    }
    const storageRef = ref(storage, filePath)

    try {
      // Upload file
      const snapshot = await uploadBytes(storageRef, file)
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref)

      return {
        url: downloadURL,
        path: filePath
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      throw new Error("Failed to upload file")
    }
  }

  /**
   * Delete file from Firebase Storage
   */
  static async deleteFile(filePath: string): Promise<void> {
    if (!filePath) {
      console.warn("No file path provided for deletion")
      return
    }

    try {
      if (!storage) {
        throw new Error("Storage is not available. Make sure you're on the client side.")
      }
      const storageRef = ref(storage, filePath)
      await deleteObject(storageRef)
      console.log("File deleted successfully:", filePath)
    } catch (error) {
      console.error("Error deleting file:", error)
      throw new Error("Failed to delete file")
    }
  }

  /**
   * Get file extension from URL or path
   */
  static getFileExtension(urlOrPath: string): string {
    return urlOrPath.split('.').pop() || ''
  }

  /**
   * Check if URL is a Firebase Storage URL
   */
  static isFirebaseStorageURL(url: string): boolean {
    return url.includes('firebasestorage.googleapis.com')
  }
}
