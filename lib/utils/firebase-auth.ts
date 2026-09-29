"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged, signInWithCustomToken, type User } from "firebase/auth"
import { auth } from "@/lib/firebase/config"
import { clearAuthCookies, isAuthenticated as hasAuthCookies } from "@/lib/utils/cookies"

const AUTH_READY_TIMEOUT_MS = 10000

const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please sign in again."

/**
 * Waits for Firebase Auth to settle.
 *
 * Resolves with the user, or null when there is genuinely no session. The timeout
 * only guards against a listener that never fires — `onAuthStateChanged` reports
 * `null` promptly when the persisted session is absent.
 */
function waitForAuthUser(timeoutMs: number): Promise<User | null> {
  return new Promise((resolve) => {
    let settled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let unsubscribe: () => void = () => {}

    const finish = (user: User | null) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      unsubscribe()
      resolve(user)
    }

    unsubscribe = onAuthStateChanged(auth, (user) => finish(user))
    timer = setTimeout(() => finish(null), timeoutMs)
  })
}

/**
 * Rebuilds the Firebase session from the auth cookie.
 *
 * Cookies live for 7 days while the persisted Firebase session can disappear on
 * its own (cleared storage, forced sign-out elsewhere). Without this the panel
 * still renders as signed in via `lib/auth-context.tsx` while every Firestore
 * call is rejected with "Missing or insufficient permissions".
 */
async function restoreAuthFromCookie(): Promise<User | null> {
  if (!hasAuthCookies()) return null

  try {
    const response = await fetch("/api/auth/session", { method: "POST" })
    if (!response.ok) return null

    const { customToken } = await response.json()
    if (!customToken) return null

    const credential = await signInWithCustomToken(auth, customToken)
    return credential.user
  } catch (error) {
    console.error("❌ Failed to restore Firebase session from cookie:", error)
    return null
  }
}

/**
 * Resolves once Firestore calls will carry a valid ID token.
 *
 * `firestore.rules` gates every collection on `request.auth != null`, so any
 * request fired before this settles is rejected as a permissions error. Await it
 * at the top of every Firestore-backed `queryFn`.
 *
 * A restored session can still hold an expired token, and Firestore answers a
 * stale token with the same "Missing or insufficient permissions" message, so
 * the token is force-refreshed before returning.
 */
export async function ensureFirebaseAuth(): Promise<User> {
  if (auth.currentUser) {
    try {
      await auth.currentUser.getIdToken(true)
      return auth.currentUser
    } catch (error) {
      console.warn("⚠️ ID token refresh failed, rebuilding session:", error)
    }
  }

  let user = await waitForAuthUser(AUTH_READY_TIMEOUT_MS)
  if (!user) user = await restoreAuthFromCookie()

  if (!user) {
    clearAuthCookies()
    throw new Error(SESSION_EXPIRED_MESSAGE)
  }

  return user
}

/** True once Firestore calls are safe to make — pair with RTK Query's `skip`. */
export function useFirebaseAuthReady(): boolean {
  const [ready, setReady] = useState(() => Boolean(auth.currentUser))

  useEffect(() => {
    if (auth.currentUser) {
      setReady(true)
      return
    }

    let cancelled = false
    ensureFirebaseAuth()
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch((error) => {
        console.error("❌ Firebase session unavailable:", error?.message || error)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return ready
}
