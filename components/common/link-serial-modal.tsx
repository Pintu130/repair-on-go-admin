"use client"

import { useEffect, useState } from "react"
import { Loader2, ScanBarcode } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { normalizeSerialInput } from "@/data/serial-numbers"

interface LinkSerialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Human-facing order code, shown so the admin can confirm the right order. */
  orderLabel: string;
  /** Set when the order already has a serial, which is then shown read-only. */
  currentSerial?: string;
  isLoading?: boolean;
  onLink: (serial: string) => void;
}

/**
 * Admin escape hatch for orders whose serial was never linked at pickup, and the
 * recovery path for one that was scanned wrong.
 *
 * The serial is validated into its canonical form here so the mutation receives
 * one exact string, but availability is still decided inside the transaction —
 * this check is only there to catch typos before a round trip.
 *
 * When the order already has a serial, the existing one is shown alongside the
 * input so the admin can see what they are about to swap out.
 */
export function LinkSerialModal({
  open,
  onOpenChange,
  orderLabel,
  currentSerial,
  isLoading = false,
  onLink,
}: LinkSerialModalProps) {
  const [value, setValue] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setValue("")
      setError("")
    }
  }, [open])

  const canonical = value.trim() ? normalizeSerialInput(value) : null
  const isValid = !!canonical
  const isReplacing = !!currentSerial && !!canonical && canonical !== currentSerial

  const handleSubmit = () => {
    if (!canonical) {
      setError("Enter a serial number, e.g. ROG-2026-000123.")
      return
    }
    if (canonical === currentSerial) {
      setError(`${currentSerial} is already linked to this order.`)
      return
    }
    setError("")
    onLink(canonical)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isLoading && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentSerial ? "Replace the linked serial" : "Link a serial number"}
          </DialogTitle>
          <DialogDescription>
            {currentSerial
              ? `${orderLabel} is currently linked to ${currentSerial}. Enter the correct number to swap it — the old number is released back to available.`
              : `${orderLabel} has no device serial linked. Enter the number printed on the device sticker so the order can be tracked against it.`}
          </DialogDescription>
        </DialogHeader>

        {currentSerial && (
          <div className="rounded-md border border-border bg-muted/50 px-3 py-2.5">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <ScanBarcode size={13} /> Currently linked
            </div>
            <p className="font-mono text-sm">{currentSerial}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="link-serial-input">
            {currentSerial ? "Replacement serial number" : "Serial number"}
          </Label>
          <Input
            id="link-serial-input"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError("")
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isValid && !isLoading) handleSubmit()
            }}
            placeholder="ROG-2026-000123"
            autoComplete="off"
            spellCheck={false}
            maxLength={20}
            className={error || (value.trim() && !isValid) ? "border-destructive" : undefined}
            aria-invalid={!!error || (!!value.trim() && !isValid)}
          />
          {error || (value.trim() && !isValid) ? (
            <p className="text-sm text-destructive">
              {error || "That is not a valid serial number."}
            </p>
          ) : isReplacing ? (
            <p className="text-xs text-muted-foreground">
              Will be stored as <span className="font-mono">{canonical}</span>, releasing{" "}
              <span className="font-mono">{currentSerial}</span> back to available.
            </p>
          ) : canonical ? (
            <p className="text-xs text-muted-foreground">
              Will be stored as <span className="font-mono">{canonical}</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              The short form printed under the barcode also works, e.g. 2026000123.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="cursor-pointer"
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !isValid}
            className="cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" /> Linking…
              </>
            ) : isReplacing ? (
              "Replace serial"
            ) : (
              "Link serial"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
