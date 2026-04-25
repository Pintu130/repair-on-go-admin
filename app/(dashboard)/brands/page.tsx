"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, Plus, Loader2 } from "lucide-react"
import { StatusBadge } from "@/components/common/status-badge"
import { BrandModal } from "@/components/common/brand-modal"
import { ConfirmationModal } from "@/components/common/confirmation-modal"
import { useToast } from "@/hooks/use-toast"
import { useGetBrandsQuery, useCreateBrandMutation, useUpdateBrandMutation, useDeleteBrandMutation, type Brand } from "@/lib/store/api/brandsApi"

export default function BrandsPage() {
  const { toast } = useToast()
  
  // Firebase API hooks
  const { data, isLoading, isError, error, refetch } = useGetBrandsQuery()
  const [createBrand, { isLoading: isCreating }] = useCreateBrandMutation()
  const [updateBrand, { isLoading: isUpdating }] = useUpdateBrandMutation()
  const [deleteBrand, { isLoading: isDeleting }] = useDeleteBrandMutation()

  // Extract brands from API response or use empty array
  const brands = data?.brands || []

  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    image: "",
    status: "active" as "active" | "inactive",
  })
  
  // Store base64 image data separately for API
  const [imageData, setImageData] = useState<string>("")

  const handleAddBrand = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Brand name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      await createBrand({
        ...formData,
        imageData: imageData || undefined,
      }).unwrap()

      toast({
        title: "Brand Created Successfully! 🎉",
        description: "Brand has been added successfully.",
      })

      handleCancel()
      refetch()
    } catch (error: any) {
      console.error("❌ Error creating brand:", error)

      const errorMessage =
        error?.data?.error ||
        error?.data?.data ||
        error?.message ||
        "Failed to create brand. Please try again."

      toast({
        title: "Failed to Create Brand",
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
      image: "",
      status: "active",
    })
    setImageData("")
  }

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingId) return

    try {
      await deleteBrand(deletingId).unwrap()

      toast({
        title: "Brand Deleted Successfully! ✅",
        description: "Brand has been deleted successfully.",
      })

      setDeletingId(null)
      refetch()
    } catch (error: any) {
      console.error("❌ Error deleting brand:", error)

      const errorMessage =
        error?.data?.error ||
        error?.data?.data ||
        error?.message ||
        "Failed to delete brand. Please try again."

      toast({
        title: "Failed to Delete Brand",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (brand: Brand) => {
    setEditingId(brand.id)
    setFormData({
      name: brand.name,
      image: brand.image,
      status: brand.status,
    })
    setImageData("")
  }

  const handleSaveEdit = async () => {
    if (!editingId || !formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Brand name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      await updateBrand({
        categoryId: editingId,
        categoryData: {
          ...formData,
          imageData: imageData || undefined,
        },
      }).unwrap()

      toast({
        title: "Brand Updated Successfully! ✅",
        description: "Brand has been updated successfully.",
      })

      handleCancel()
      refetch()
    } catch (error: any) {
      console.error("❌ Error updating brand:", error)

      const errorMessage =
        error?.data?.error ||
        error?.data?.data ||
        error?.message ||
        "Failed to update brand. Please try again."

      toast({
        title: "Failed to Update Brand",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Brands</h1>
          <p className="text-muted-foreground">Manage device brands</p>
        </div>
        <Button
          onClick={() => {
            setFormData({
              name: "",
              image: "",
              status: "active",
            })
            setImageData("")
            setIsAdding(true)
          }}
          className="cursor-pointer"
        >
          <Plus size={16} className="mr-2" /> Add Brand
        </Button>
      </div>

      <BrandModal
        key={editingId || 'new'}
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
          if (data.image && data.image.startsWith("data:image/")) {
            setImageData(data.image)
          }
        }}
        onSave={() => editingId ? handleSaveEdit() : handleAddBrand()}
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
        title="Delete Brand?"
        description="Are you sure you want to delete this brand? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-destructive">
                {(error as any)?.data?.error || "Error loading brands. Please try again."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Image</th>
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Created</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12">
                      <div className="text-center text-muted-foreground">
                        <p>No brands found. Click "Add Brand" to create your first brand.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  brands.map((brand) => (
                    <tr key={brand.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="w-12 h-12 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center">
                          {brand.image ? (
                            <img
                              src={brand.image}
                              alt={brand.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-medium">{brand.name}</td>
                      <td className="p-4">
                        <StatusBadge
                          status={brand.status}
                        />
                      </td>
                      <td className="p-4 text-muted-foreground">{brand.createdAt}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(brand)} 
                            className="cursor-pointer"
                          >
                            <Edit2 size={16} className="mr-1" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(brand.id)}
                            className="text-destructive cursor-pointer"
                          >
                            <Trash2 size={16} className="mr-1" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  )
}
