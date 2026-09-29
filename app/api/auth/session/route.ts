import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

/**
 * Exchanges the signed-in admin's Firebase ID token cookie for a custom token.
 *
 * The client uses this to rebuild a Firebase session that was lost locally
 * (cleared storage, forced sign-out elsewhere) while the auth cookie is still
 * valid, so Firestore requests keep satisfying `request.auth != null`.
 */
export async function POST(request: NextRequest) {
  if (!adminAuth) {
    return NextResponse.json(
      {
        error:
          "Firebase Admin SDK is not initialized. Check the FIREBASE_SERVICE_ACCOUNT_KEY environment variable.",
      },
      { status: 500 }
    );
  }

  const idToken = request.cookies.get("auth_token")?.value;
  if (!idToken) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const customToken = await adminAuth.createCustomToken(decoded.uid);

    return NextResponse.json({ customToken, uid: decoded.uid });
  } catch (error: any) {
    console.warn("⚠ Session exchange rejected:", error?.message || error);
    return NextResponse.json(
      { error: "Session expired. Please sign in again." },
      { status: 401 }
    );
  }
}
