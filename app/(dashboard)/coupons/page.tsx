"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Edit2, Trash2, Plus, Ticket, CheckCircle, Clock, X, Percent } from "lucide-react"
import { InfoCard } from "@/components/common/info-card"
import { SearchInput } from "@/components/common/search-input"
import { SelectFilter } from "@/components/common/select-filter"
import { Pagination } from "@/components/common/pagination"
import { CouponModal } from "@/components/common/coupon-modal"
import { ConfirmationModal } from "@/components/common/confirmation-modal"

interface Coupon {
  id: string
  code: string
  discountType: "percentage" | "fixed"
  discountValue: number
  validFrom: string
  validTo: string
  status: "active" | "inactive"
  usageLimit?: number
  minimumOrderAmount?: number
  usedCount?: number
}

const mockCoupons: Coupon[] = [
  {
    id: "C001",
    code: "SAVE20",
    discountType: "percentage",
    discountValue: 20,
    validFrom: "2024-02-01",
    validTo: "2024-02-29",
    status: "active",
    usageLimit: 100,
    minimumOrderAmount: 500,
    usedCount: 45,
  },
  {
    id: "C002",
    code: "FLAT100",
    discountType: "fixed",
    discountValue: 100,
    validFrom: "2024-02-10",
    validTo: "2024-03-10",
    status: "active",
    usageLimit: 50,
    minimumOrderAmount: 1000,
    usedCount: 12,
  },
  {
    id: "C003",
    code: "WELCOME10",
    discountType: "percentage",
    discountValue: 10,
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
    status: "active",
    usedCount: 234,
  },
  {
    id: "C004",
    code: "FLAT50",
    discountType: "fixed",
    discountValue: 50,
    validFrom: "2024-01-15",
    validTo: "2024-02-15",
    status: "inactive",
    usageLimit: 200,
    usedCount: 180,
  },
  {
    id: "C005",
    code: "SPRING25",
    discountType: "percentage",
    discountValue: 25,
    validFrom: "2024-03-01",
    validTo: "2024-03-31",
    status: "active",
    minimumOrderAmount: 800,
    usedCount: 5,
  },
]

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
}

