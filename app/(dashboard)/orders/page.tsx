"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, X, Eye, CheckCircle, Package, Wrench, Truck, Smartphone, Banknote, CreditCard, Loader2 } from "lucide-react"
import { type Order } from "@/data/orders"
import { SearchInput } from "@/components/common/search-input"
import { SelectFilter } from "@/components/common/select-filter"
import { Pagination } from "@/components/common/pagination"
import { OrderStatusBadge, statusLabels } from "@/components/common/order-status-badge"
import { ConfirmationModal } from "@/components/common/confirmation-modal"
import { InfoCard } from "@/components/common/info-card"
import { DateRangeFilter } from "@/components/common/date-range-filter"
import { useGetBookingsQuery } from "@/lib/store/api/bookingsApi"
import { OrdersTableSkeleton } from "@/components/common/orders-table-skeleton"

interface OrderItem extends Order {}

export default function OrdersPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | Order["status"]>("all")
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Fetch bookings from Firebase
  const { data: bookingsData, isLoading, error, refetch } = useGetBookingsQuery()
  
  const orders: OrderItem[] = bookingsData?.bookings || []
  console.log("🚀 ~ OrdersPage ~ orders:111", orders)

  const categories = ["all", ...new Set(orders.map((o) => o.category))]
  const statuses = ["all", "booked", "confirmed", "picked", "serviceCenter", "repair", "outForDelivery", "delivered"] as const

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm !== "" ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    dateRange?.from !== undefined

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setCategoryFilter("all")
    setDateRange(undefined)
    setCurrentPage(1)
  }

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || order.status === statusFilter
      const matchesCategory = categoryFilter === "all" || order.category === categoryFilter
      
      // Date range filter
      let matchesDateRange = true
      if (dateRange?.from) {
        const orderDate = new Date(order.date)
        const fromDate = dateRange.from
        const toDate = dateRange.to || dateRange.from
        
        // Set time to start of day for comparison
        fromDate.setHours(0, 0, 0, 0)
        toDate.setHours(23, 59, 59, 999)
        orderDate.setHours(0, 0, 0, 0)
        
        matchesDateRange = orderDate >= fromDate && orderDate <= toDate
      }
      
      return matchesSearch && matchesStatus && matchesCategory && matchesDateRange
    })
  }, [searchTerm, statusFilter, categoryFilter, dateRange, orders])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Calculate stats
  const totalVerify = orders.filter((o) => o.status === "booked").length
  const totalPickup = orders.filter((o) => o.status === "picked").length
  const totalRepair = orders.filter((o) => o.status === "repair").length
  const totalOutForDelivery = orders.filter((o) => o.status === "outForDelivery").length

  const handleDeleteClick = (id: string) => {
    setDeleteId(id)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (deleteId) {
      // TODO: Implement delete booking API call
      // For now, just close the modal
      setDeleteId(null)
      // Optionally refetch data after delete
      // refetch()
    }
  }

  // Show loading state with skeleton
  if (isLoading) {
    return <OrdersTableSkeleton />
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <p className="text-destructive">Error loading orders</p>
          <Button onClick={() => refetch()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Orders</h1>
          <p className="text-muted-foreground">Track and manage all repair orders</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <InfoCard
          icon={CheckCircle}
          label="Total Verify"
          value={totalVerify.toString()}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
        />
        <InfoCard
          icon={Package}
          label="Total Pickup"
          value={totalPickup.toString()}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-500/10"
        />
        <InfoCard
          icon={Wrench}
          label="Total Repair"
          value={totalRepair.toString()}
          iconColor="text-yellow-500"
          iconBgColor="bg-yellow-500/10"
        />
        <InfoCard
          icon={Truck}
          label="Out for Delivery"
          value={totalOutForDelivery.toString()}
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
              placeholder="Search by order ID or customer..."
            />

            {/* Right Side - Date Range Filter, Status Filter, Category Filter, Page Size, and Clear Button */}
            <div className="flex items-end gap-2">
              {/* Date Range Filter */}
              <DateRangeFilter
                value={dateRange}
                onChange={(range) => {
                  setDateRange(range)
                  setCurrentPage(1)
                }}
                onClear={() => {
                  setDateRange(undefined)
                  setCurrentPage(1)
                }}
                placeholder="Select date range"
              />

              {/* Status Filter */}
              <SelectFilter
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value as any)
                  setCurrentPage(1)
                }}
                options={statuses.map((s) => ({
                  value: s,
                  label: s === "all" ? "All Status" : statusLabels[s as Order["status"]],
                }))}
                label="Status"
                placeholder="All Status"
              />

              {/* Category Filter */}
              <SelectFilter
                value={categoryFilter}
                onChange={(value) => {
                  setCategoryFilter(value)
                  setCurrentPage(1)
                }}
                options={categories.map((c) => ({
                  value: c,
                  label: c === "all" ? "All Categories" : c,
                }))}
                label="Category"
                placeholder="All Categories"
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
                  <th className="text-left py-3 px-4 font-semibold">Order ID</th>
                  <th className="text-left py-3 px-4 font-semibold">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold">Mobile Number</th>
                  <th className="text-left py-3 px-4 font-semibold">Category</th>
                  <th className="text-left py-3 px-4 font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold">Payment Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Payment Method</th>
                  <th className="text-left py-3 px-4 font-semibold">Order Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Order Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-muted-foreground">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 font-mono text-xs font-semibold">{order.bookingId}</td>
                    <td className="py-3 px-4">{order.customer}</td>
                    <td className="py-3 px-4">{order.mobileNumber || "N/A"}</td>
                    <td className="py-3 px-4">{order.category}</td>
                    <td className="py-3 px-4 font-semibold">₹{order.amount}</td>
                    <td className="py-3 px-4">
                      <Badge
                        className={
                          order.paymentStatus === "paid"
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : order.paymentStatus === "pending"
                            ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                            : order.paymentStatus === "cash"
                            ? "bg-blue-500 hover:bg-blue-600 text-white"
                            : "bg-gray-500 hover:bg-gray-600 text-white"
                        }
                      >
                        {order.paymentStatus
                          ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)
                          : "Pending"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {order.paymentMethod === "UPI" && <Smartphone size={16} className="text-blue-500" />}
                        {order.paymentMethod === "Cash" && <Banknote size={16} className="text-green-500" />}
                        {order.paymentMethod === "Card" && <CreditCard size={16} className="text-purple-500" />}
                        <span>{order.paymentMethod || "N/A"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {order.date
                        ? new Date(order.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "N/A"}
                    </td>
                    <td className="py-3 px-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(order.id)}
                        className="text-destructive cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </Button>
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="cursor-pointer shrink-0">
                          <Eye size={14}/>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      <ConfirmationModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Order"
        description="Are you sure you want to delete this order? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  )
}
