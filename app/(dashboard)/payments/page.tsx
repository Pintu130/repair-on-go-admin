"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Search, ChevronLeft, ChevronRight, Download, Edit2, Trash2, Plus } from "lucide-react"

interface Payment {
  id: string
  orderId: string
  customer: string
  amount: number
  status: "completed" | "pending" | "failed"
  method: "credit_card" | "debit_card" | "upi" | "wallet"
  date: string
}

const mockPayments: Payment[] = [
  {
    id: "P001",
    orderId: "ORD001",
    customer: "John Smith",
    amount: 150,
    status: "completed",
    method: "credit_card",
    date: "2024-02-15",
  },
  {
    id: "P002",
    orderId: "ORD002",
    customer: "Sarah Johnson",
    amount: 200,
    status: "completed",
    method: "debit_card",
    date: "2024-02-14",
  },
  {
    id: "P003",
    orderId: "ORD003",
    customer: "Michael Brown",
    amount: 350,
    status: "pending",
    method: "upi",
    date: "2024-02-13",
  },
  {
    id: "P004",
    orderId: "ORD004",
    customer: "Emily Davis",
    amount: 280,
    status: "completed",
    method: "wallet",
    date: "2024-02-12",
  },
  {
    id: "P005",
    orderId: "ORD005",
    customer: "David Wilson",
    amount: 175,
    status: "failed",
    method: "credit_card",
    date: "2024-02-11",
  },
  {
    id: "P006",
    orderId: "ORD006",
    customer: "Jessica Miller",
    amount: 450,
    status: "completed",
    method: "credit_card",
    date: "2024-02-10",
  },
  {
    id: "P007",
    orderId: "ORD007",
    customer: "James Taylor",
    amount: 550,
    status: "completed",
    method: "debit_card",
    date: "2024-02-09",
  },
  {
    id: "P008",
    orderId: "ORD008",
    customer: "Lisa Anderson",
    amount: 320,
    status: "pending",
    method: "upi",
    date: "2024-02-08",
  },
]

const ITEMS_PER_PAGE = 8

const statusColors = {
  completed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
}

const methodLabels = {
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  upi: "UPI",
  wallet: "Digital Wallet",
}

export default function PaymentsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | Payment["status"]>("all")
  const [payments, setPayments] = useState<Payment[]>(mockPayments)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    orderId: "",
    customer: "",
    amount: 0,
    status: "pending" as const,
    method: "credit_card" as const,
  })

  const filtered = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch =
        payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customer.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || payment.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchTerm, statusFilter, payments])

  const stats = {
    totalRevenue: filtered.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0),
    completedTransactions: filtered.filter((p) => p.status === "completed").length,
    pendingAmount: filtered.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0),
  }

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // CRUD functions
  const handleAdd = () => {
    setEditingId(null)
    setFormData({ orderId: "", customer: "", amount: 0, status: "pending", method: "credit_card" })
    setIsOpen(true)
  }

  const handleEdit = (payment: Payment) => {
    setEditingId(payment.id)
    setFormData({
      orderId: payment.orderId,
      customer: payment.customer,
      amount: payment.amount,
      status: payment.status,
      method: payment.method,
    })
    setIsOpen(true)
  }

  const handleSave = () => {
    if (!formData.orderId || !formData.customer) return

    if (editingId) {
      setPayments(
        payments.map((p) =>
          p.id === editingId ? { ...p, ...formData, id: editingId, date: new Date().toISOString().split("T")[0] } : p,
        ),
      )
    } else {
      const newPayment: Payment = {
        ...formData,
        id: `P${Date.now().toString().slice(-3)}`,
        date: new Date().toISOString().split("T")[0],
      }
      setPayments([...payments, newPayment])
    }
    setIsOpen(false)
  }

  const handleDelete = (id: string) => {
    setPayments(payments.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Payments</h1>
          <p className="text-muted-foreground">View and manage all payment records</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAdd}>
            <Plus size={16} className="mr-2" /> Add Payment
          </Button>
          <Button variant="outline">
            <Download size={16} className="mr-2" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue}</div>
            <p className="text-xs text-muted-foreground">Completed transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTransactions}</div>
            <p className="text-xs text-muted-foreground">Successful payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.pendingAmount}</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by payment ID, order ID, or customer..."
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
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Payment ID</th>
                  <th className="text-left py-3 px-4 font-semibold">Order ID</th>
                  <th className="text-left py-3 px-4 font-semibold">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold">Method</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((payment) => (
                  <tr key={payment.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 font-mono text-xs font-semibold">{payment.id}</td>
                    <td className="py-3 px-4 font-mono text-xs">{payment.orderId}</td>
                    <td className="py-3 px-4">{payment.customer}</td>
                    <td className="py-3 px-4 font-semibold">₹{payment.amount}</td>
                    <td className="py-3 px-4 text-xs">{methodLabels[payment.method]}</td>
                    <td className="py-3 px-4">
                      <Badge className={statusColors[payment.status]}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs">{payment.date}</td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(payment)}>
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(payment.id)}
                        className="text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
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
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                <Button
                  key={i + 1}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
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

      {/* Add/Edit payment dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Payment" : "Add New Payment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Order ID</label>
              <input
                type="text"
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>
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
              <label className="text-sm font-medium">Amount (₹)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number.parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Payment Method</label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value as any })}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
              >
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="upi">UPI</option>
                <option value="wallet">Digital Wallet</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
              >
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
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
