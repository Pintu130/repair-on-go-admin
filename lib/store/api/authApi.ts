import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { signInWithEmailAndPassword, User } from "firebase/auth"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase/config"
import { setUserData, clearAuthCookies } from "@/lib/utils/cookies"

export interface LoginRequest {
  email: string
  password: string
}

export interface UserData {
  uid: string
  email: string
  role: string
  name?: string
  phone?: string
  [key: string]: any
}

export interface LoginResponse {
  success: boolean
  user?: UserData
  message?: string
}

// Allowed roles for admin access
const ALLOWED_ROLES = ["superadmin", "manager", "admin"]

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Auth"],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      queryFn: async ({ email, password }) => {
        try {
          // Step 1: Authenticate with Firebase Auth
          const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
          )
          const user: User = userCredential.user
          console.log("🚀 ~ Firebase Auth User:", user)

          // Step 2: Fetch user data from customers collection
          // Try to find user by uid field (not document ID)
          const customersRef = collection(db, "customers")
          let querySnapshot = await getDocs(query(customersRef, where("uid", "==", user.uid)))
          
          console.log("🚀 ~ Query by UID - Documents found:", querySnapshot.size)

          // If not found by uid, try by email as fallback
          if (querySnapshot.empty && user.email) {
            querySnapshot = await getDocs(query(customersRef, where("email", "==", user.email)))
            console.log("🚀 ~ Query by Email - Documents found:", querySnapshot.size)
          }

          if (querySnapshot.empty) {
            // User doesn't exist in customers collection
            console.error("🚀 ~ User not found in customers collection. UID:", user.uid, "Email:", user.email)
            await auth.signOut()
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "User not found in system. Please contact administrator.",
                data: "User not found in system. Please contact administrator.",
              },
            }
          }

          // Get the first matching document
          const userDoc = querySnapshot.docs[0]
          const docData = userDoc.data()
          const userData: UserData = {
            uid: docData.uid || user.uid,
            email: docData.email || user.email || email,
            role: docData.role || "",
            name: docData.name,
            phone: docData.phone,
            ...docData,
          }
          
          console.log("🚀 ~ User Data from Firestore:", userData)

          // Step 3: Check if user has allowed role
          if (!userData.role || !ALLOWED_ROLES.includes(userData.role.toLowerCase())) {
            await auth.signOut()
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "You don't have permission to access admin panel",
                data: "You don't have permission to access admin panel",
              },
            }
          }

          // Step 4: Get Firebase Auth token
          const token = await user.getIdToken()

          // Step 5: Store user data in cookies
          setUserData({
            ...userData,
            token,
          })

          return {
            data: {
              success: true,
              user: userData,
            },
          }
        } catch (error: any) {
          // Handle Firebase Auth errors
          let errorMessage = "Login failed. Please try again."

          if (error.code === "auth/user-not-found") {
            errorMessage = "User not found"
          } else if (error.code === "auth/wrong-password") {
            errorMessage = "Incorrect password"
          } else if (error.code === "auth/invalid-email") {
            errorMessage = "Invalid email address"
          } else if (error.code === "auth/user-disabled") {
            errorMessage = "User account has been disabled"
          } else if (error.code === "auth/too-many-requests") {
            errorMessage = "Too many failed attempts. Please try again later"
          } else if (error.message) {
            errorMessage = error.message
          }

          return {
            error: {
              status: "CUSTOM_ERROR",
              error: errorMessage,
              data: errorMessage,
            },
          }
        }
      },
      invalidatesTags: ["Auth"],
    }),
    logout: builder.mutation<void, void>({
      queryFn: async () => {
        try {
          await auth.signOut()
          clearAuthCookies()
          return { data: undefined }
        } catch (error: any) {
          // Even if signOut fails, clear cookies
          clearAuthCookies()
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Logout failed",
              data: error.message || "Logout failed",
            },
          }
        }
      },
      invalidatesTags: ["Auth"],
    }),
  }),
})

export const { useLoginMutation, useLogoutMutation } = authApi

