"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, User } from "firebase/auth"
import { auth } from "@/lib/firebase/config"
import { isAuthenticated as checkCookieAuth, getUserData, clearAuthCookies } from "@/lib/utils/cookies"
import { useLogoutMutation } from "@/lib/store/api/authApi"

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: any | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  const router = useRouter()
  const [logoutMutation] = useLogoutMutation()

  // Function to check and update auth state from cookies
  const checkAuthState = useCallback(() => {
    if (typeof window === "undefined") return false

    const cookieAuth = checkCookieAuth()
    const userData = getUserData()
    
    console.log("🔍 Checking auth state - Cookie auth:", cookieAuth, "User data:", userData ? "exists" : "missing")
    
    if (cookieAuth && userData) {
      setUser(userData)
      setIsAuthenticated(true)
      setIsLoading(false)
      console.log("✅ Auth state updated - User authenticated")
      return true
    } else {
      setUser(null)
      setIsAuthenticated(false)
      setIsLoading(false)
      console.log("❌ Auth state updated - User not authenticated")
      return false
    }
  }, [])

  // Check authentication on mount and listen for changes
  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoading(false)
      return
    }

    // Primary check: Cookies are the source of truth
    const checkAndSetAuthFromCookies = () => {
      const cookieAuth = checkCookieAuth()
      const userData = getUserData()
      
      if (cookieAuth && userData) {
        setUser(userData)
        setIsAuthenticated(true)
        return true
      } else {
        setUser(null)
        setIsAuthenticated(false)
        return false
      }
    }

    // Initial check from cookies (synchronous, immediate)
    const hasValidCookies = checkAndSetAuthFromCookies()
    console.log("🔐 Initial auth check from cookies:", hasValidCookies)
    
    // Set loading to false after initial cookie check
    // Don't wait for Firebase - cookies are source of truth
    setIsLoading(false)

    // Listen to Firebase auth state changes (secondary validation only)
    // This runs asynchronously and won't interfere with cookie-based auth
    let firebaseChecked = false
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (!firebaseChecked) {
        firebaseChecked = true
      }
      
      // Always check cookies first - they are the source of truth
      const cookieAuth = checkCookieAuth()
      const userData = getUserData()
      
      
      if (cookieAuth && userData) {
        // Valid cookies exist - user is authenticated (regardless of Firebase state)
        setUser(userData)
        setIsAuthenticated(true)
      } else {
        // No valid cookies - user is not authenticated
        // Only clear Firebase if we're intentionally logging out
        if (firebaseUser && !cookieAuth) {
          // Firebase user exists but no cookies - might be a mismatch
          // Don't auto-signout, just log warning
          console.warn("⚠️ Firebase user exists but no cookies found")
        }
        
        if (!cookieAuth) {
          // Only clear state if cookies don't exist
          setUser(null)
          setIsAuthenticated(false)
          console.log("❌ User not authenticated - no valid cookies")
        }
      }
    })

    // Listen for custom event to refresh auth state (triggered after login)
    const handleAuthRefresh = () => {
      console.log("🔄 Auth refresh event triggered")
      const updated = checkAuthState()
      setIsLoading(false)
      console.log("🔄 Auth state updated:", updated)
    }
    
    window.addEventListener("auth-state-refresh", handleAuthRefresh)
    
    // Check for cookie changes on window focus (when user comes back to tab)
    const handleFocus = () => {
      checkAuthState()
    }
    window.addEventListener("focus", handleFocus)
    
    return () => {
      unsubscribe()
      window.removeEventListener("auth-state-refresh", handleAuthRefresh)
      window.removeEventListener("focus", handleFocus)
    }
  }, [checkAuthState])

  const login = async (email: string, password: string) => {
    // This will be handled by RTK Query mutation in the login page
    // This function is kept for backward compatibility but won't be used
    throw new Error("Please use RTK Query login mutation instead")
  }

  const logout = async () => {
    try {
      await logoutMutation().unwrap()
      setUser(null)
      setIsAuthenticated(false)
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      // Clear cookies even if logout mutation fails
      clearAuthCookies()
      setUser(null)
      setIsAuthenticated(false)
      router.push("/")
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
