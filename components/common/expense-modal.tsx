"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PAYMENT_METHODS, EXPENSE_STATUS, type Expense } from "@/data/expenses"
import { useToast } from "@/hooks/use-toast"

interface ExpenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  formData: Partial<Expense>
  onFormDataChange: (field: string, value: any) => void
  onSave: () => void
  saveLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  isEditing?: boolean
}

export function ExpenseModal({
  open,
  onOpenChange,
  title,
  formData,
  onFormDataChange,
  onSave,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  isLoading = false,
  isEditing = false,
}: ExpenseModalProps) {
  const { toast } = useToast()

  const handleSave = () => {
    if (!formData.title?.trim()) {
      toast({ title: "Validation Error", description: "Please enter expense title", variant: "destructive" })
      return
    }
    if (!formData.amount || formData.amount <= 0) {
      toast({ title: "Validation Error", description: "Please enter a valid amount", variant: "destructive" })
      return
    }
    if (!formData.date) {
      toast({ title: "Validation Error", description: "Please select a date", variant: "destructive" })
      return
    }
    if (!formData.paymentMethod) {
      toast({ title: "Validation Error", description: "Please select payment mode", variant: "destructive" })
      return
    }

    onSave()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title || ""}
              onChange={(e) => onFormDataChange("title", e.target.value)}
              placeholder="Enter expense title"
            />
          </div>

          {/* Amount and Date in same row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount || ""}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  if (value < 0) {
                    toast({
                      title: "Invalid Amount",
                      description: "Amount must be a positive number",
                      variant: "destructive",
                    })
                    onFormDataChange("amount", 0)
                  } else {
                    onFormDataChange("amount", value)
                  }
                }}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date || ""}
                onChange={(e) => onFormDataChange("date", e.target.value)}
                placeholder="Pick a date"
              />
            </div>
          </div>

          {/* Payment Mode */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">
              Payment Mode <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.paymentMethod || ""} onValueChange={(value) => onFormDataChange("paymentMethod", value)}>
              <SelectTrigger id="paymentMethod" className="w-full">  {/* ✅ w-full added here */}
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(method => (
                  <SelectItem key={method} value={method}>{method}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => onFormDataChange("description", e.target.value)}
              placeholder="Enter expense description (optional)"
              rows={3}
              className="w-full min-h-[80px] px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"
            />
          </div>

          {/* Attachment */}
          <div className="space-y-2">
            <Label htmlFor="attachment">Attachment</Label>
            {formData.attachmentUrl ? (
              <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                <span className="text-sm text-muted-foreground flex-1 truncate">
                  {formData.attachmentPath?.split('/').pop() || 'Current attachment'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onFormDataChange("attachmentUrl", undefined)
                    onFormDataChange("attachmentPath", undefined)
                  }}
                  className="text-destructive hover:text-white cursor-pointer"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <label htmlFor="attachment" className="block border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {formData.attachment instanceof File ? formData.attachment.name : 'Click to upload file'}
                  </div>
                  <div className="text-xs text-muted-foreground">Images, PDF, Documents (max 10MB)</div>
                </div>
                <Input
                  type="file"
                  className="hidden"
                  id="attachment"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      onFormDataChange("attachment", file)
                    }
                  }}
                />
              </label>
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
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="cursor-pointer"
          >
            {isLoading ? "Saving..." : (isEditing ? "Edit Expense" : "Create Expense")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}