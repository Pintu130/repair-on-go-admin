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
import { useGetCouponsQuery, useCreateCouponMutation, useUpdateCouponMutation, useDeleteCouponMutation, type Coupon } from "@/lib/store/api/couponsApi"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-red-100 text-red-800",
}

export default function CouponsPage() {
  // Fetch coupons from Firebase
  const { data, isLoading, isError, error, refetch } = useGetCouponsQuery()
  const [createCoupon, { isLoading: isCreating }] = useCreateCouponMutation()
  const [updateCoupon, { isLoading: isUpdating }] = useUpdateCouponMutation()
  const [deleteCoupon, { isLoading: isDeleting }] = useDeleteCouponMutation()
  const { toast } = useToast()

  // Extract coupons from API response or use empty array
  const coupons = data?.coupons || []

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

  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    return {
      totalCoupons: coupons.length, // Total coupons (all, not filtered)
      activeCoupons: coupons.filter((c) => c.status === "active").length, // Active from all coupons
      expiredCoupons: coupons.filter((c) => {
        return c.validTo < today
      }).length, // Expired from all coupons
    }
  }, [coupons])

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

  const handleSave = async () => {
    if (!formData.code || !formData.validFrom || !formData.validTo || formData.discountValue <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields correctly.",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingId) {
        await updateCoupon({
          couponId: editingId,
          couponData: formData,
        }).unwrap()

        toast({
          title: "Coupon Updated Successfully! ✅",
          description: `${formData.code} has been updated successfully.`,
        })
      } else {
        await createCoupon(formData).unwrap()

        toast({
          title: "Coupon Created Successfully! 🎉",
          description: `Coupon ${formData.code} has been created successfully.`,
        })
      }

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
      refetch()
    } catch (error: any) {
      console.error("❌ Error saving coupon:", error)

      const errorMessage =
        error?.data?.error ||
        error?.data?.data ||
        error?.message ||
        "Failed to save coupon. Please try again."

      toast({
        title: editingId ? "Failed to Update Coupon" : "Failed to Create Coupon",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingId) return

    try {
      await deleteCoupon(deletingId).unwrap()

      toast({
        title: "Coupon Deleted Successfully! ✅",
        description: "Coupon has been deleted successfully.",
      })

      setDeletingId(null)
      refetch()
    } catch (error: any) {
      console.error("❌ Error deleting coupon:", error)

      const errorMessage =
        error?.data?.error ||
        error?.data?.data ||
        error?.message ||
        "Failed to delete coupon. Please try again."

      toast({
        title: "Failed to Delete Coupon",
        description: errorMessage,
        variant: "destructive",
      })
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-destructive">Error loading coupons. Please try again.</p>
            </div>
          ) : (
            <>
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
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-muted-foreground">
                          No coupons found
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((coupon) => (
                        <tr key={coupon.id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="font-mono font-semibold">{coupon.code}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              {/* {coupon.discountType === "percentage" ? (
                                <Percent size={14} className="text-muted-foreground" />
                              ) : (
                                <span className="text-muted-foreground">₹</span>
                              )} */}
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
                      ))
                    )}
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
            </>
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
        isLoading={isDeleting}
      />
    </div>
  )
}

