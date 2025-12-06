"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, Plus, Package, Loader2 } from "lucide-react"
import { CategoryModal } from "@/components/common/category-modal"
import { ConfirmationModal } from "@/components/common/confirmation-modal"
import { useGetCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation, type Category } from "@/lib/store/api/categoriesApi"
import { useToast } from "@/hooks/use-toast"

export default function CategoriesPage() {
  // Fetch categories from Firebase
  const { data, isLoading, isError, error, refetch } = useGetCategoriesQuery()
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation()
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation()
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation()
  const { toast } = useToast()

  // Extract categories from API response or use empty array
  const categories = data?.categories || []

  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    seoImage: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  })
  // Store base64 image data separately for API
  const [iconData, setIconData] = useState<string>("")
  const [seoImageData, setSeoImageData] = useState<string>("")

  const handleAddCategory = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      await createCategory({
        ...formData,
        iconData: iconData || formData.icon,
        seoImageData: seoImageData || formData.seoImage,
      }).unwrap()

      toast({
        title: "Category Created Successfully! 🎉",
        description: "Category has been added successfully.",
      })

      handleCancel()
      refetch()
    } catch (error: any) {
      console.error("❌ Error creating category:", error)

      const errorMessage =
        error?.data?.error ||
        error?.data?.data ||
        error?.message ||
        "Failed to create category. Please try again."

      toast({
        title: "Failed to Create Category",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({
      name: "",
      description: "",
      icon: "",
      seoImage: "",
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
    })
    setIconData("")
    setSeoImageData("")
  }

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingId) return

    try {
      await deleteCategory(deletingId).unwrap()

      toast({
        title: "Category Deleted Successfully! ✅",
        description: "Category and its images have been deleted successfully.",
      })

      setDeletingId(null)
      refetch()
    } catch (error: any) {
      console.error("❌ Error deleting category:", error)

      const errorMessage =
        error?.data?.error ||
        error?.data?.data ||
        error?.message ||
        "Failed to delete category. Please try again."

      toast({
        title: "Failed to Delete Category",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
      seoImage: category.seoImage,
      seoTitle: category.seoTitle,
      seoDescription: category.seoDescription,
      seoKeywords: category.seoKeywords,
    })
    setIconData("")
    setSeoImageData("")
  }

  const handleSaveEdit = async () => {
    if (!editingId || !formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      const updateData: any = { ...formData }
      
      // Only pass iconData if it's a new base64 image
      if (iconData && iconData.startsWith("data:image/")) {
        updateData.iconData = iconData
      }
      
      // Only pass seoImageData if it's a new base64 image
      if (seoImageData && seoImageData.startsWith("data:image/")) {
        updateData.seoImageData = seoImageData
      }

      await updateCategory({
        categoryId: editingId,
        categoryData: updateData,
      }).unwrap()

      toast({
        title: "Category Updated Successfully! ✅",
        description: "Category has been updated successfully.",
      })

      handleCancel()
      refetch()
    } catch (error: any) {
      console.error("❌ Error updating category:", error)

      const errorMessage =
        error?.data?.error ||
        error?.data?.data ||
        error?.message ||
        "Failed to update category. Please try again."

      toast({
        title: "Failed to Update Category",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Categories</h1>
          <p className="text-muted-foreground">Manage service categories</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="cursor-pointer">
          <Plus size={16} className="mr-2" /> Add Category
        </Button>
      </div>

      <CategoryModal
        open={isAdding || !!editingId}
        onOpenChange={(open) => {
          if (!open) {
            handleCancel()
          }
        }}
        formData={formData}
        onFormDataChange={(data) => {
          setFormData(data)
          // Extract base64 data if it's a new image
          if (data.icon && data.icon.startsWith("data:image/")) {
            setIconData(data.icon)
          }
          if (data.seoImage && data.seoImage.startsWith("data:image/")) {
            setSeoImageData(data.seoImage)
          }
        }}
        onSave={editingId ? handleSaveEdit : handleAddCategory}
        onCancel={handleCancel}
        isEditing={!!editingId}
        isLoading={isCreating || isUpdating}
      />

      <ConfirmationModal
        open={!!deletingId}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingId(null)
          }
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Category?"
        description="Are you sure you want to delete this category? This action cannot be undone. All associated images will also be deleted."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-destructive">Error loading categories. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <p>No categories found. Click "Add Category" to create your first category.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            categories.map((category) => (
          <Card key={category.id}>
            <CardHeader className="relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Package size={32} className="text-primary" />
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </div>
                </div>
                {(category.icon || (category as any).icon) && (
                  <div className="absolute top-0 right-4 w-14 h-14 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center shadow-sm">
                    <img
                      src={(category.icon || (category as any).icon) as string}
                      alt={category.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{category.description}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(category)} className="flex-1 cursor-pointer">
                  <Edit2 size={16} className="mr-2" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(category.id)}
                  className="flex-1 text-destructive cursor-pointer"
                >
                  <Trash2 size={16} className="mr-2" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
