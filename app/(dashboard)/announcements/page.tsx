"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2 } from "lucide-react"

interface Announcement {
  id: string
  title: string
  description: string
  type: "announcement" | "offer" | "promo"
  status: "active" | "inactive"
  date: string
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([
    {
      id: "1",
      title: "Summer Sale",
      description: "20% off on all services",
      type: "offer",
      status: "active",
      date: "2024-02-15",
    },
    {
      id: "2",
      title: "New Service Added",
      description: "We now offer HVAC services",
      type: "announcement",
      status: "active",
      date: "2024-02-10",
    },
    {
      id: "3",
      title: "Weekend Discount",
      description: "Use code WEEKEND for 15% off",
      type: "promo",
      status: "inactive",
      date: "2024-02-05",
    },
  ])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "announcement" as const,
    status: "active" as const,
  })

  const handleAdd = () => {
    if (formData.title) {
      setItems([...items, { id: Date.now().toString(), ...formData, date: new Date().toISOString().split("T")[0] }])
      setFormData({ title: "", description: "", type: "announcement", status: "active" })
      setIsAdding(false)
    }
  }

  const handleDelete = (id: string) => {
    setItems(items.filter((i) => i.id !== id))
  }

  const typeColors = {
    announcement: "bg-blue-100 text-blue-800",
    offer: "bg-green-100 text-green-800",
    promo: "bg-purple-100 text-purple-800",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Announcements & Offers</h1>
          <p className="text-muted-foreground">Manage announcements and promotional offers</p>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus size={16} className="mr-2" /> Add New
        </Button>
      </div>

      {isAdding && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Add New Announcement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="text"
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background"
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background"
              rows={3}
            />
            <div className="grid grid-cols-2 gap-4">
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="px-4 py-2 rounded-lg border border-border bg-background"
              >
                <option value="announcement">Announcement</option>
                <option value="offer">Offer</option>
                <option value="promo">Promo</option>
              </select>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="px-4 py-2 rounded-lg border border-border bg-background"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleAdd}>Add</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false)
                  setFormData({ title: "", description: "", type: "announcement", status: "active" })
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  <div className="flex gap-2 mt-3">
                    <Badge className={typeColors[item.type]}>
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </Badge>
                    <Badge variant={item.status === "active" ? "default" : "secondary"}>
                      {item.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{item.date}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm">
                    <Edit2 size={16} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
