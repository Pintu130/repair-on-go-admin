"use client"

import { useEffect, useState } from "react"
import { Loader2, Hash } from "lucide-react"
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
import {
  MAX_SERIAL_BATCH_SIZE,
  MIN_SERIAL_BATCH_SIZE,
  formatSerial,
} from "@/data/serial-numbers"

const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500]

interface GenerateSerialsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  year: number
  /** Highest sequence handed out so far, used to preview the range. */
  nextSequence: number
  isLoading?: boolean
  onGenerate: (count: number, note: string) => void
}

export function GenerateSerialsModal({
  open,
  onOpenChange,
  year,
  nextSequence,
  isLoading = false,
  onGenerate,
}: GenerateSerialsModalProps) {
  const [count, setCount] = useState("50")
  const [note, setNote] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setCount("50")
      setNote("")
      setError("")
    }
  }, [open])

  const parsedCount = Number(count)
  const isCountValid =
    Number.isInteger(parsedCount) && parsedCount >= MIN_SERIAL_BATCH_SIZE && parsedCount <= MAX_SERIAL_BATCH_SIZE

  const firstSerial = formatSerial(year, nextSequence + 1)
  const lastSerial = formatSerial(year, nextSequence + (isCountValid ? parsedCount : 0))

  const handleSubmit = () => {
    if (!isCountValid) {
      setError(`Enter a whole number between ${MIN_SERIAL_BATCH_SIZE} and ${MAX_SERIAL_BATCH_SIZE}.`)
      return
    }
    setError("")
    onGenerate(parsedCount, note)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isLoading && onOpenChange(next)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Serial Numbers</DialogTitle>
          <DialogDescription>
            Serials are handed out from a locked counter, so every generated number is unique across all
            devices. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serial-count">How many serials?</Label>
            <Input
              id="serial-count"
              type="number"
              inputMode="numeric"
              min={MIN_SERIAL_BATCH_SIZE}
              max={MAX_SERIAL_BATCH_SIZE}
              step={1}
              value={count}
              onChange={(e) => {
                setCount(e.target.value)
                setError("")
              }}
              className={error ? "border-destructive" : undefined}
              aria-invalid={!!error}
            />
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Between {MIN_SERIAL_BATCH_SIZE} and {MAX_SERIAL_BATCH_SIZE} per batch.
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {QUICK_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant={String(amount) === count ? "default" : "outline"}
                  size="sm"
                  className="h-8 cursor-pointer"
                  onClick={() => {
                    setCount(String(amount))
                    setError("")
                  }}
                >
                  {amount}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serial-note">Batch note (optional)</Label>
            <Input
              id="serial-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. March workshop stock"
              maxLength={120}
            />
          </div>

          <div className="rounded-md border border-border bg-muted/50 px-3 py-2.5">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Hash size={13} /> Range preview
            </div>
            <p className="font-mono text-sm">
              {firstSerial} <span className="text-muted-foreground">to</span> {lastSerial}
            </p>
            {!isCountValid && (
              <p className="mt-1 text-xs text-muted-foreground">Enter a valid quantity to see the full range.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isLoading || !isCountValid} className="cursor-pointer">
            {isLoading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" /> Generating…
              </>
            ) : (
              `Generate ${isCountValid ? parsedCount : ""} serials`.trim()
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
