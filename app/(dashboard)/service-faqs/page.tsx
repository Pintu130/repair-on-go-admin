"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, Plus, HelpCircle, Loader2 } from "lucide-react"
import { ServiceFaqsModal } from "@/components/common/service-faqs-modal"
import { ConfirmationModal } from "@/components/common/confirmation-modal"
import {
  useGetServiceFaqsQuery,
  useCreateServiceFaqMutation,
  useUpdateServiceFaqMutation,
  useDeleteServiceFaqMutation,
  type ServiceFaq,
  type ServiceFaqItem,
} from "@/lib/store/api/serviceFaqsApi"
import { useGetCategoriesQuery } from "@/lib/store/api/categoriesApi"
import { useToast } from "@/hooks/use-toast"

// Helper function to extract error message with proper type guards
function getErrorMessage(error: any): string {
  if (!error) return "Unknown error occurred"
  // Check if error.data exists and is an object before accessing its properties
  if (typeof error?.data === "object" && error?.data?.error) {
    return error.data.error
  }
  if (typeof error?.data === "object" && error?.data?.data) {
    return error.data.data
  }
  if (typeof error?.message === "string") {
    return error.message
  }
  return "Failed to perform action. Please try again."
}

export default function ServiceFaqsPage() {
  // Fetch service FAQs and categories from Firebase
  const { data, isLoading, isError, error, refetch } = useGetServiceFaqsQuery()
  const { data: categoriesData } = useGetCategoriesQuery()
  const [createServiceFaq, { isLoading: isCreating }] = useCreateServiceFaqMutation()
  const [updateServiceFaq, { isLoading: isUpdating }] = useUpdateServiceFaqMutation()
  const [deleteServiceFaq, { isLoading: isDeleting }] = useDeleteServiceFaqMutation()
  const { toast } = useToast()

  // Extract service FAQs and categories from API response
  const serviceFaqs = data?.serviceFaqs || []
  const categories = categoriesData?.categories || []

  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    categoryId: "",
    categoryName: "",
    faqs: [] as ServiceFaqItem[],
  })

  const handleAddServiceFaq = async () => {
    if (!formData.categoryId) {
      toast({
        title: "Validation Error",
        description: "Please select a category.",
        variant: "destructive",
      })
      return
    }

    if (formData.faqs.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one FAQ.",
        variant: "destructive",
      })
      return
    }

    try {
      await createServiceFaq({
        ...formData,
      }).unwrap()

      toast({
        title: "Service FAQs Created Successfully! 🎉",
        description: "Service FAQs have been added successfully.",
      })

      handleCancel()
      refetch()
    } catch (error: any) {
      console.error("❌ Error creating service FAQs:", error)

      const errorMessage = getErrorMessage(error)

      toast({
        title: "Failed to Create Service FAQs",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleUpdateServiceFaq = async () => {
    if (!editingId) return

    if (!formData.categoryId) {
      toast({
        title: "Validation Error",
        description: "Please select a category.",
        variant: "destructive",
      })
      return
    }

    if (formData.faqs.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one FAQ.",
        variant: "destructive",
      })
      return
    }

    try {
      await updateServiceFaq({
        serviceFaqId: editingId,
        serviceFaqData: {
          ...formData,
        },
      }).unwrap()

      toast({
        title: "Service FAQs Updated Successfully! ✅",
        description: "Service FAQs have been updated successfully.",
      })

      handleCancel()
      refetch()
    } catch (error: any) {
      console.error("❌ Error updating service FAQs:", error)

      const errorMessage = getErrorMessage(error)

      toast({
        title: "Failed to Update Service FAQs",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({
      categoryId: "",
      categoryName: "",
      faqs: [],
    })
  }

  const handleEdit = (serviceFaq: ServiceFaq) => {
    setEditingId(serviceFaq.id)
    setFormData({
      categoryId: serviceFaq.categoryId,
      categoryName: serviceFaq.categoryName || "",
      faqs: serviceFaq.faqs || [],
    })
    setIsAdding(true)
  }

  const handleDeleteClick = (serviceFaqId: string) => {
    setDeletingId(serviceFaqId)
  }

  const handleConfirmDelete = async () => {
    if (!deletingId) return

    try {
      await deleteServiceFaq(deletingId).unwrap()

      toast({
        title: "Service FAQs Deleted Successfully! 🗑️",
        description: "Service FAQs have been deleted successfully.",
      })

      setDeletingId(null)
      refetch()
    } catch (error: any) {
      console.error("❌ Error deleting service FAQs:", error)

      const errorMessage = getErrorMessage(error)

      toast({
        title: "Failed to Delete Service FAQs",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service FAQs</h1>
          <p className="text-muted-foreground mt-2">
            Manage frequently asked questions for each service category
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Add Service FAQs
        </Button>
      </div>

      {/* Service FAQs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Service FAQs List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-destructive">
              <p>Error loading service FAQs: {getErrorMessage(error)}</p>
            </div>
          ) : serviceFaqs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Service FAQs found</p>
              <p className="text-sm mt-1">Create one to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Category</th>
                    <th className="text-left py-3 px-4 font-semibold">FAQ Count</th>
                    <th className="text-left py-3 px-4 font-semibold">Last Updated</th>
                    <th className="text-right py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceFaqs.map((serviceFaq) => (
                    <tr key={serviceFaq.id} className="border-b hover:bg-muted/50 transition">
                      <td className="py-3 px-4">
                        <span className="font-medium">{serviceFaq.categoryName || "N/A"}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{serviceFaq.faqs?.length || 0} FAQs</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {serviceFaq.updatedAt
                          ? new Date(serviceFaq.updatedAt).toLocaleDateString("en-IN")
                          : "N/A"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(serviceFaq)}
                            disabled={isUpdating || isDeleting}
                            className="gap-1 cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(serviceFaq.id)}
                            disabled={isDeleting}
                            className="gap-1 text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service FAQs Modal */}
      <ServiceFaqsModal
        open={isAdding}
        onOpenChange={setIsAdding}
        categoryId={formData.categoryId}
        categoryName={formData.categoryName}
        onCategoryChange={(categoryId, categoryName) =>
          setFormData({ ...formData, categoryId, categoryName })
        }
        faqs={formData.faqs}
        onFaqsChange={(faqs) => setFormData({ ...formData, faqs })}
        onSave={editingId ? handleUpdateServiceFaq : handleAddServiceFaq}
        onCancel={handleCancel}
        isEditing={editingId !== null}
        isLoading={isCreating || isUpdating}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete Service FAQs"
        description="Are you sure you want to delete this Service FAQs entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </div>
  )
}
