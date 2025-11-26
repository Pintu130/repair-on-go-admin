"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CouponFormData {
  code: string
  discountType: "percentage" | "fixed"
  discountValue: number
  validFrom: string
  validTo: string
  status: "active" | "inactive"
  usageLimit?: number
  minimumOrderAmount?: number
}

interface CouponModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: CouponFormData
  onFormDataChange: (data: CouponFormData) => void
  onSave: () => void
  onCancel: () => void
  isEditing: boolean
}

export function CouponModal({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSave,
  onCancel,
  isEditing,
}: CouponModalProps) {
  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Coupon" : "Add New Coupon"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">
              Coupon Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              type="text"
              placeholder="e.g., SAVE20, FLAT50"
              value={formData.code}
              onChange={(e) => onFormDataChange({ ...formData, code: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount-type">
                Discount Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.discountType}
                onValueChange={(value) =>
                  onFormDataChange({ ...formData, discountType: value as "percentage" | "fixed" })
                }
              >
                <SelectTrigger id="discount-type" className="w-full">
                  <SelectValue placeholder="Select Discount Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount-value">
                Discount Value {formData.discountType === "percentage" ? "(%)" : "(₹)"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="discount-value"
                type="number"
                placeholder={formData.discountType === "percentage" ? "e.g., 20" : "e.g., 100"}
                value={formData.discountValue || ""}
                onChange={(e) => onFormDataChange({ ...formData, discountValue: Number.parseFloat(e.target.value) || 0 })}
                min="0"
                max={formData.discountType === "percentage" ? "100" : undefined}
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valid-from">
                Valid From <span className="text-destructive">*</span>
              </Label>
              <Input
                id="valid-from"
                type="date"
                value={formData.validFrom}
                onChange={(e) => onFormDataChange({ ...formData, validFrom: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valid-to">
                Valid To <span className="text-destructive">*</span>
              </Label>
              <Input
                id="valid-to"
                type="date"
                value={formData.validTo}
                onChange={(e) => onFormDataChange({ ...formData, validTo: e.target.value })}
                min={formData.validFrom}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => onFormDataChange({ ...formData, status: value as "active" | "inactive" })}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usage-limit">Usage Limit (Optional)</Label>
              <Input
                id="usage-limit"
                type="number"
                placeholder="e.g., 100"
                value={formData.usageLimit || ""}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    usageLimit: e.target.value ? Number.parseInt(e.target.value, 10) : undefined,
                  })
                }
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minimum-order">Minimum Order Amount (₹) (Optional)</Label>
            <Input
              id="minimum-order"
              type="number"
              placeholder="e.g., 500"
              value={formData.minimumOrderAmount || ""}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  minimumOrderAmount: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                })
              }
              min="0"
              step="0.01"
            />
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

