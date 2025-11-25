"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Edit2, Trash2, Plus, IndianRupee, CheckCircle, Clock, X } from "lucide-react"
import { InfoCard } from "@/components/common/info-card"
import { SearchInput } from "@/components/common/search-input"
import { SelectFilter } from "@/components/common/select-filter"
import { Pagination } from "@/components/common/pagination"
import { PaymentModal } from "@/components/common/payment-modal"
import { ConfirmationModal } from "@/components/common/confirmation-modal"

interface Payment {
  id: string
  orderId: string
  customer: string
  amount: number
  status: "completed" | "pending" | "failed"
  method: "upi" | "debit_card" | "cash"
  date: string
}

const mockPayments: Payment[] = [
  {
    id: "P001",
    orderId: "ORD001",
    customer: "John Smith",
    amount: 150,
    status: "completed",
    method: "upi",
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
    method: "debit_card",
    date: "2024-02-12",
  },
  {
    id: "P005",
    orderId: "ORD005",
    customer: "David Wilson",
    amount: 175,
    status: "failed",
    method: "cash",
    date: "2024-02-11",
  },
  {
    id: "P006",
    orderId: "ORD006",
    customer: "Jessica Miller",
    amount: 450,
    status: "completed",
    method: "cash",
    date: "2024-02-10",
  },
  {
    id: "P007",
    orderId: "ORD007",
    customer: "James Taylor",
    amount: 550,
    status: "completed",
    method: "upi",
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

const statusColors = {
  completed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
}

const methodLabels = {
  upi: "UPI",
  debit_card: "Debit Card",
  cash: "Cash",
}

export default function PaymentsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | Payment["status"]>("all")

  // Check if any filters are active
  const hasActiveFilters = searchTerm !== "" || statusFilter !== "all"

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setCurrentPage(1)
  }
  const [payments, setPayments] = useState<Payment[]>(mockPayments)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    orderId: "",
    customer: "",
    amount: 0,
    status: "pending" as Payment["status"],
    method: "upi" as Payment["method"],
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

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // CRUD functions
  const handleAdd = () => {
    setEditingId(null)
    setFormData({ orderId: "", customer: "", amount: 0, status: "pending", method: "upi" })
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

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
  }

  const handleDeleteConfirm = () => {
    if (deletingId) {
      setPayments(payments.filter((p) => p.id !== deletingId))
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Payments</h1>
          <p className="text-muted-foreground">View and manage all payment records</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAdd} className="cursor-pointer">
            <Plus size={16} className="mr-2" /> Add Payment
          </Button>
          <Button variant="outline" className="cursor-pointer">
            <Download size={16} className="mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <InfoCard
          icon={IndianRupee}
          label="Total Revenue"
          value={`₹${stats.totalRevenue}`}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
        />
        <InfoCard
          icon={CheckCircle}
          label="Completed"
          value={stats.completedTransactions.toString()}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
        />
        <InfoCard
          icon={Clock}
          label="Pending"
          value={`₹${stats.pendingAmount}`}
          iconColor="text-orange-500"
          iconBgColor="bg-orange-500/10"
        />
      </div>

      {/* Custom Filter Section */}
      <Card>
        <CardContent className="px-5">
          <div className="flex items-end justify-between gap-3">
            {/* Left Side - Search Input */}
            <SearchInput
              value={searchTerm}
              onChange={(value) => {
                setSearchTerm(value)
                setCurrentPage(1)
              }}
              placeholder="Search by payment ID, order ID, or customer..."
            />

            {/* Right Side - Status Filter, Page Size, and Clear Button */}
            <div className="flex items-end gap-2">
              {/* Status Filter */}
              <SelectFilter
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value as "all" | Payment["status"])
                  setCurrentPage(1)
                }}
                options={[
                  { value: "all", label: "All Status" },
                  { value: "completed", label: "Completed" },
                  { value: "pending", label: "Pending" },
                  { value: "failed", label: "Failed" },
                ]}
                label="Status"
                placeholder="All Status"
              />

              {/* Page Size */}
              <SelectFilter
                value={pageSize.toString()}
                onChange={(value) => {
                  setPageSize(Number(value))
                  setCurrentPage(1)
                }}
                options={[
                  { value: "5", label: "5" },
                  { value: "10", label: "10" },
                  { value: "20", label: "20" },
                  { value: "50", label: "50" },
                ]}
                label="Page Size"
                width="w-[140px]"
              />

              {/* Clear Filters Button - Only show when filters are active */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="gap-2 cursor-pointer"
                >
                  <X size={16} />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
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
                      <Button variant="outline" size="sm" onClick={() => handleEdit(payment)} className="cursor-pointer">
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(payment.id)}
                        className="text-destructive cursor-pointer shrink-0"
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
          {totalPages > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filtered.length}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Payment Modal */}
      <PaymentModal
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsOpen(false)
            setEditingId(null)
            setFormData({ orderId: "", customer: "", amount: 0, status: "pending", method: "upi" })
          } else {
            setIsOpen(open)
          }
        }}
        formData={formData}
        onFormDataChange={setFormData}
        onSave={handleSave}
        onCancel={() => {
          setIsOpen(false)
          setEditingId(null)
          setFormData({ orderId: "", customer: "", amount: 0, status: "pending", method: "upi" })
        }}
        isEditing={!!editingId}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={!!deletingId}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingId(null)
          }
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Payment?"
        description="Are you sure you want to delete this payment record? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  )
}
