"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, Image as ImageIcon } from "lucide-react"

interface CategoryFormData {
  name: string
  description: string
  icon: string
  seoImage: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
}

interface CategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: CategoryFormData
  onFormDataChange: (data: CategoryFormData) => void
  onSave: () => void
  onCancel: () => void
  isEditing: boolean
}

export function CategoryModal({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSave,
  onCancel,
  isEditing,
}: CategoryModalProps) {
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(formData.icon || null)
  const [seoImagePreview, setSeoImagePreview] = useState<string | null>(formData.seoImage || null)
  const categoryFileInputRef = useRef<HTMLInputElement>(null)
  const seoFileInputRef = useRef<HTMLInputElement>(null)

  // Sync image previews when formData changes (e.g., when editing)
  useEffect(() => {
    setCategoryImagePreview(formData.icon || null)
    setSeoImagePreview(formData.seoImage || null)
  }, [formData.icon, formData.seoImage])

  const handleCancel = () => {
    setCategoryImagePreview(null)
    setSeoImagePreview(null)
    if (categoryFileInputRef.current) {
      categoryFileInputRef.current.value = ""
    }
    if (seoFileInputRef.current) {
      seoFileInputRef.current.value = ""
    }
    onCancel()
    onOpenChange(false)
  }

  const handleImageUpload = (type: "category" | "seo") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate image file
      if (!file.type.startsWith("image/")) {
        alert("Please upload a valid image file")
        return
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB")
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        if (type === "category") {
          setCategoryImagePreview(result)
          onFormDataChange({ ...formData, icon: result })
        } else {
          setSeoImagePreview(result)
          onFormDataChange({ ...formData, seoImage: result })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = (type: "category" | "seo") => (e: React.MouseEvent) => {
    e.stopPropagation()
    if (type === "category") {
      setCategoryImagePreview(null)
      onFormDataChange({ ...formData, icon: "" })
      if (categoryFileInputRef.current) {
        categoryFileInputRef.current.value = ""
      }
    } else {
      setSeoImagePreview(null)
      onFormDataChange({ ...formData, seoImage: "" })
      if (seoFileInputRef.current) {
        seoFileInputRef.current.value = ""
      }
    }
  }

  const handleImageClick = (type: "category" | "seo") => () => {
    if (type === "category") {
      categoryFileInputRef.current?.click()
    } else {
      seoFileInputRef.current?.click()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Category" : "Add New Category"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">
              Category Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="category-name"
              type="text"
              placeholder="Category Name"
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-description">Description</Label>
            <Textarea
              id="category-description"
              placeholder="Description"
              value={formData.description}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-center block">Images</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {/* Category Image */}
              <div className="space-y-2 flex flex-col items-center">
                <Label htmlFor="category-icon" className="text-xs font-medium text-center">
                  Category Image
                </Label>
                <input
                  ref={categoryFileInputRef}
                  id="category-icon"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload("category")}
                  className="hidden"
                />
                {categoryImagePreview ? (
                  <div
                    className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center cursor-pointer group mx-auto"
                    onClick={handleImageClick("category")}
                  >
                    <img
                      src={categoryImagePreview}
                      alt="Category preview"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full cursor-pointer"
                      onClick={handleRemoveImage("category")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center w-28 h-28 sm:w-32 sm:h-32 border-2 border-dashed border-border rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer mx-auto"
                    onClick={handleImageClick("category")}
                  >
                    <ImageIcon className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground mb-1" />
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Click to upload</p>
                    <p className="text-xs text-muted-foreground">max 5MB</p>
                  </div>
                )}
              </div>

              {/* SEO Image */}
              <div className="space-y-2 flex flex-col items-center">
                <Label htmlFor="seo-image" className="text-xs font-medium text-center">
                  SEO Image
                </Label>
                <input
                  ref={seoFileInputRef}
                  id="seo-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload("seo")}
                  className="hidden"
                />
                {seoImagePreview ? (
                  <div
                    className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center cursor-pointer group mx-auto"
                    onClick={handleImageClick("seo")}
                  >
                    <img
                      src={seoImagePreview}
                      alt="SEO preview"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full cursor-pointer"
                      onClick={handleRemoveImage("seo")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center w-28 h-28 sm:w-32 sm:h-32 border-2 border-dashed border-border rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer mx-auto"
                    onClick={handleImageClick("seo")}
                  >
                    <ImageIcon className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground mb-1" />
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Click to upload</p>
                    <p className="text-xs text-muted-foreground">max 5MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-4">
            <h4 className="font-semibold text-sm">SEO Details</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo-title">SEO Title</Label>
                <Input
                  id="seo-title"
                  type="text"
                  placeholder="SEO Title"
                  value={formData.seoTitle}
                  onChange={(e) => onFormDataChange({ ...formData, seoTitle: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo-description">
                  SEO Description <span className="text-xs text-muted-foreground">(max 160 characters)</span>
                </Label>
                <Textarea
                  id="seo-description"
                  placeholder="SEO Description"
                  value={formData.seoDescription}
                  onChange={(e) => onFormDataChange({ ...formData, seoDescription: e.target.value.slice(0, 160) })}
                  rows={2}
                  maxLength={160}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo-keywords">SEO Keywords (comma separated)</Label>
                <Input
                  id="seo-keywords"
                  type="text"
                  placeholder="SEO Keywords (comma separated)"
                  value={formData.seoKeywords}
                  onChange={(e) => onFormDataChange({ ...formData, seoKeywords: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={onSave} className="cursor-pointer">
              {isEditing ? "Save" : "Add"}
            </Button>
            <Button variant="outline" className="cursor-pointer" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

