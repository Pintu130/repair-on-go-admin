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
  if (!userDataStr) {
    console.log("🔍 Cookie 'user_data' not found")
    return null
  }
  
  try {
    const decryptedData = JSON.parse(userDataStr)
    
    // Log decrypted/parsed user data in readable format
    console.log("📋 Decrypted User Data (Object):", {
      uid: decryptedData.uid,
      email: decryptedData.email,
      role: decryptedData.role,
      name: decryptedData.name || "N/A",
      phone: decryptedData.phone || "N/A",
      hasToken: !!decryptedData.token,
      tokenLength: decryptedData.token ? decryptedData.token.length : 0,
      allKeys: Object.keys(decryptedData)
    })
    
    return decryptedData
  } catch (error) {
    console.error("❌ Error parsing user data from cookie:", error)
    console.error("Raw value that failed to parse:", userDataStr)
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
  return isAuth
}

/**
 * Log all user data from cookies in console (for debugging)
 * This function shows both encrypted and decrypted data
 */
export function logUserDataFromCookies(): void {
  console.group("🍪 User Data from Cookies (Debug Info)")
  
  // Get raw cookie values
  const rawUserData = getCookie("user_data")
  const rawAuthToken = getCookie("auth_token")
  const rawUserRole = getCookie("user_role")
  const rawUserUid = getCookie("user_uid")
  
  console.log("📦 Raw Cookie Values:")
  console.log("  - user_data:", rawUserData ? `${rawUserData.substring(0, 50)}...` : "Not found")
  console.log("  - auth_token:", rawAuthToken ? `${rawAuthToken.substring(0, 30)}...` : "Not found")
  console.log("  - user_role:", rawUserRole || "Not found")
  console.log("  - user_uid:", rawUserUid || "Not found")
  
  // Get decrypted user data
  const decryptedData = getUserData()
  
  if (decryptedData) {
    console.log("\n✅ Decrypted User Data:")
    console.table({
      UID: decryptedData.uid,
      Email: decryptedData.email,
      Role: decryptedData.role,
      Name: decryptedData.name || "N/A",
      Phone: decryptedData.phone || "N/A",
      "Has Token": decryptedData.token ? "Yes" : "No",
      "Token Length": decryptedData.token?.length || 0,
    })
    
    console.log("\n📋 Complete User Data Object:")
    console.log(JSON.stringify(decryptedData, null, 2))
  } else {
    console.log("❌ No user data found in cookies")
  }
  
  console.groupEnd()
}

