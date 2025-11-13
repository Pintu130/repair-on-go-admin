"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Search, ChevronLeft, ChevronRight, Edit2, Trash2, Plus } from "lucide-react"
import { mockOrders, type Order } from "@/data/orders"

const ITEMS_PER_PAGE = 8

const statusColors = {
  created: "bg-gray-100 text-gray-800",
  verified: "bg-blue-100 text-blue-800",
  picked: "bg-purple-100 text-purple-800",
  repaired: "bg-yellow-100 text-yellow-800",
  delivered: "bg-green-100 text-green-800",
}

const statusLabels = {
  created: "Created",
  verified: "Verified",
  picked: "Picked",
  repaired: "Repaired",
  delivered: "Delivered",
}

interface OrderItem extends Order {}

export default function OrdersPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | Order["status"]>("all")
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all")
  const [orders, setOrders] = useState<OrderItem[]>(mockOrders)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    customer: "",
    service: "",
    category: "",
    amount: 0,
    status: "created" as const,
  })

  const categories = ["all", ...new Set(orders.map((o) => o.category))]
  const statuses = ["all", "created", "verified", "picked", "repaired", "delivered"] as const

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || order.status === statusFilter
      const matchesCategory = categoryFilter === "all" || order.category === categoryFilter
      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [searchTerm, statusFilter, categoryFilter, orders])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleAdd = () => {
    setEditingId(null)
    setFormData({ customer: "", service: "", category: "Plumbing", amount: 0, status: "created" })
    setIsOpen(true)
  }

  const handleEdit = (order: OrderItem) => {
    setEditingId(order.id)
    setFormData({
      customer: order.customer,
      service: order.service,
      category: order.category,
      amount: order.amount,
      status: order.status,
    })
    setIsOpen(true)
  }

  const handleSave = () => {
    if (!formData.customer || !formData.service) return

    if (editingId) {
      setOrders(orders.map((o) => (o.id === editingId ? { ...o, ...formData, id: editingId } : o)))
    } else {
      const newOrder: OrderItem = { ...formData, id: `ORD-${Date.now().toString().slice(-6)}` }
      setOrders([...orders, newOrder])
    }
    setIsOpen(false)
  }

  const handleDelete = (id: string) => {
    setOrders(orders.filter((o) => o.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Orders</h1>
          <p className="text-muted-foreground">Track and manage all repair orders</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={16} className="mr-2" /> Add Order
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by order ID or customer..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any)
                setCurrentPage(1)
              }}
              className="px-4 py-2 rounded-lg border border-border bg-background"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All Status" : statusLabels[s as Order["status"]]}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-2 rounded-lg border border-border bg-background"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All Categories" : c}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Order ID</th>
                  <th className="text-left py-3 px-4 font-semibold">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold">Service</th>
                  <th className="text-left py-3 px-4 font-semibold">Category</th>
                  <th className="text-left py-3 px-4 font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 font-mono text-xs font-semibold">{order.id}</td>
                    <td className="py-3 px-4">{order.customer}</td>
                    <td className="py-3 px-4">{order.service}</td>
                    <td className="py-3 px-4">{order.category}</td>
                    <td className="py-3 px-4 font-semibold">₹{order.amount}</td>
                    <td className="py-3 px-4">
                      <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(order)}>
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(order.id)}
                        className="text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Showing {paginatedData.length ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit order dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Order" : "Add New Order"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Customer Name</label>
              <input
                type="text"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Service</label>
              <input
                type="text"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                placeholder="e.g., Pipe repair"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
              >
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Carpentry">Carpentry</option>
                <option value="Painting">Painting</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Amount (₹)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number.parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Order["status"] })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="created">Created</option>
                  <option value="verified">Verified</option>
                  <option value="picked">Picked</option>
                  <option value="repaired">Repaired</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editingId ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
