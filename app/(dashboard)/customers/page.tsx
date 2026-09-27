"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, Plus, X, Eye, Loader2, Mail, MapPin, Download } from "lucide-react"
import { Customer, formatMobileNumber } from "@/data/customers"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { SearchInput } from "@/components/common/search-input"
import { SelectFilter } from "@/components/common/select-filter"
import { DateRangeFilter } from "@/components/common/date-range-filter"
import { Pagination } from "@/components/common/pagination"
import { CustomerModal } from "@/components/common/customer-modal"
import { SendEmailModal } from "@/components/common/send-email-modal"
import { StatusBadge } from "@/components/common/status-badge"
import { ConfirmationModal } from "@/components/common/confirmation-modal"
import { PhoneActions } from "@/components/common/phone-actions"
import { useGetCustomersQuery, useCreateCustomerMutation, useUpdateCustomerMutation, useDeleteCustomerMutation } from "@/lib/store/api/customersApi"
import { useGetBookingsQuery } from "@/lib/store/api/bookingsApi"
import { useGetReviewsQuery } from "@/lib/store/api/reviewsApi"
import { Loader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import { startOfDay, endOfDay } from "date-fns"
import * as XLSX from "xlsx"

export default function CustomersPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined)

  // Fetch customers from Firebase
  const { data, isLoading, isError, error, refetch } = useGetCustomersQuery()
  const { data: bookingsData } = useGetBookingsQuery()
  const { data: reviewsData } = useGetReviewsQuery()
  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation()
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation()
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation()
  const { toast } = useToast()

  // Extract customers from API response or use empty array
  const customers = data?.customers || []
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isEmailOpen, setIsEmailOpen] = useState(false)
  const [emailRecipientIds, setEmailRecipientIds] = useState<string[]>([])
  const [formData, setFormData] = useState({
    // Personal Information
    avatar: "",
    firstName: "",
    lastName: "",
    age: "",
    mobileNumber: "",
    emailAddress: "",
    password: "", 
    houseNo: "",
    roadName: "",
    nearbyLandmark: "",
    state: "",
    city: "",
    pincode: "",
    addressType: "",
    name: "",
    email: "",
    totalOrders: 0,
    status: "active" as "active" | "inactive",
  })

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm !== "" || statusFilter !== "all" || dateRange?.from !== undefined

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setDateRange(undefined)
    setCurrentPage(1)
  }

  const filtered = useMemo(() => {
    return customers.filter((customer) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter === "all" || customer.status === statusFilter

      // Date range filter (on customer created/join date)
      let matchesDateRange = true
      if (dateRange?.from) {
        if (!customer.joinDate) {
          matchesDateRange = false
        } else {
          const joinDate = startOfDay(new Date(customer.joinDate))
          const fromDate = startOfDay(dateRange.from)
          const toDate = endOfDay(dateRange.to ?? dateRange.from)

          matchesDateRange = joinDate >= fromDate && joinDate <= toDate
        }
      }

      return matchesSearch && matchesStatus && matchesDateRange
    })
  }, [searchTerm, statusFilter, dateRange, customers])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Row selection (for bulk actions such as Send Email)
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const allOnPageSelected =
    paginatedData.length > 0 && paginatedData.every((customer) => selectedIdSet.has(customer.id))
  const someOnPageSelected =
    !allOnPageSelected && paginatedData.some((customer) => selectedIdSet.has(customer.id))

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      const pageIds = new Set(paginatedData.map((customer) => customer.id))
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)))
      return
    }
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const customer of paginatedData) next.add(customer.id)
      return Array.from(next)
    })
  }

  const toggleSelectOne = (customerId: string) => {
    setSelectedIds((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    )
  }

  const clearSelection = () => setSelectedIds([])

  // Resolve selected ids -> { id, name, email } for the compose modal.
  // Ids that no longer exist in the loaded customers are ignored.
  const emailRecipients = useMemo(() => {
    const byId = new Map(customers.map((customer) => [customer.id, customer]))
    return emailRecipientIds
      .map((id) => byId.get(id))
      .filter((customer): customer is Customer => Boolean(customer))
      .map((customer) => ({
        id: customer.id,
        name:
          (customer.firstName && customer.lastName
            ? `${customer.firstName} ${customer.lastName}`
            : customer.name) || "Customer",
        email: customer.email || "",
      }))
  }, [customers, emailRecipientIds])

  const openEmailForSelection = () => {
    setEmailRecipientIds(selectedIds)
    setIsEmailOpen(true)
  }

  const openEmailForCustomer = (customer: Customer) => {
    setEmailRecipientIds([customer.id])
    setIsEmailOpen(true)
  }

  const allBookings = useMemo(() => bookingsData?.bookings || [], [bookingsData])
  const allReviews = useMemo(() => reviewsData?.reviews || [], [reviewsData])

  // Per-customer statistics (same calculations used on the customer details page)
  const customerStats = useMemo(() => {
    const stats: Record<
      string,
      {
        totalOrders: number
        completedOrders: number
        cancelledOrders: number
        orderPerformance: number
        totalEarned: number
        pendingOrders: number
        pendingAmount: number
        lastOrderDate: string
        averageRating: string
        totalReviews: number
      }
    > = {}

    customers.forEach((customer) => {
      const bookings = allBookings.filter(
        (booking) => booking.customerId === customer.id || booking.customerUid === customer.uid
      )

      const completedBookings = bookings.filter((booking) => booking.status === "delivered")
      const cancelledBookings = bookings.filter((booking) => booking.status === "cancelled")
      const pendingBookings = bookings.filter(
        (booking) =>
          booking.status === "booked" ||
          booking.status === "confirmed" ||
          booking.status === "picked"
      )

      const totalEarned = completedBookings.reduce(
        (sum, booking) => sum + parseFloat(booking.amount?.toString() || "0"),
        0
      )
      const pendingAmount = pendingBookings.reduce(
        (sum, booking) => sum + parseFloat(booking.amount?.toString() || "0"),
        0
      )

      const latestBooking = bookings.length
        ? [...bookings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        : null

      const reviews = allReviews.filter((review) => review.customerUid === customer.uid)
      const averageRating =
        reviews.length > 0
          ? (reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length).toFixed(1)
          : "0.0"

      stats[customer.id] = {
        totalOrders: bookings.length,
        completedOrders: completedBookings.length,
        cancelledOrders: cancelledBookings.length,
        orderPerformance:
          bookings.length > 0
            ? Math.round((completedBookings.length / bookings.length) * 100)
            : 0,
        totalEarned,
        pendingOrders: pendingBookings.length,
        pendingAmount,
        lastOrderDate: latestBooking?.date || "",
        averageRating,
        totalReviews: reviews.length,
      }
    })

    return stats
  }, [customers, allBookings, allReviews])

  const formatDateTime = (dateValue?: string) => {
    if (!dateValue) return "N/A"
    try {
      return new Date(dateValue).toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      })
    } catch {
      return dateValue
    }
  }

  // Export currently filtered customers to Excel (admin/employee accounts excluded)
  const handleExport = () => {
    const exportRows = filtered.filter((customer) => {
      const role = (customer.role || "").toLowerCase()
      return !role || role === "customer"
    })

    if (exportRows.length === 0) {
      toast({
        title: "No Data",
        description: "No customers to export",
        variant: "destructive",
      })
      return
    }

    const exportData = exportRows.map((customer, index) => {
      const fullName =
        customer.firstName && customer.lastName
          ? `${customer.firstName} ${customer.lastName}`
          : customer.name

      const hasLocation =
        customer.location?.latitude != null && customer.location?.longitude != null

      const stats = customerStats[customer.id] || {
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        orderPerformance: 0,
        totalEarned: 0,
        pendingOrders: 0,
        pendingAmount: 0,
        lastOrderDate: "",
        averageRating: "0.0",
        totalReviews: 0,
      }

      const fullAddress = [
        customer.houseNo,
        customer.roadName,
        customer.nearbyLandmark,
        customer.city,
        customer.state,
        customer.pincode,
      ]
        .filter(Boolean)
        .join(", ")

      return {
        "S.No": index + 1,
        "Customer ID": customer.id || "-",
        "User UID": customer.uid || "-",
        "Name": fullName || "-",
        "First Name": customer.firstName || "-",
        "Last Name": customer.lastName || "-",
        Email: customer.email || "-",
        Phone: customer.phone || "-",
        Mobile: formatMobileNumber(customer.mobileNumber) || customer.mobileNumber || "-",
        Age: customer.age || "-",
        "Address Type": customer.addressType || "-",
        "House No": customer.houseNo || "-",
        "Road Name": customer.roadName || "-",
        "Nearby Landmark": customer.nearbyLandmark || "-",
        City: customer.city || "-",
        State: customer.state || "-",
        Pincode: customer.pincode || "-",
        "Full Address": fullAddress || "-",
        Latitude: hasLocation ? customer.location?.latitude : "-",
        Longitude: hasLocation ? customer.location?.longitude : "-",
        "Location Link": hasLocation
          ? `https://www.google.com/maps?q=${customer.location?.latitude},${customer.location?.longitude}`
          : "-",
        "Location Updated At": customer.location?.updatedAt || "-",
        "Total Orders (Profile)": customer.totalOrders ?? 0,
        Status: customer.status || "-",
        Role: customer.role || "-",
        "Avatar URL": customer.avatar || "-",
        "Created Date": customer.joinDate
          ? new Date(customer.joinDate).toLocaleString("en-IN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "-",
        "Created Date (Raw)": customer.joinDate || "-",
        "Join Date (IST)": formatDateTime(customer.joinDate),

        // Statistics (same as customer details page)
        "Total Orders": stats.totalOrders,
        "Completed Orders": stats.completedOrders,
        "Cancelled Orders": stats.cancelledOrders,
        "Order Performance (%)": stats.orderPerformance,
        "Total Spent": stats.totalEarned,
        "Pending Orders": stats.pendingOrders,
        "Pending Amount": stats.pendingAmount,
        "Last Order": formatDateTime(stats.lastOrderDate),
        "Average Rating": stats.averageRating,
        "Total Reviews": stats.totalReviews,
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(exportData)

    worksheet["!cols"] = [
      { wch: 6 },  // S.No
      { wch: 24 }, // Customer ID
      { wch: 24 }, // User UID
      { wch: 25 }, // Name
      { wch: 14 }, // First Name
      { wch: 14 }, // Last Name
      { wch: 30 }, // Email
      { wch: 18 }, // Phone
      { wch: 18 }, // Mobile
      { wch: 8 },  // Age
      { wch: 14 }, // Address Type
      { wch: 12 }, // House No
      { wch: 22 }, // Road Name
      { wch: 22 }, // Nearby Landmark
      { wch: 14 }, // City
      { wch: 14 }, // State
      { wch: 10 }, // Pincode
      { wch: 40 }, // Full Address
      { wch: 14 }, // Latitude
      { wch: 14 }, // Longitude
      { wch: 45 }, // Location Link
      { wch: 22 }, // Location Updated At
      { wch: 13 }, // Total Orders
      { wch: 10 }, // Status
      { wch: 12 }, // Role
      { wch: 40 }, // Avatar URL
      { wch: 20 }, // Created Date
      { wch: 24 }, // Created Date (Raw)
      { wch: 20 }, // Join Date (IST)
      { wch: 13 }, // Total Orders
      { wch: 16 }, // Completed Orders
      { wch: 16 }, // Cancelled Orders
      { wch: 20 }, // Order Performance (%)
      { wch: 13 }, // Total Spent
      { wch: 15 }, // Pending Orders
      { wch: 15 }, // Pending Amount
      { wch: 20 }, // Last Order
      { wch: 15 }, // Average Rating
      { wch: 14 }, // Total Reviews
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers")

    const dateStr = new Date().toISOString().split("T")[0]
    const filename = `customers_${dateStr}.xlsx`

    XLSX.writeFile(workbook, filename)

    toast({
      title: "Export Successful",
      description: `Exported ${exportRows.length} customers to ${filename}`,
    })
  }

  const handleAdd = () => {
    setEditingId(null)
    setFormData({
      avatar: "",
      firstName: "",
      lastName: "",
      age: "",
      mobileNumber: "",
      emailAddress: "",
      password: "", 
      houseNo: "",
      roadName: "",
      nearbyLandmark: "",
      state: "",
      city: "",
      pincode: "",
      addressType: "",
      name: "",
      email: "",
      totalOrders: 0,
      status: "active",
    })
    setIsOpen(true)
  }

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id)
    setFormData({
      avatar: customer.avatar || "",
      firstName: customer.firstName || customer.name.split(" ")[0] || "",
      lastName: customer.lastName || customer.name.split(" ").slice(1).join(" ") || "",
      age: customer.age || "",
      mobileNumber: customer.mobileNumber || "",
      emailAddress: customer.email || "",
      password: "", // Password not required for edit (email disabled in edit mode)
      houseNo: customer.houseNo || "",
      roadName: customer.roadName || "",
      nearbyLandmark: customer.nearbyLandmark || "",
      state: customer.state || "",
      city: customer.city || "",
      pincode: customer.pincode || "",
      addressType: customer.addressType || "",
      name: customer.name,
      email: customer.email,
      totalOrders: customer.totalOrders,
      status: customer.status,
    })
    setIsOpen(true)
  }

  const handleFormDataChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSave = async () => {
    // Validation for required fields
    if (!formData.firstName || !formData.lastName || !formData.emailAddress || !formData.mobileNumber) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields (First Name, Last Name, Email, Mobile Number)",
        variant: "destructive",
      })
      return
    }

    // Password validation for create mode only
    if (!editingId && !formData.password) {
      toast({
        title: "Validation Error",
        description: "Password is required to create a customer",
        variant: "destructive",
      })
      return
    }

    // Password length validation for create mode
    if (!editingId && formData.password && formData.password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    try {
      const customerData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        emailAddress: formData.emailAddress,
        email: formData.emailAddress, // For compatibility
        mobileNumber: formData.mobileNumber,
        age: formData.age || null,
        city: formData.city || null,
        state: formData.state || null,
        pincode: formData.pincode || null,
        houseNo: formData.houseNo || null,
        roadName: formData.roadName || null,
        nearbyLandmark: formData.nearbyLandmark || null,
        addressType: formData.addressType || null,
        status: formData.status || "active",
        avatar: formData.avatar || null, // For backward compatibility
      }

      // Include password only when creating (not updating)
      if (!editingId && formData.password) {
        customerData.password = formData.password
      }

      if (editingId) {
        // Update existing customer
        await updateCustomer({
          customerId: editingId,
          customerData: customerData,
        }).unwrap()

        toast({
          title: "Success",
          description: "Customer updated successfully",
        })
      } else {
        // Create new customer
        const result = await createCustomer(customerData).unwrap()

        toast({
          title: "Success",
          description: `Customer created successfully with ID: ${result.customerId}`,
        })
      }

      // Close modal and reset form
      setIsOpen(false)
      setEditingId(null)
      setFormData({
        avatar: "",
        firstName: "",
        lastName: "",
        age: "",
        mobileNumber: "",
        emailAddress: "",
        password: "",
        houseNo: "",
        roadName: "",
        nearbyLandmark: "",
        state: "",
        city: "",
        pincode: "",
        addressType: "",
        name: "",
        email: "",
        totalOrders: 0,
        status: "active",
      })

      // Refetch customers list
      refetch()
    } catch (error: any) {
      console.error("❌ Error saving customer:", error)
      toast({
        title: "Error",
        description: error?.error || error?.data || "Failed to save customer. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (id: string) => {
    setDeleteId(id)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return

    try {
      await deleteCustomer(deleteId).unwrap()

      toast({
        title: "Customer Deleted Successfully! ✅",
        description: "Customer has been deleted from Firestore, Firebase Authentication, and Storage.",
      })

      // Close modal and reset
      setIsDeleteOpen(false)
      setDeleteId(null)
      setSelectedIds((prev) => prev.filter((id) => id !== deleteId))

      // Refetch customers list
      refetch()
    } catch (error: any) {
      console.error("❌ Error deleting customer:", error)

      const errorMessage =
        error?.data?.error ||
        error?.data?.data ||
        error?.message ||
        "Failed to delete customer. Please try again."

      toast({
        title: "Failed to Delete Customer",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Customers</h1>
          <p className="text-muted-foreground">Manage all customers and their booking history</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* <Button onClick={handleAdd} className="cursor-pointer">
            <Plus size={16} className="mr-2" /> Add Customer
          </Button> */}
          <Button variant="outline" className="cursor-pointer" onClick={handleExport}>
            <Download size={16} className="mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Bulk Action Bar - visible only when rows are selected */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <p className="text-sm font-medium">
            {selectedIds.length} customer{selectedIds.length === 1 ? "" : "s"} selected
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={openEmailForSelection}
              className="cursor-pointer"
            >
              <Mail size={16} className="mr-2" /> Send Email
            </Button>
            <Button
              variant="outline"
              onClick={clearSelection}
              className="cursor-pointer"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Custom Filter Section */}
      <Card>
        <CardContent className="px-5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input - fills all remaining width */}
            <SearchInput
              value={searchTerm}
              onChange={(value) => {
                setSearchTerm(value)
                setCurrentPage(1)
              }}
              placeholder="Search by name or email..."
              hideLabel
            />

            {/* Date Range Filter, Status Filter, Page Size, and Clear Button */}
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-none">
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
                placeholder="Filter by date"
                className="w-full sm:w-[200px]"
              />

              {/* Status Filter */}
              <SelectFilter
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value)
                  setCurrentPage(1)
                }}
                options={[
                  { value: "all", label: "All Status" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                label="Status"
                placeholder="All Status"
                width="w-full min-w-[110px] flex-1 sm:w-[110px] sm:flex-none"
                hideLabel
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
                width="w-full min-w-[90px] flex-1 sm:w-[90px] sm:flex-none"
                hideLabel
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size="md" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <p className="text-destructive font-medium">
                {(error as any)?.data || (error as any)?.error || "Failed to load customers"}
              </p>
              <Button onClick={() => refetch()} variant="outline" className="cursor-pointer">
                <Loader2 size={16} className="mr-2" />
                Retry
              </Button>
            </div>
          ) : customers.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No customers found</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="w-full text-sm !min-w-[1000px]">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold whitespace-nowrap w-10">
                        <Checkbox
                          checked={allOnPageSelected ? true : someOnPageSelected ? "indeterminate" : false}
                          onCheckedChange={toggleSelectAll}
                          disabled={paginatedData.length === 0}
                          aria-label="Select all customers on this page"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-semibold whitespace-nowrap">User</th>
                      <th className="text-left py-3 px-4 font-semibold whitespace-nowrap">Phone</th>
                      <th className="text-left py-3 px-4 font-semibold whitespace-nowrap">City</th>
                      <th className="text-left py-3 px-4 font-semibold whitespace-nowrap">Created Date</th>
                      {/* <th className="text-left py-3 px-4 font-semibold whitespace-nowrap">Orders</th> */}
                      <th className="text-left py-3 px-4 font-semibold whitespace-nowrap">Status</th>
                      <th className="text-left py-3 px-4 font-semibold whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((customer) => {
                      // Get full name from firstName and lastName, or fallback to name
                      const fullName = customer.firstName && customer.lastName
                        ? `${customer.firstName} ${customer.lastName}`
                        : customer.name

                      // Get first letter for avatar fallback
                      const getInitials = () => {
                        if (customer.firstName && customer.lastName) {
                          return `${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`.toUpperCase()
                        }
                        return customer.name.charAt(0).toUpperCase()
                      }

                      return (
                        <tr
                          key={customer.id}
                          className={
                            selectedIdSet.has(customer.id)
                              ? "border-b border-border bg-primary/5"
                              : "border-b border-border hover:bg-muted/50"
                          }
                        >
                          <td className="py-3 px-4">
                            <Checkbox
                              checked={selectedIdSet.has(customer.id)}
                              onCheckedChange={() => toggleSelectOne(customer.id)}
                              aria-label={`Select ${fullName}`}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-8 w-8 shrink-0">
                                {customer.avatar && (
                                  <AvatarImage src={customer.avatar} alt={fullName} />
                                )}
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                  {getInitials()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex flex-col">
                                <span className="font-medium truncate capitalize whitespace-nowrap">{fullName}</span>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {customer.email ? (
                                    <>
                                      <span className="text-xs text-muted-foreground truncate whitespace-nowrap">
                                        {customer.email}
                                      </span>
                                      <a
                                        href={`mailto:${customer.email}`}
                                        onClick={(e) => e.stopPropagation()}
                                        title="Send email"
                                        aria-label="Send email"
                                        className="inline-flex items-center justify-center rounded p-0.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors shrink-0"
                                      >
                                        <Mail size={14} />
                                      </a>
                                    </>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">-</span>
                                  )}
                                  {customer.location?.latitude != null && customer.location?.longitude != null && (
                                    <a
                                      href={`https://www.google.com/maps?q=${customer.location.latitude},${customer.location.longitude}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      title={`View location: ${customer.location.latitude}, ${customer.location.longitude}`}
                                      aria-label={`View location: ${customer.location.latitude}, ${customer.location.longitude}`}
                                      className="inline-flex items-center justify-center rounded p-0.5 text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors shrink-0"
                                    >
                                      <MapPin size={14} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {customer.mobileNumber ? (
                              <PhoneActions
                                mobile={formatMobileNumber(customer.mobileNumber) || customer.mobileNumber}
                              />
                            ) : (
                              <div className="flex items-center justify-center">
                                <span className="text-muted-foreground font-medium">-</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">{customer.city}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {customer.joinDate ? (
                              new Date(customer.joinDate).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          {/* <td className="py-3 px-4">{customer.totalOrders}</td> */}
                          <td className="py-3 px-4">
                            <StatusBadge status={customer.status} />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEmailForCustomer(customer)}
                                disabled={!customer.email}
                                title={
                                  customer.email
                                    ? `Send email to ${customer.email}`
                                    : "This customer has no email address"
                                }
                                aria-label={`Send email to ${fullName}`}
                                className="cursor-pointer shrink-0"
                              >
                                <Mail size={14} />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEdit(customer)} className="cursor-pointer shrink-0">
                                <Edit2 size={14} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(customer.id)}
                                className="text-destructive cursor-pointer shrink-0"
                              >
                                <Trash2 size={14} />
                              </Button>
                              <Link href={`/customers/${customer.id}`}>
                                <Button variant="outline" size="sm" className="cursor-pointer shrink-0">
                                  <Eye size={14} />
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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
            </>
          )}
        </CardContent>
      </Card>

      <CustomerModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title={editingId ? "Edit Customer" : "Add New Customer"}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        onSave={handleSave}
        saveLabel={editingId ? "Update" : "Create"}
        isLoading={isCreating || isUpdating}
        isEditing={!!editingId}
      />

      <ConfirmationModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This will delete the customer from Firestore, Firebase Authentication, and all associated files from Storage. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />

      <SendEmailModal
        open={isEmailOpen}
        onOpenChange={setIsEmailOpen}
        recipients={emailRecipients}
        onSent={clearSelection}
      />
    </div>
  )
}
