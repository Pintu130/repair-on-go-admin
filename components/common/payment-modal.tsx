"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PaymentFormData {
  orderId: string
  customer: string
  amount: number
  status: "completed" | "pending" | "failed"
  method: "upi" | "debit_card" | "cash"
}

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: PaymentFormData
  onFormDataChange: (data: PaymentFormData) => void
  onSave: () => void
  onCancel: () => void
  isEditing: boolean
}

export function PaymentModal({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSave,
  onCancel,
  isEditing,
}: PaymentModalProps) {
  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Payment" : "Add New Payment"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="order-id">
              Order ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="order-id"
              type="text"
              placeholder="Order ID"
              value={formData.orderId}
              onChange={(e) => onFormDataChange({ ...formData, orderId: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-name">
              Customer Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customer-name"
              type="text"
              placeholder="Customer Name"
              value={formData.customer}
              onChange={(e) => onFormDataChange({ ...formData, customer: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹) <span className="text-destructive">*</span></Label>
            <Input
              id="amount"
              type="number"
              placeholder="Amount"
              value={formData.amount || ""}
              onChange={(e) => onFormDataChange({ ...formData, amount: Number.parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select
              value={formData.method}
              onValueChange={(value) => onFormDataChange({ ...formData, method: value as PaymentFormData["method"] })}
            >
              <SelectTrigger id="payment-method" className="w-full">
                <SelectValue placeholder="Select Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="debit_card">Debit Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => onFormDataChange({ ...formData, status: value as PaymentFormData["status"] })}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} className="cursor-pointer">
            Cancel
          </Button>
          <Button onClick={onSave} className="cursor-pointer">
            {isEditing ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

