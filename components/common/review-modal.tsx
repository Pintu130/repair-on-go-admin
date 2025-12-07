"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ReviewFormData {
  customer: string
  product: string
  rating: number
  comment: string
  status: "approved" | "pending"
  city: string
}

interface ReviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: ReviewFormData
  onFormDataChange: (data: ReviewFormData) => void
  onSave: () => void
  onCancel: () => void
  isEditing: boolean
}

export function ReviewModal({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSave,
  onCancel,
  isEditing,
}: ReviewModalProps) {
  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Review" : "Add New Review"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
            <Label htmlFor="product-service">
              Product/Service <span className="text-destructive">*</span>
            </Label>
            <Input
              id="product-service"
              type="text"
              placeholder="Product/Service"
              value={formData.product}
              onChange={(e) => onFormDataChange({ ...formData, product: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              type="text"
              placeholder="City"
              value={formData.city || ""}
              onChange={(e) => onFormDataChange({ ...formData, city: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rating">Rating</Label>
            <Select
              value={formData.rating.toString()}
              onValueChange={(value) => onFormDataChange({ ...formData, rating: Number.parseInt(value) })}
            >
              <SelectTrigger id="rating" className="w-full">
                <SelectValue placeholder="Select Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Star</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">
              Comment <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="comment"
              placeholder="Comment"
              value={formData.comment}
              onChange={(e) => onFormDataChange({ ...formData, comment: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => onFormDataChange({ ...formData, status: value as "approved" | "pending" })}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
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

