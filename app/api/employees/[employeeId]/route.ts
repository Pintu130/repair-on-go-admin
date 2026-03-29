import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, adminStorage } from "@/lib/firebase/admin";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ employeeId: string }> | { employeeId: string } }
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
    let employeeId = params?.employeeId;

    // Fallback: Extract from URL if params not available
    if (!employeeId) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split("/");
      const employeeIdIndex = pathParts.indexOf("employees") + 1;
      if (employeeIdIndex > 0 && pathParts[employeeIdIndex]) {
        employeeId = pathParts[employeeIdIndex];
      }
    }

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID missing" },
        { status: 400 }
      );
    }

    // Step 1: Fetch employee document
    const docRef = adminDb.collection("employees").doc(employeeId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const data: any = doc.data();
    const uid = data?.uid || null;
    const imageUrl = data?.image || data?.avatar || null;
    const fileUrl = data?.employeeFile || null;

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

    // Step 3: Delete file if exists
    if (fileUrl && fileUrl.includes("firebasestorage.googleapis.com")) {
      try {
        const storagePath = decodeURIComponent(
          fileUrl.split("/o/")[1].split("?")[0]
        );
        await adminStorage.bucket().file(storagePath).delete();
      } catch (e) {
        console.warn("⚠ File delete error:", e);
      }
    }

    // Step 4: Delete folder (optional)
    try {
      // Delete employee folder (contains both profile image and document)
      const employeeFolder = `employees/${employeeId}/`;
      const [files] = await adminStorage.bucket().getFiles({ prefix: employeeFolder });

      if (files.length > 0) {
        await Promise.all(files.map((f: any) => f.delete()));
      }
    } catch (e) {
      console.warn("⚠ Folder delete error:", e);
    }

    // Step 5: Delete user from Firebase Auth
    if (uid) {
      try {
        await adminAuth.deleteUser(uid);
      } catch (e) {
        console.warn("⚠ Auth delete error:", e);
      }
    }

    // Step 6: Delete Firestore document
    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: "Employee deleted from Firestore, Storage and Auth",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
