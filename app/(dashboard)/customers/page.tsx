"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, Plus, X, Eye, Loader2, Phone, Mail } from "lucide-react"
import { Customer, formatMobileNumber } from "@/data/customers"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { SearchInput } from "@/components/common/search-input"
import { SelectFilter } from "@/components/common/select-filter"
import { Pagination } from "@/components/common/pagination"
import { CustomerModal } from "@/components/common/customer-modal"
import { StatusBadge } from "@/components/common/status-badge"
import { ConfirmationModal } from "@/components/common/confirmation-modal"
import { useGetCustomersQuery, useCreateCustomerMutation, useUpdateCustomerMutation } from "@/lib/store/api/customersApi"
import { Loader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"

export default function CustomersPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Fetch customers from Firebase
  const { data, isLoading, isError, error, refetch } = useGetCustomersQuery()
  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation()
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation()
  const { toast } = useToast()

  // Extract customers from API response or use empty array
  const customers = data?.customers || []
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    // Personal Information
    avatar: "",
    image: "", // Image stored in "image" key as per requirement
    firstName: "",
    lastName: "",
    age: "",
    mobileNumber: "",
    emailAddress: "",
    password: "", // Password for Firebase Authentication (only used during create)
    // Address Information
    houseNo: "",
    roadName: "",
    nearbyLandmark: "",
    state: "",
    city: "",
    pincode: "",
    addressType: "",
    // Legacy fields for compatibility
    name: "",
    email: "",
    totalOrders: 0,
    status: "active" as "active" | "inactive",
  })

  // Check if any filters are active
  const hasActiveFilters = searchTerm !== "" || statusFilter !== "all"

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
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

      return matchesSearch && matchesStatus
    })
  }, [searchTerm, statusFilter, customers])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  // console.log("🔵 paginatedData", paginatedData)
  const handleAdd = () => {
    setEditingId(null)
    setFormData({
      avatar: "",
      image: "",
      firstName: "",
      lastName: "",
      age: "",
      mobileNumber: "",
      emailAddress: "",
      password: "", // Password for Firebase Authentication
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
      image: customer.avatar || "", // Store image in image key
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
        image: formData.image || formData.avatar || null, // Store in "image" key
        avatar: formData.image || formData.avatar || null, // For backward compatibility
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
        image: "",
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

  const handleDeleteConfirm = () => {
    if (deleteId) {
      // TODO: Implement delete customer API call
      // For now, just refetch
      setDeleteId(null)
      refetch()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Customers</h1>
          <p className="text-muted-foreground">Manage all customers and their booking history</p>
        </div>
        <Button onClick={handleAdd} className="cursor-pointer">
          <Plus size={16} className="mr-2" /> Add Customer
        </Button>
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
              placeholder="Search by name or email..."
            />

            {/* Right Side - Status Filter, Page Size, and Clear Button */}
            <div className="flex items-end gap-2">
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold w-[220px]">Name</th>
                      <th className="text-left py-3 px-4 font-semibold w-[200px]">Email</th>
                      <th className="text-left py-3 px-4 font-semibold w-[140px]">Phone</th>
                      <th className="text-left py-3 px-4 font-semibold w-[120px]">City</th>
                      {/* <th className="text-left py-3 px-4 font-semibold w-[100px]">Orders</th> */}
                      <th className="text-left py-3 px-4 font-semibold w-[120px]">Status</th>
                      <th className="text-left py-3 px-4 font-semibold w-[180px]">Action</th>
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
                        <tr key={customer.id} className="border-b border-border hover:bg-muted/50">
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
                              <span className="font-medium truncate capitalize">{fullName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Mail size={14} className="text-muted-foreground shrink-0" />
                              <span className="truncate">{customer.email}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {customer.mobileNumber ? (
                              <div className="flex items-center gap-2">
                                <Phone size={14} className="text-muted-foreground shrink-0" />
                                <span>{formatMobileNumber(customer.mobileNumber)}</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <span className="text-muted-foreground font-medium">-</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 truncate">{customer.city}</td>
                          {/* <td className="py-3 px-4">{customer.totalOrders}</td> */}
                          <td className="py-3 px-4">
                            <StatusBadge status={customer.status} />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
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
        description="Are you sure you want to delete this customer? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  )
}
