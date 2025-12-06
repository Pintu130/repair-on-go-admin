"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Edit2, Trash2, ChevronDown, Loader2 } from "lucide-react"
import { useGetFAQsQuery, useCreateFAQMutation, useUpdateFAQMutation, useDeleteFAQMutation, type FAQ } from "@/lib/store/api/faqsApi"
import { useToast } from "@/hooks/use-toast"
import { ConfirmationModal } from "@/components/common/confirmation-modal"

export default function FAQPage() {
  // Fetch FAQs from Firebase
  const { data, isLoading, isError, error, refetch } = useGetFAQsQuery()
  const [createFAQ, { isLoading: isCreating }] = useCreateFAQMutation()
  const [updateFAQ, { isLoading: isUpdating }] = useUpdateFAQMutation()
  const [deleteFAQ, { isLoading: isDeleting }] = useDeleteFAQMutation()
  const { toast } = useToast()

  // Extract FAQs from API response or use empty array
  const faqs = data?.faqs || []

  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ question: "", answer: "" })

  const handleAdd = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill both question and answer fields.",
        variant: "destructive",
      })
      return
    }

    try {
      await createFAQ(formData).unwrap()

      toast({
        title: "FAQ Created Successfully! 🎉",
        description: "FAQ has been added successfully.",
      })

      setFormData({ question: "", answer: "" })
      setIsAdding(false)
      refetch()
    } catch (error: any) {
      console.error("❌ Error creating FAQ:", error)

      const errorMessage =
        error?.data?.error ||
        error?.data?.data ||
        error?.message ||
        "Failed to create FAQ. Please try again."

      toast({
        title: "Failed to Create FAQ",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (faq: FAQ) => {
    setEditingId(faq.id)
    setFormData({ question: faq.question, answer: faq.answer })
    setIsAdding(false)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !formData.question.trim() || !formData.answer.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill both question and answer fields.",
        variant: "destructive",
      })
      return
    }

    try {
      await updateFAQ({
        faqId: editingId,
        faqData: formData,
      }).unwrap()

      toast({
        title: "FAQ Updated Successfully! ✅",
        description: "FAQ has been updated successfully.",
      })

      setEditingId(null)
      setFormData({ question: "", answer: "" })
      refetch()
    } catch (error: any) {
      console.error("❌ Error updating FAQ:", error)

      const errorMessage =
        error?.data?.error ||
        error?.data?.data ||
        error?.message ||
        "Failed to update FAQ. Please try again."

      toast({
        title: "Failed to Update FAQ",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingId) return

    try {
      await deleteFAQ(deletingId).unwrap()

      toast({
        title: "FAQ Deleted Successfully! ✅",
        description: "FAQ has been deleted successfully.",
      })

      setDeletingId(null)
      refetch()
    } catch (error: any) {
      console.error("❌ Error deleting FAQ:", error)

      const errorMessage =
        error?.data?.error ||
        error?.data?.data ||
        error?.message ||
        "Failed to delete FAQ. Please try again."

      toast({
        title: "Failed to Delete FAQ",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">FAQ</h1>
          <p className="text-muted-foreground">Manage frequently asked questions</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="cursor-pointer">
          <Plus size={16} className="mr-2" /> Add FAQ
        </Button>
      </div>

      {(isAdding || editingId) && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>{editingId ? "Edit FAQ" : "Add New FAQ"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">
                Question <span className="text-destructive">*</span>
              </Label>
              <Input
                id="question"
                type="text"
                placeholder="Enter question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">
                Answer <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="answer"
                placeholder="Enter answer"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={editingId ? handleSaveEdit : handleAdd}
                className="cursor-pointer"
                disabled={isCreating || isUpdating}
              >
                {(isCreating || isUpdating) && <Loader2 size={16} className="mr-2 animate-spin" />}
                {editingId ? "Save" : "Add"}
              </Button>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => {
                  setIsAdding(false)
                  setEditingId(null)
                  setFormData({ question: "", answer: "" })
                }}
                disabled={isCreating || isUpdating}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-destructive">Error loading FAQs. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {faqs.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <p>No FAQs found. Click "Add FAQ" to create your first FAQ.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            faqs.map((faq) => (
              <Card key={faq.id}>
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{faq.question}</CardTitle>
                    <ChevronDown
                      size={20}
                      className={`transition-transform ${expandedId === faq.id ? "rotate-180" : ""}`}
                    />
                  </div>
                </CardHeader>
                {expandedId === faq.id && (
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground whitespace-pre-wrap">{faq.answer}</p>
                    <div className="flex gap-2 justify-start pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(faq)}
                        className="cursor-pointer shrink-0"
                      >
                        <Edit2 size={14} className="mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(faq.id)}
                        className="text-destructive cursor-pointer shrink-0"
                      >
                        <Trash2 size={14} className="mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={!!deletingId}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingId(null)
          }
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete FAQ?"
        description="Are you sure you want to delete this FAQ? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  )
}
