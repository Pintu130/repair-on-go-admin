import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, adminStorage } from "@/lib/firebase/admin";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ customerId: string }> | { customerId: string } }
) {
  try {
    // Check if admin services are initialized
    if (!adminAuth || !adminDb || !adminStorage) {
      return NextResponse.json(
        { error: "Firebase Admin SDK not initialized. Please check FIREBASE_SERVICE_ACCOUNT_KEY environment variable." },
        { status: 500 }
      );
    }

    // Handle both sync and async params (Next.js 15+ uses async params)
    const params = await Promise.resolve(context.params);
    let customerId = params?.customerId;

    // Fallback: Extract from URL if params not available
    if (!customerId) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split("/");
      const customerIdIndex = pathParts.indexOf("customers") + 1;
      if (customerIdIndex > 0 && pathParts[customerIdIndex]) {
        customerId = pathParts[customerIdIndex];
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID missing" },
        { status: 400 }
      );
    }

    // Step 1: Fetch customer document
    const docRef = adminDb.collection("customers").doc(customerId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const data: any = doc.data();
    const uid = data?.uid || null;
    const imageUrl = data?.image || data?.avatar || null;

    // Step 2: Delete image if exists
    if (imageUrl && imageUrl.includes("firebasestorage.googleapis.com")) {
      try {
        const storagePath = decodeURIComponent(
          imageUrl.split("/o/")[1].split("?")[0]
        );
        await adminStorage.bucket().file(storagePath).delete();
      } catch (e) {
        console.warn("⚠ Image delete error:", e);
      }
    }

    // Step 3: Delete folder (optional)
    try {
      const folder = `customerImage/${customerId}/`;
      const [files] = await adminStorage.bucket().getFiles({ prefix: folder });

      if (files.length > 0) {
        await Promise.all(files.map((f: any) => f.delete()));
      }
    } catch (e) {
      console.warn("⚠ Folder delete error:", e);
    }

    // Step 4: Delete user from Firebase Auth
    if (uid) {
      try {
        await adminAuth.deleteUser(uid);
      } catch (e) {
        console.warn("⚠ Auth delete error:", e);
      }
    }

    // Step 5: Delete Firestore document
    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: "Customer deleted from Firestore, Storage and Auth",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
