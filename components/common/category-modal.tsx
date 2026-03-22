"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, Image as ImageIcon, Loader2, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type CategoryFormStatus = "active" | "inactive"

interface CategoryFormData {
  name: string
  description: string
  icon: string
  seoImage: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  status: CategoryFormStatus
  /** Lower number appears first in lists (customer app + admin). */
  sortOrder: number
  /** Reference images (URL or base64) — saved under referenceImages in Firestore. */
  referenceFront: string
  referenceProblem: string
  referenceModel: string
  /** Important guidelines — array of strings in Firestore `guidelines`. */
  guidelines: string[]
}

export const REFERENCE_IMAGE_SLOTS = [
  {
    key: "referenceFront" as const,
    label: "Front View",
    subtitle: "Overall condition",
  },
  {
    key: "referenceProblem" as const,
    label: "Problem Area",
    subtitle: "Close-up view",
  },
  {
    key: "referenceModel" as const,
    label: "Model/Brand",
    subtitle: "Serial number",
  },
] as const

interface CategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: CategoryFormData
  onFormDataChange: (data: CategoryFormData) => void
  /** Receives committed display order (always ≥ 1) so save uses the field even if user didn’t blur. */
  onSave: (sortOrder: number) => void
  onCancel: () => void
  isEditing: boolean
  isLoading?: boolean
}

