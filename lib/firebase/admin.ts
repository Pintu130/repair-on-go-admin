import * as admin from "firebase-admin";

let adminApp: admin.app.App | null = null;
let adminAuth: admin.auth.Auth | null = null;
let adminDb: admin.firestore.Firestore | null = null;
let adminStorage: admin.storage.Storage | null = null;

try {
  if (!admin.apps.length) {
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountEnv) {
      try {
        // Remove any leading/trailing whitespace and newlines
        const cleanedEnv = serviceAccountEnv.trim().replace(/^\s*\{/, '{').replace(/\}\s*$/, '}');
        
        // Parse JSON
        const serviceAccount = JSON.parse(cleanedEnv);

        // Validate required fields
        if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
          throw new Error("Service account JSON is missing required fields (private_key, client_email, or project_id)");
        }

        // FIX NEWLINE ISSUE - Replace escaped newlines with actual newlines
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
        }

        adminApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
        });

      } catch (parseError: any) {
        throw parseError; // Re-throw to be caught by outer catch
      }
    } else {
      // Try to initialize with default credentials (for Vercel/Cloud Run)
      try {
        adminApp = admin.initializeApp();
      } catch (defaultError: any) {
        console.error("❌ Error initializing with default credentials:", defaultError.message);
        throw defaultError;
      }
    }
  } else {
    adminApp = admin.app();
  }

  adminAuth = admin.auth();
  adminDb = admin.firestore();
  adminStorage = admin.storage();
  
} catch (error: any) {
  console.error("❌ Full error:", error);
  // Set to null on error so API routes can check
  adminApp = null;
  adminAuth = null;
  adminDb = null;
  adminStorage = null;
}

export { adminApp, adminAuth, adminDb, adminStorage };
