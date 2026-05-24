"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X, Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import type { ServiceFaqItem } from "@/lib/store/api/serviceFaqsApi"
import type { Category } from "@/lib/store/api/categoriesApi"

interface ServiceFaqsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryId: string
  categoryName: string
  onCategoryChange: (categoryId: string, categoryName: string) => void
  faqs: ServiceFaqItem[]
  onFaqsChange: (faqs: ServiceFaqItem[]) => void
  onSave: () => void
  onCancel: () => void
  isEditing: boolean
  isLoading?: boolean
  categories: Category[]
}

export function ServiceFaqsModal({
  open,
  onOpenChange,
  categoryId,
  categoryName,
  onCategoryChange,
  faqs,
  onFaqsChange,
  onSave,
  onCancel,
  isEditing,
  isLoading = false,
  categories,
}: ServiceFaqsModalProps) {
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  useEffect(() => {
    if (open) {
      setHasAttemptedSubmit(false)
    }
  }, [open])

  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
    setHasAttemptedSubmit(false)
  }

  const handleSaveWithValidation = () => {
    setHasAttemptedSubmit(true)
    onSave()
  }

  const addFaq = () => {
    onFaqsChange([{ question: "", answer: "" }, ...faqs])
  }

  const updateFaq = (index: number, field: "question" | "answer", value: string) => {
    const updated = [...faqs]
    updated[index] = { ...updated[index], [field]: value }
    onFaqsChange(updated)
  }

  const removeFaq = (index: number) => {
    const updated = faqs.filter((_, i) => i !== index)
    onFaqsChange(updated)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>{isEditing ? "Edit Service FAQs" : "Add Service FAQs"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 px-6 overflow-y-auto grow py-2">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category-select">
              Select Category <span className="text-destructive">*</span>
            </Label>
            <Select value={categoryId} onValueChange={(value) => {
              const selected = categories.find((cat) => cat.id === value)
              onCategoryChange(value, selected?.name || "")
            }}>
              <SelectTrigger id="category-select" className="w-full cursor-pointer">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="cursor-pointer">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasAttemptedSubmit && !categoryId && <p className="text-xs text-destructive">Category is required</p>}
          </div>

          {/* FAQs Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Service FAQs</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFaq}
                disabled={isLoading}
                className="gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add FAQ
              </Button>
            </div>

            {faqs.length === 0 ? (
              <Card className="bg-muted/50">
                <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                  No FAQs added yet. Click "Add FAQ" to get started.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <Card key={index} className="p-4 relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeFaq(index)}
                      disabled={isLoading}
                      className="absolute top-2 right-2 cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Remove FAQ"
                      aria-label="Remove FAQ"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="space-y-3 pr-10">
                      <div className="space-y-2">
                        <Label htmlFor={`question-${index}`} className="text-sm">
                          Question <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`question-${index}`}
                          type="text"
                          placeholder="Enter FAQ question"
                          value={faq.question}
                          onChange={(e) => updateFaq(index, "question", e.target.value)}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`answer-${index}`} className="text-sm">
                          Answer <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id={`answer-${index}`}
                          placeholder="Enter FAQ answer"
                          value={faq.answer}
                          onChange={(e) => updateFaq(index, "answer", e.target.value)}
                          rows={3}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {faqs.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {faqs.length} FAQ{faqs.length !== 1 ? "s" : ""} added
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 p-6 pt-4 border-t shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSaveWithValidation}
            disabled={isLoading || !categoryId || faqs.length === 0}
            className="gap-2 cursor-pointer"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Update FAQs" : "Create FAQs"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
