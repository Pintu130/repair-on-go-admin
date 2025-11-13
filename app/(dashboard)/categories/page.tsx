"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, Plus, Package } from "lucide-react"
import { mockCategories } from "@/data/categories"

export default function CategoriesPage() {
  const [categories, setCategories] = useState(mockCategories)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
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
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,
        seoKeywords: formData.seoKeywords,
        count: 0,
      }
      setCategories([...categories, newCategory])
      setFormData({ name: "", description: "", icon: "", seoTitle: "", seoDescription: "", seoKeywords: "" })
      setIsAdding(false)
    }
  }

  const handleDelete = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id))
  }

  const handleEdit = (category: (typeof mockCategories)[0]) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
      seoTitle: (category as any).seoTitle || "",
      seoDescription: (category as any).seoDescription || "",
      seoKeywords: (category as any).seoKeywords || "",
    })
  }

  const handleSaveEdit = () => {
    setCategories(categories.map((c) => (c.id === editingId ? { ...c, ...formData } : c)))
    setEditingId(null)
    setFormData({ name: "", description: "", icon: "", seoTitle: "", seoDescription: "", seoKeywords: "" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Categories</h1>
          <p className="text-muted-foreground">Manage service categories</p>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus size={16} className="mr-2" /> Add Category
        </Button>
      </div>

      {(isAdding || editingId) && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Category" : "Add New Category"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="text"
              placeholder="Category Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background"
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background"
              rows={3}
            />
            <input
              type="text"
              placeholder="Icon (emoji or text)"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background"
            />
            <div className="pt-4 border-t border-border">
              <h4 className="font-semibold text-sm mb-3">SEO Details</h4>
              <input
                type="text"
                placeholder="SEO Title"
                value={formData.seoTitle}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background mb-2"
              />
              <textarea
                placeholder="SEO Description (max 160 characters)"
                value={formData.seoDescription}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value.slice(0, 160) })}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background mb-2"
                rows={2}
                maxLength={160}
              />
              <input
                type="text"
                placeholder="SEO Keywords (comma separated)"
                value={formData.seoKeywords}
                onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={editingId ? handleSaveEdit : handleAddCategory}>{editingId ? "Save" : "Add"}</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false)
                  setEditingId(null)
                  setFormData({
                    name: "",
                    description: "",
                    icon: "",
                    seoTitle: "",
                    seoDescription: "",
                    seoKeywords: "",
                  })
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Package size={32} className="text-primary" />
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {category.count} services
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{category.description}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(category)} className="flex-1">
                  <Edit2 size={16} className="mr-2" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(category.id)}
                  className="flex-1 text-destructive"
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
