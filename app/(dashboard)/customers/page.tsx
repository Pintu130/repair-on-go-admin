"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, Plus, X, Eye } from "lucide-react"
import { mockCustomers, Customer } from "@/data/customers"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { SearchInput } from "@/components/common/search-input"
import { SelectFilter } from "@/components/common/select-filter"
import { Pagination } from "@/components/common/pagination"
import { CustomerModal } from "@/components/common/customer-modal"
import { StatusBadge } from "@/components/common/status-badge"
import { ConfirmationModal } from "@/components/common/confirmation-modal"

export default function CustomersPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    // Personal Information
    avatar: "",
    firstName: "",
    lastName: "",
    age: "",
    mobileNumber: "",
    emailAddress: "",
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
    phone: "",
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

  const handleAdd = () => {
    setEditingId(null)
    setFormData({
      avatar: "",
      firstName: "",
      lastName: "",
      age: "",
      mobileNumber: "",
      emailAddress: "",
      houseNo: "",
      roadName: "",
      nearbyLandmark: "",
      state: "",
      city: "",
      pincode: "",
      addressType: "",
      name: "",
      email: "",
      phone: "",
      totalOrders: 0,
      status: "active",
    })
    setIsOpen(true)
  }

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id)
    // For now, we'll split the name into first and last name
    const nameParts = customer.name.split(" ")
    setFormData({
      avatar: "",
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      age: "",
      mobileNumber: customer.phone || "",
      emailAddress: customer.email || "",
      houseNo: "",
      roadName: "",
      nearbyLandmark: "",
      state: "",
      city: customer.city || "",
      pincode: "",
      addressType: "",
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      totalOrders: customer.totalOrders,
      status: customer.status,
    })
    setIsOpen(true)
  }

  const handleFormDataChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSave = () => {
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.emailAddress || !formData.mobileNumber) {
      return
    }

    // Combine first and last name for legacy name field
    const fullName = `${formData.firstName} ${formData.lastName}`.trim()

    if (editingId) {
      setCustomers(
        customers.map((c) =>
          c.id === editingId
            ? {
                ...c,
                name: fullName,
                email: formData.emailAddress,
                phone: formData.mobileNumber,
                city: formData.city,
              }
            : c
        )
      )
    } else {
      const newCustomer: Customer = {
        id: Date.now().toString(),
        name: fullName,
        email: formData.emailAddress,
        phone: formData.mobileNumber,
        city: formData.city,
        totalOrders: 0,
        status: "active",
        joinDate: new Date().toISOString().split("T")[0],
      }
      setCustomers([...customers, newCustomer])
    }
    setIsOpen(false)
  }

  const handleDeleteClick = (id: string) => {
    setDeleteId(id)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (deleteId) {
      setCustomers(customers.filter((c) => c.id !== deleteId))
      setDeleteId(null)
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
                        <span className="font-medium truncate">{fullName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 truncate">{customer.email}</td>
                    <td className="py-3 px-4">{customer.phone}</td>
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
                            <Eye size={14}/>
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