export function CategoryModal({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSave,
  onCancel,
  isEditing,
  isLoading = false,
}: CategoryModalProps) {
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(formData.icon || null)
  const [seoImagePreview, setSeoImagePreview] = useState<string | null>(formData.seoImage || null)
  const [refFrontPreview, setRefFrontPreview] = useState<string | null>(formData.referenceFront || null)
  const [refProblemPreview, setRefProblemPreview] = useState<string | null>(formData.referenceProblem || null)
  const [refModelPreview, setRefModelPreview] = useState<string | null>(formData.referenceModel || null)
  /** String state so users can clear the field and type multi-digit positive numbers (1, 2, 10…). */
  const [orderInput, setOrderInput] = useState("1")
  const categoryFileInputRef = useRef<HTMLInputElement>(null)
  const seoFileInputRef = useRef<HTMLInputElement>(null)
  const refFrontFileRef = useRef<HTMLInputElement>(null)
  const refProblemFileRef = useRef<HTMLInputElement>(null)
  const refModelFileRef = useRef<HTMLInputElement>(null)

  // Sync image previews when formData changes (e.g., when editing)
  useEffect(() => {
    setCategoryImagePreview(formData.icon || null)
    setSeoImagePreview(formData.seoImage || null)
    setRefFrontPreview(formData.referenceFront || null)
    setRefProblemPreview(formData.referenceProblem || null)
    setRefModelPreview(formData.referenceModel || null)
  }, [formData.icon, formData.seoImage, formData.referenceFront, formData.referenceProblem, formData.referenceModel])

  // When modal opens or parent sort order changes (e.g. switch category), sync display order field
  useEffect(() => {
    if (!open) return
    const n = formData.sortOrder
    const safe = typeof n === "number" && !Number.isNaN(n) && n >= 1 ? Math.floor(n) : 1
    setOrderInput(String(safe))
  }, [open, formData.sortOrder])

  const handleCancel = () => {
    setCategoryImagePreview(null)
    setSeoImagePreview(null)
    setRefFrontPreview(null)
    setRefProblemPreview(null)
    setRefModelPreview(null)
    if (categoryFileInputRef.current) {
      categoryFileInputRef.current.value = ""
    }
    if (seoFileInputRef.current) {
      seoFileInputRef.current.value = ""
    }
    ;[refFrontFileRef, refProblemFileRef, refModelFileRef].forEach((r) => {
      if (r.current) r.current.value = ""
    })
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

  const handleReferenceUpload =
    (key: "referenceFront" | "referenceProblem" | "referenceModel") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      if (!file.type.startsWith("image/")) {
        alert("Please upload a valid image file")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        if (key === "referenceFront") {
          setRefFrontPreview(result)
          onFormDataChange({ ...formData, referenceFront: result })
        } else if (key === "referenceProblem") {
          setRefProblemPreview(result)
          onFormDataChange({ ...formData, referenceProblem: result })
        } else {
          setRefModelPreview(result)
          onFormDataChange({ ...formData, referenceModel: result })
        }
      }
      reader.readAsDataURL(file)
    }

  const handleRemoveReference =
    (key: "referenceFront" | "referenceProblem" | "referenceModel") => (e: React.MouseEvent) => {
      e.stopPropagation()
      if (key === "referenceFront") {
        setRefFrontPreview(null)
        onFormDataChange({ ...formData, referenceFront: "" })
        if (refFrontFileRef.current) refFrontFileRef.current.value = ""
      } else if (key === "referenceProblem") {
        setRefProblemPreview(null)
        onFormDataChange({ ...formData, referenceProblem: "" })
        if (refProblemFileRef.current) refProblemFileRef.current.value = ""
      } else {
        setRefModelPreview(null)
        onFormDataChange({ ...formData, referenceModel: "" })
        if (refModelFileRef.current) refModelFileRef.current.value = ""
      }
    }

  const addGuideline = () => {
    onFormDataChange({ ...formData, guidelines: [...formData.guidelines, ""] })
  }

  const updateGuideline = (index: number, value: string) => {
    const next = [...formData.guidelines]
    next[index] = value
    onFormDataChange({ ...formData, guidelines: next })
  }

  const removeGuideline = (index: number) => {
    const next = formData.guidelines.filter((_, i) => i !== index)
    onFormDataChange({ ...formData, guidelines: next })
  }

  const commitSortOrder = (): number => {
    if (orderInput === "") return 1
    const n = parseInt(orderInput, 10)
    return Number.isNaN(n) || n < 1 ? 1 : n
  }

  const handleSaveClick = () => {
    const sortOrder = commitSortOrder()
    setOrderInput(String(sortOrder))
    onFormDataChange({ ...formData, sortOrder })
    onSave(sortOrder)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Category" : "Add New Category"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:w-96 space-y-4">
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
              <Label htmlFor="category-sort-order">Display order</Label>
              <Input
                id="category-sort-order"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="1"
                className="tabular-nums"
                value={orderInput}
                onChange={(e) => {
                  const raw = e.target.value
                  if (raw === "") {
                    setOrderInput("")
                    return
                  }
                  if (!/^\d+$/.test(raw)) return
                  const n = parseInt(raw, 10)
                  if (n < 1) return
                  setOrderInput(raw)
                  onFormDataChange({ ...formData, sortOrder: n })
                }}
                onBlur={() => {
                  if (orderInput === "") {
                    setOrderInput("1")
                    onFormDataChange({ ...formData, sortOrder: 1 })
                    return
                  }
                  const n = parseInt(orderInput, 10)
                  if (Number.isNaN(n) || n < 1) {
                    setOrderInput("1")
                    onFormDataChange({ ...formData, sortOrder: 1 })
                  } else {
                    setOrderInput(String(n))
                    onFormDataChange({ ...formData, sortOrder: n })
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Positive number only (1, 2, 3…). Smaller shows first. If this number is already used, existing
                categories at that position and below shift down by 1 automatically.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-status">Status</Label>
              <Select
                value={formData.status ?? "active"}
                onValueChange={(value: CategoryFormStatus) =>
                  onFormDataChange({ ...formData, status: value })
                }
              >
                <SelectTrigger id="category-status" className="w-full cursor-pointer">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="cursor-pointer">
                    Active
                  </SelectItem>
                  <SelectItem value="inactive" className="cursor-pointer">
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Inactive categories can be hidden from customers on the app (if your app filters by status).
              </p>
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
          </div>

          {/* Right Column - Reference Images, Important Guidelines & SEO Details */}
          <div className="lg:w-96 space-y-4">
            {/* Reference images — customer booking (Firebase: referenceImages.*) */}
            <div className="space-y-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-border">
              <div>
                <Label className="text-base font-semibold">Reference images</Label>
               
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {REFERENCE_IMAGE_SLOTS.map((slot, idx) => {
                  const fileRef = [refFrontFileRef, refProblemFileRef, refModelFileRef][idx]!
                  const preview = [refFrontPreview, refProblemPreview, refModelPreview][idx]
                  const key = slot.key
                  return (
                    <div key={key} className="space-y-2 flex flex-col">
                     
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/*"
                        className="hidden"
                        onChange={handleReferenceUpload(key)}
                      />
                      {preview ? (
                        <div
                          className="relative w-full aspect-square max-h-28 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center cursor-pointer group mx-auto"
                          onClick={() => fileRef.current?.click()}
                        >
                          <img src={preview} alt={slot.label} className="w-full h-full object-contain" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Upload className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 rounded-full cursor-pointer"
                            onClick={handleRemoveReference(key)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="flex flex-col items-center justify-center aspect-square max-h-28 border-2 border-dashed border-border rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer p-1"
                          onClick={() => fileRef.current?.click()}
                        >
                          <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                          <p className="text-[10px] font-medium text-muted-foreground text-center">Click to upload</p>
                          <p className="text-[8px] text-muted-foreground">max 5MB</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Important Guidelines */}
            <Card className="border-border p-0 gap-2">
              <CardHeader className="py-2 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Important Guidelines</CardTitle>
                  <Button type="button" variant="outline" size="sm" className="gap-2 cursor-pointer" onClick={addGuideline}>
                    <Plus className="h-4 w-4" />
                    Add guideline
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 px-4 pb-2">
                {formData.guidelines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No guidelines yet. Click &quot;Add guideline&quot;.</p>
                ) : (
                  formData.guidelines.map((line, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Input
                        value={line}
                        onChange={(e) => updateGuideline(index, e.target.value)}
                        placeholder={`Guideline ${index + 1}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 cursor-pointer text-destructive"
                        onClick={() => removeGuideline(index)}
                        aria-label="Remove guideline"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
               
              </CardContent>
            </Card>

            <div className="pt-4 lg:pt-0 border-t lg:border-t-0 border-border space-y-4">
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
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button type="button" onClick={handleSaveClick} className="cursor-pointer" disabled={isLoading}>
            {isLoading && <Loader2 size={16} className="mr-2 animate-spin" />}
            {isEditing ? "Save" : "Add"}
          </Button>
          <Button variant="outline" className="cursor-pointer" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

