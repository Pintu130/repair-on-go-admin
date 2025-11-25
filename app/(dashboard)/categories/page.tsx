"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, Plus, Package } from "lucide-react"
import { mockCategories } from "@/data/categories"
import { CategoryModal } from "@/components/common/category-modal"
import { ConfirmationModal } from "@/components/common/confirmation-modal"

export default function CategoriesPage() {
  const [categories, setCategories] = useState(mockCategories)
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

  const handleAddCategory = () => {
    if (formData.name) {
      const newCategory = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        seoImage: formData.seoImage,
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,
        seoKeywords: formData.seoKeywords,
        count: 0,
      }
      setCategories([...categories, newCategory])
      handleCancel()
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
  }

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
  }

  const handleDeleteConfirm = () => {
    if (deletingId) {
      setCategories(categories.filter((c) => c.id !== deletingId))
      setDeletingId(null)
    }
  }

  const handleEdit = (category: (typeof mockCategories)[0]) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
      seoImage: (category as any).seoImage || "",
      seoTitle: (category as any).seoTitle || "",
      seoDescription: (category as any).seoDescription || "",
      seoKeywords: (category as any).seoKeywords || "",
    })
  }

  const handleSaveEdit = () => {
    setCategories(categories.map((c) => (c.id === editingId ? { ...c, ...formData } : c)))
    handleCancel()
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
        onFormDataChange={setFormData}
        onSave={editingId ? handleSaveEdit : handleAddCategory}
        onCancel={handleCancel}
        isEditing={!!editingId}
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
        description="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
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
                  <div className="absolute top-4 right-4 w-14 h-14 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center shadow-sm">
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
        ))}
      </div>
    </div>
  )
}
