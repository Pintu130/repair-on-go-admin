import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ServiceCenterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { reason: string; amount?: number }) => void
}

export function ServiceCenterModal({ open, onOpenChange, onSubmit }: ServiceCenterModalProps) {
  const [serviceReason, setServiceReason] = useState("")
  const [serviceAmount, setServiceAmount] = useState("")

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setServiceReason("")
      setServiceAmount("")
    }
  }, [open])

  const handleSubmit = () => {
    if (!serviceReason.trim()) {
      alert("Please enter the reason for service")
      return
    }
    const amount = serviceAmount ? parseFloat(serviceAmount) : undefined
    onSubmit({ reason: serviceReason, amount })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Service Center Details</DialogTitle>
          <DialogDescription>
            Please provide the reason for service and optional service amount.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Service Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Describe the issue found in the product..."
              value={serviceReason}
              onChange={(e) => setServiceReason(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Service Amount (Optional)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter service amount"
              value={serviceAmount}
              onChange={(e) => setServiceAmount(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="cursor-pointer">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="cursor-pointer">Update Status</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
