import Cookies from "js-cookie"

const COOKIE_OPTIONS = {
  expires: 7, // 7 days
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
}

interface UserData {
  uid: string
  email: string
  role: string
  name?: string
  phone?: string
  [key: string]: any
}

/**
 * Set a cookie with the given name and value
 */
export function setCookie(name: string, value: string, days?: number): void {
  Cookies.set(name, value, {
    ...COOKIE_OPTIONS,
    expires: days || COOKIE_OPTIONS.expires,
  })
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | undefined {
  return Cookies.get(name)
}

/**
 * Remove a cookie by name
 */
export function clearCookie(name: string): void {
  Cookies.remove(name, { path: COOKIE_OPTIONS.path })
}

/**
 * Clear all cookies related to authentication
 */
export function clearAuthCookies(): void {
  clearCookie("auth_token")
  clearCookie("user_data")
  clearCookie("user_role")
  clearCookie("user_uid")
}

/**
 * Set user data in cookies
 */
export function setUserData(userData: UserData): void {
  setCookie("user_data", JSON.stringify(userData))
  setCookie("user_role", userData.role)
  setCookie("user_uid", userData.uid)
  
  // Also set auth token if available
  if (userData.token) {
    setCookie("auth_token", userData.token)
  }
}

/**
 * Get user data from cookies
 */
export function getUserData(): UserData | null {
  const userDataStr = getCookie("user_data")
  if (!userDataStr) return null
  
  try {
    return JSON.parse(userDataStr)
  } catch (error) {
    console.error("Error parsing user data from cookie:", error)
    return null
  }
}

/**
 * Check if user is authenticated (has valid cookies)
 */
export function isAuthenticated(): boolean {
  const userData = getUserData()
  const authToken = getCookie("auth_token")
  const isAuth = !!(userData && authToken)
  console.log("🔍 Cookie auth check:", {
    hasUserData: !!userData,
    hasAuthToken: !!authToken,
    isAuthenticated: isAuth
  })
  return isAuth
}

