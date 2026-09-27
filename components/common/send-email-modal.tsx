"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Mail, Send, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export interface EmailRecipient {
  id: string
  name: string
  email: string
}

interface SendEmailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipients: EmailRecipient[]
  /** Called after a successful send so the parent can clear its selection */
  onSent?: () => void
}

export function SendEmailModal({ open, onOpenChange, recipients, onSent }: SendEmailModalProps) {
  const { toast } = useToast()
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showRecipients, setShowRecipients] = useState(false)

  const validRecipients = useMemo(
    () => recipients.filter((r) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email?.trim() || "")),
    [recipients]
  )
  const missingEmailCount = recipients.length - validRecipients.length

  // Reset the form each time the modal is opened
  useEffect(() => {
    if (open) {
      setSubject("")
      setBody("")
      setShowRecipients(false)
      setIsSending(false)
    }
  }, [open])

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return
    if (validRecipients.length === 0) return

    setIsSending(true)
    try {
      const response = await fetch("/api/customers/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerIds: validRecipients.map((r) => r.id),
          subject: subject.trim(),
          body: body.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to send email")
      }

      const skipped = (result.skipped || 0) + (result.notFound || 0)
      toast({
        title: `Email sent to ${result.sent} customer${result.sent === 1 ? "" : "s"}`,
        description:
          skipped > 0
            ? `${skipped} skipped (no valid email address).`
            : undefined,
      })

      onSent?.()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Failed to send email",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const canSend =
    subject.trim().length > 0 && body.trim().length > 0 && validRecipients.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail size={18} /> Send Email
          </DialogTitle>
          <DialogDescription>
            Send an email to {validRecipients.length} customer
            {validRecipients.length === 1 ? "" : "s"}
            {missingEmailCount > 0
              ? ` — ${missingEmailCount} without a valid email will be skipped.`
              : "."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipients */}
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <button
              type="button"
              onClick={() => setShowRecipients((prev) => !prev)}
              className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Users size={15} />
                {validRecipients.length} recipient
                {validRecipients.length === 1 ? "" : "s"}
              </span>
              <span className="text-xs text-muted-foreground">
                {showRecipients ? "Hide" : "Show"}
              </span>
            </button>

            {showRecipients && (
              <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto border-t border-border pt-3 text-xs">
                {validRecipients.map((recipient) => (
                  <li key={recipient.id} className="flex items-center justify-between gap-2">
                    <span className="truncate capitalize">{recipient.name}</span>
                    <span className="truncate text-muted-foreground">{recipient.email}</span>
                  </li>
                ))}
                {missingEmailCount > 0 &&
                  recipients
                    .filter((r) => !validRecipients.includes(r))
                    .map((recipient) => (
                      <li
                        key={recipient.id}
                        className="flex items-center justify-between gap-2 text-muted-foreground"
                      >
                        <span className="truncate capitalize">{recipient.name}</span>
                        <span className="truncate">no email</span>
                      </li>
                    ))}
              </ul>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Your repair is ready for pickup"
              disabled={isSending}
              maxLength={150}
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="email-body">Message</Label>
            <Textarea
              id="email-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here. Use a blank line for a new paragraph."
              disabled={isSending}
              rows={8}
              className="min-h-40 resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Your message is wrapped in the RepairOnGo branded template before sending.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!canSend || isSending}
            className="cursor-pointer"
          >
            {isSending ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Send size={16} className="mr-2" />
            )}
            {isSending
              ? "Sending..."
              : `Send to ${validRecipients.length} customer${validRecipients.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
