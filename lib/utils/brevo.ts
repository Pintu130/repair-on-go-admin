const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email"

const DEFAULT_SENDER_NAME = "RepairOnGo"
const BRAND_ACCENT = "#b91c1c"
const BRAND_LOGO = "https://repairongo.com/logo/logos/whitelogo@3x.png"
const SUPPORT_EMAIL = "support@repairongo.com"

export interface BrevoEmailRecipient {
  email: string
  name: string
}

export interface BrevoSendResult {
  success: boolean
  sent: number
  failed: number
  skipped: number
  errors: string[]
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

/** Wraps body content in the same branded shell used by the landing app booking emails. */
export function buildEmailShell(title: string, bodyHtml: string, accent = BRAND_ACCENT): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(title)}</title></head>
<body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #ffffff;">
    <tr>
      <td style="background: linear-gradient(135deg, ${accent} 0%, #dc2626 100%); padding: 30px 20px; text-align: center;">
        <img src="${BRAND_LOGO}" alt="RepairOnGo" style="max-height: 60px; max-width: 200px; height: auto; width: auto;" />
        <p style="color: #fee2e2; margin: 12px 0 0 0; font-size: 14px;">Your Trusted Repair Service</p>
      </td>
    </tr>
    <tr><td style="padding: 30px 20px;">${bodyHtml}</td></tr>
    <tr>
      <td style="background: #f3f4f6; padding: 20px; text-align: center;">
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">Thank you for choosing RepairOnGo!</p>
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">Questions? Email ${SUPPORT_EMAIL} or visit My Repairs on our website.</p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Turns a plain-text admin compose into the inner HTML block of the email shell. */
export function buildPlainTextBodyHtml(
  body: string,
  greetingName?: string,
  unsubscribeHint?: string
): string {
  const paragraphs = body
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  const bodyHtml = paragraphs
    .map((block) => `<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">${escapeHtml(block).replace(/\n/g, "<br/>")}</p>`)
    .join("")

  const greeting = greetingName
    ? `<p style="color: #111827; font-size: 15px; font-weight: 600; margin: 0 0 12px 0;">Hello ${escapeHtml(greetingName)},</p>`
    : `<p style="color: #111827; font-size: 15px; font-weight: 600; margin: 0 0 12px 0;">Hello,</p>`

  const hint = unsubscribeHint
    ? `<p style="color: #9ca3af; font-size: 12px; margin: 24px 0 0 0;">${escapeHtml(unsubscribeHint)}</p>`
    : ""

  return `${greeting}${bodyHtml}${hint}`
}

const postToBrevo = async (payload: Record<string, unknown>) => {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured. Add it to .env.local.")
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL
  if (!senderEmail) {
    throw new Error("BREVO_SENDER_EMAIL is not configured. Add it to .env.local.")
  }

  const response = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Brevo responded ${response.status}: ${detail.slice(0, 300)}`)
  }

  return response.json()
}

/**
 * Sends one Brevo transactional email to many recipients in a single API call.
 * Brevo caps a single `to` list, so recipients are chunked.
 */
export async function sendBulkEmail({
  recipients,
  subject,
  htmlContent,
  chunkSize = 50,
}: {
  recipients: BrevoEmailRecipient[]
  subject: string
  htmlContent: string
  chunkSize?: number
}): Promise<BrevoSendResult> {
  const result: BrevoSendResult = { success: true, sent: 0, failed: 0, skipped: 0, errors: [] }

  const valid: BrevoEmailRecipient[] = []
  for (const recipient of recipients) {
    const email = recipient.email?.trim() || ""
    if (!email || !isValidEmail(email)) {
      result.skipped += 1
      result.errors.push(`${recipient.name || "unknown"}: missing or invalid email`)
      continue
    }
    valid.push({ email, name: recipient.name || "Customer" })
  }

  if (valid.length === 0) {
    return result
  }

  const sender = {
    name: process.env.BREVO_SENDER_NAME || DEFAULT_SENDER_NAME,
    email: process.env.BREVO_SENDER_EMAIL as string,
  }

  for (let i = 0; i < valid.length; i += chunkSize) {
    const chunk = valid.slice(i, i + chunkSize)
    try {
      await postToBrevo({
        sender,
        to: chunk,
        subject,
        htmlContent,
      })
      result.sent += chunk.length
    } catch (error) {
      result.failed += chunk.length
      result.success = false
      result.errors.push(error instanceof Error ? error.message : String(error))
    }
  }

  if (result.failed > 0) {
    result.success = false
  }

  return result
}
