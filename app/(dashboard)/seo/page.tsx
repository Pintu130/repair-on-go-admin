"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2 } from "lucide-react"

interface SEOItem {
  id: string
  page: string
  metaTitle: string
  metaDescription: string
  ogImage: string
}

export default function SEOPage() {
  const [seoItems, setSeoItems] = useState<SEOItem[]>([
    {
      id: "1",
      page: "Home",
      metaTitle: "RepairOnGo - Home Services",
      metaDescription: "Professional repair services",
      ogImage: "/og-home.jpg",
    },
    {
      id: "2",
      page: "Services",
      metaTitle: "Our Services",
      metaDescription: "Browse our service categories",
      ogImage: "/og-services.jpg",
    },
  ])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({ page: "", metaTitle: "", metaDescription: "", ogImage: "" })

  const handleAdd = () => {
    if (formData.page && formData.metaTitle) {
      setSeoItems([...seoItems, { id: Date.now().toString(), ...formData }])
      setFormData({ page: "", metaTitle: "", metaDescription: "", ogImage: "" })
      setIsAdding(false)
    }
  }

  const handleEdit = (item: SEOItem) => {
    setEditingId(item.id)
    setFormData(item)
  }

  const handleSaveEdit = () => {
    setSeoItems(seoItems.map((s) => (s.id === editingId ? { ...s, ...formData } : s)))
    setEditingId(null)
    setFormData({ page: "", metaTitle: "", metaDescription: "", ogImage: "" })
  }

  const handleDelete = (id: string) => {
    setSeoItems(seoItems.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">SEO Management</h1>
          <p className="text-muted-foreground">Manage meta tags and OG images</p>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus size={16} className="mr-2" /> Add SEO
        </Button>
      </div>

      {(isAdding || editingId) && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>{editingId ? "Edit SEO" : "Add New SEO"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="text"
              placeholder="Page Name"
              value={formData.page}
              onChange={(e) => setFormData({ ...formData, page: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background"
            />
            <input
              type="text"
              placeholder="Meta Title"
              value={formData.metaTitle}
              onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background"
            />
            <textarea
              placeholder="Meta Description"
              value={formData.metaDescription}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background"
              rows={3}
            />
            <input
              type="text"
              placeholder="OG Image URL"
              value={formData.ogImage}
              onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background"
            />
            <div className="flex gap-3">
              <Button onClick={editingId ? handleSaveEdit : handleAdd}>{editingId ? "Save" : "Add"}</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false)
                  setEditingId(null)
                  setFormData({ page: "", metaTitle: "", metaDescription: "", ogImage: "" })
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 font-semibold">Page</th>
              <th className="text-left py-3 px-4 font-semibold">Meta Title</th>
              <th className="text-left py-3 px-4 font-semibold">Description</th>
              <th className="text-left py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {seoItems.map((item) => (
              <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                <td className="py-3 px-4 font-semibold">{item.page}</td>
                <td className="py-3 px-4 text-xs truncate">{item.metaTitle}</td>
                <td className="py-3 px-4 text-xs truncate">{item.metaDescription}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
