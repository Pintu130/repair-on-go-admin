import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase/admin"
import {
  buildEmailShell,
  buildPlainTextBodyHtml,
  sendBulkEmail,
} from "@/lib/utils/brevo"

export const dynamic = "force-dynamic"

interface SendEmailBody {
  customerIds?: string[]
  subject?: string
  body?: string
}

export async function POST(request: NextRequest) {
  try {
    // Step 1: Guard on Firebase Admin availability (needed to resolve customer emails)
    if (!adminDb) {
      return NextResponse.json(
        { error: "Firebase Admin SDK not initialized. Please check FIREBASE_SERVICE_ACCOUNT_KEY environment variable." },
        { status: 500 }
      )
    }

    // Step 2: Parse and validate the request body
    const payload = (await request.json()) as SendEmailBody
    const customerIds = Array.isArray(payload.customerIds)
      ? payload.customerIds.map((id) => String(id).trim()).filter(Boolean)
      : []
    const subject = (payload.subject || "").trim()
    const body = (payload.body || "").trim()

    if (customerIds.length === 0) {
      return NextResponse.json({ error: "Select at least one customer" }, { status: 400 })
    }
    if (!subject) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 })
    }
    if (!body) {
      return NextResponse.json({ error: "Message body is required" }, { status: 400 })
    }

    // Step 3: Resolve recipients from the customers collection (batched read)
    const db = adminDb
    const snapshots = await db.getAll(
      ...customerIds.map((id) => db.collection("customers").doc(id))
    )

    const recipients: { email: string; name: string }[] = []
    const notFound: string[] = []

    for (const snapshot of snapshots) {
      if (!snapshot.exists) {
        notFound.push(snapshot.id)
        continue
      }
      const data = snapshot.data() || {}
      const fullName =
        [data.firstName, data.lastName].filter(Boolean).join(" ").trim() ||
        String(data.name || "Customer")
      recipients.push({ email: String(data.email || ""), name: fullName })
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No customers found for the given selection" },
        { status: 404 }
      )
    }

    // Step 4: Build the branded HTML email.
    // Personal greeting only makes sense when there is a single recipient, otherwise one
    // API call would be needed per customer.
    const htmlContent = buildEmailShell(
      subject,
      buildPlainTextBodyHtml(
        body,
        recipients.length === 1 ? recipients[0].name : undefined
      )
    )

    // Step 5: Send via Brevo
    const result = await sendBulkEmail({ recipients, subject, htmlContent })

    return NextResponse.json({
      success: result.success,
      message: `Sent to ${result.sent} customer${result.sent === 1 ? "" : "s"}`,
      sent: result.sent,
      failed: result.failed,
      skipped: result.skipped,
      notFound: notFound.length,
      errors: result.errors,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    )
  }
}