export default function CouponsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | Coupon["status"]>("all")
  const [discountTypeFilter, setDiscountTypeFilter] = useState<"all" | Coupon["discountType"]>("all")

  // Check if any filters are active
  const hasActiveFilters = searchTerm !== "" || statusFilter !== "all" || discountTypeFilter !== "all"

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setDiscountTypeFilter("all")
    setCurrentPage(1)
  }

  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    code: string
    discountType: "percentage" | "fixed"
    discountValue: number
    validFrom: string
    validTo: string
    status: "active" | "inactive"
    usageLimit?: number
    minimumOrderAmount?: number
  }>({
    code: "",
    discountType: "percentage",
    discountValue: 0,
    validFrom: "",
    validTo: "",
    status: "active",
    usageLimit: undefined,
    minimumOrderAmount: undefined,
  })

  const filtered = useMemo(() => {
    return coupons.filter((coupon) => {
      const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || coupon.status === statusFilter
      const matchesDiscountType = discountTypeFilter === "all" || coupon.discountType === discountTypeFilter
      return matchesSearch && matchesStatus && matchesDiscountType
    })
  }, [searchTerm, statusFilter, discountTypeFilter, coupons])

  const stats = {
    totalCoupons: filtered.length,
    activeCoupons: filtered.filter((c) => c.status === "active").length,
    expiredCoupons: filtered.filter((c) => {
      const today = new Date().toISOString().split("T")[0]
      return c.validTo < today
    }).length,
  }

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // CRUD functions
  const handleAdd = () => {
    setEditingId(null)
    setFormData({
      code: "",
      discountType: "percentage",
      discountValue: 0,
      validFrom: "",
      validTo: "",
      status: "active",
      usageLimit: undefined,
      minimumOrderAmount: undefined,
    })
    setIsOpen(true)
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingId(coupon.id)
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      validFrom: coupon.validFrom,
      validTo: coupon.validTo,
      status: coupon.status,
      usageLimit: coupon.usageLimit,
      minimumOrderAmount: coupon.minimumOrderAmount,
    })
    setIsOpen(true)
  }

  const handleSave = () => {
    if (!formData.code || !formData.validFrom || !formData.validTo || formData.discountValue <= 0) return

    if (editingId) {
      setCoupons(
        coupons.map((c) =>
          c.id === editingId
            ? {
                ...c,
                ...formData,
                id: editingId,
              }
            : c,
        ),
      )
    } else {
      const newCoupon: Coupon = {
        ...formData,
        id: `C${Date.now().toString().slice(-3)}`,
        usedCount: 0,
      }
      setCoupons([...coupons, newCoupon])
    }
    setIsOpen(false)
  }

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
  }

  const handleDeleteConfirm = () => {
    if (deletingId) {
      setCoupons(coupons.filter((c) => c.id !== deletingId))
      setDeletingId(null)
    }
  }

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}%`
    }
    return `₹${coupon.discountValue}`
  }

  const isExpired = (validTo: string) => {
    const today = new Date().toISOString().split("T")[0]
    return validTo < today
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Coupons</h1>
          <p className="text-muted-foreground">Manage discount coupons and promotional codes</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAdd} className="cursor-pointer">
            <Plus size={16} className="mr-2" /> Add Coupon
          </Button>
          <Button variant="outline" className="cursor-pointer">
            <Download size={16} className="mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <InfoCard
          icon={Ticket}
          label="Total Coupons"
          value={stats.totalCoupons.toString()}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-500/10"
        />
        <InfoCard
          icon={CheckCircle}
          label="Active Coupons"
          value={stats.activeCoupons.toString()}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
        />
        <InfoCard
          icon={Clock}
          label="Expired Coupons"
          value={stats.expiredCoupons.toString()}
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
              placeholder="Search by coupon code..."
            />

            {/* Right Side - Filters, Page Size, and Clear Button */}
            <div className="flex items-end gap-2">
              {/* Status Filter */}
              <SelectFilter
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value as "all" | Coupon["status"])
                  setCurrentPage(1)
                }}
                options={[
                  { value: "all", label: "All Status" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                label="Status"
                placeholder="All Status"
              />

              {/* Discount Type Filter */}
              <SelectFilter
                value={discountTypeFilter}
                onChange={(value) => {
                  setDiscountTypeFilter(value as "all" | Coupon["discountType"])
                  setCurrentPage(1)
                }}
                options={[
                  { value: "all", label: "All Types" },
                  { value: "percentage", label: "Percentage" },
                  { value: "fixed", label: "Fixed Amount" },
                ]}
                label="Discount Type"
                placeholder="All Types"
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
                <Button variant="outline" onClick={handleClearFilters} className="gap-2 cursor-pointer">
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
                  <th className="text-left py-3 px-4 font-semibold">Coupon Code</th>
                  <th className="text-left py-3 px-4 font-semibold">Discount</th>
                  <th className="text-left py-3 px-4 font-semibold">Valid From</th>
                  <th className="text-left py-3 px-4 font-semibold">Valid To</th>
                  <th className="text-left py-3 px-4 font-semibold">Usage</th>
                  <th className="text-left py-3 px-4 font-semibold">Min. Order</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold">{coupon.code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {coupon.discountType === "percentage" ? (
                          <Percent size={14} className="text-muted-foreground" />
                        ) : (
                          <span className="text-muted-foreground">₹</span>
                        )}
                        <span className="font-semibold">{formatDiscount(coupon)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">{coupon.validFrom}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-xs">{coupon.validTo}</span>
                        {isExpired(coupon.validTo) && (
                          <span className="text-xs text-destructive">Expired</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {coupon.usedCount || 0}
                      {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {coupon.minimumOrderAmount ? `₹${coupon.minimumOrderAmount}` : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={statusColors[coupon.status]}>
                        {coupon.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(coupon)} className="cursor-pointer">
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(coupon.id)}
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

      {/* Add/Edit Coupon Modal */}
      <CouponModal
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsOpen(false)
            setEditingId(null)
            setFormData({
              code: "",
              discountType: "percentage",
              discountValue: 0,
              validFrom: "",
              validTo: "",
              status: "active",
              usageLimit: undefined,
              minimumOrderAmount: undefined,
            })
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
          setFormData({
            code: "",
            discountType: "percentage",
            discountValue: 0,
            validFrom: "",
            validTo: "",
            status: "active",
            usageLimit: undefined,
            minimumOrderAmount: undefined,
          })
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
        title="Delete Coupon?"
        description="Are you sure you want to delete this coupon? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  )
}

