"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Image as ImageIcon } from "lucide-react"

interface BrandModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: {
    name: string
    image: string
    status: "active" | "inactive"
  }
  onFormDataChange: (data: any) => void
  onSave: () => void
  onCancel: () => void
  isEditing: boolean
  isLoading: boolean
}

export function BrandModal({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSave,
  onCancel,
  isEditing,
  isLoading,
}: BrandModalProps) {
  const [imagePreview, setImagePreview] = useState<string>("")

  // Reset imagePreview when formData.image becomes empty (new brand mode)
  React.useEffect(() => {
    if (!formData.image && !formData.image?.startsWith("data:image/")) {
      setImagePreview("")
    }
  }, [formData.image])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB")
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setImagePreview(result)
        onFormDataChange({ ...formData, image: result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClose = () => {
    setImagePreview("")
    onCancel()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Brand" : "Add New Brand"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-3">
            <Label htmlFor="image" className="text-base font-medium">Brand Image</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center space-y-4">
                {formData.image || imagePreview ? (
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-lg border border-border overflow-hidden bg-background shadow-sm">
                      <img
                        src={formData.image || imagePreview}
                        alt="Brand preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-background">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="text-center">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image')?.click()}
                    className="cursor-pointer"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.image || imagePreview ? "Change Image" : "Upload Image"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG up to 5MB • Recommended: 400x400px
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Brand Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-medium">Brand Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              placeholder="Enter brand name"
              className="w-full h-11"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-base font-medium">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "active" | "inactive") => 
                onFormDataChange({ ...formData, status: value })
              }
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Active
                  </div>
                </SelectItem>
                <SelectItem value="inactive">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Inactive
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="cursor-pointer h-11 px-6"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onSave}
              disabled={isLoading || !formData.name.trim()}
              className="cursor-pointer h-11 px-6"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditing ? "Update Brand" : "Create Brand"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
