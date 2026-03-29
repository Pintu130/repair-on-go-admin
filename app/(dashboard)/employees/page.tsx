"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, Plus, X, Eye, Loader2, Phone, Mail } from "lucide-react"
import { Employee, formatMobileNumber } from "@/data/employees"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { SearchInput } from "@/components/common/search-input"
import { SelectFilter } from "@/components/common/select-filter"
import { Pagination } from "@/components/common/pagination"
import { EmployeeModal } from "@/components/common/employee-modal"
import { StatusBadge } from "@/components/common/status-badge"
import { ConfirmationModal } from "@/components/common/confirmation-modal"
import { useGetEmployeesQuery, useCreateEmployeeMutation, useUpdateEmployeeMutation, useDeleteEmployeeMutation } from "@/lib/store/api/employeesApi"
import { Loader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"


export default function EmployeesPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")

  // Fetch employees from Firebase
  const { data, isLoading, isError, error, refetch } = useGetEmployeesQuery()
  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation()
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation()
  const [deleteEmployee, { isLoading: isDeleting }] = useDeleteEmployeeMutation()
  const { toast } = useToast()

  // Extract employees from API response or use empty array
  const employees = data?.employees || []
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
    phone: "",
    email: "",
    password: "", 
    address: "",
    aadharNumber: "",
    panCardNumber: "",
    employeeFile: "",
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
    return employees.filter((employee) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter === "all" || employee.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [searchTerm, statusFilter, employees])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleAdd = () => {
    setEditingId(null)
    setFormData({
      avatar: "",
      firstName: "",
      lastName: "",
      age: "",
      phone: "",
      email: "",
      password: "", 
      address: "",
      aadharNumber: "",
      panCardNumber: "",
      employeeFile: "",
      status: "active",
    })
    setIsOpen(true)
  }

  const handleEdit = (employee: Employee) => {
    console.log("Editing employee:", employee)
    setEditingId(employee.id)
    setFormData({
      avatar: employee.avatar || "",
      firstName: employee.firstName || employee.name.split(" ")[0] || "",
      lastName: employee.lastName || employee.name.split(" ").slice(1).join(" ") || "",
      age: employee.age || "",
      phone: employee.phone || employee.mobileNumber || "",
      email: employee.email,
      password: "", // Password not required for edit (email disabled in edit mode)
      address: employee.address || "",
      aadharNumber: employee.aadharNumber || "",
      panCardNumber: employee.panCardNumber || "",
      employeeFile: employee.employeeFile || "", // Ensure empty string if no file
      status: employee.status,
    })
    console.log("Form data after edit:", {
      employeeFile: employee.employeeFile ? "Has file" : "No file"
    })
    setIsOpen(true)
  }

  const handleFormDataChange = (fieldId: string, value: any) => {
    console.log(`Form data change: ${fieldId} =`, value ? (typeof value === 'string' ? value.substring(0, 50) + '...' : value) : 'null/empty')
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSave = async () => {
    // Validation for required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields (First Name, Last Name, Email, Phone)",
        variant: "destructive",
      })
      return
    }

    // Password validation for create mode only
    if (!editingId && !formData.password) {
      toast({
        title: "Validation Error",
        description: "Password is required to create an employee",
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
      console.log("Saving employee with data:", {
        ...formData,
        employeeFile: formData.employeeFile ? "File present (" + formData.employeeFile.length + " chars)" : "No file"
      })
      
      const employeeData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        age: formData.age || null,
        address: formData.address || null,
        aadharNumber: formData.aadharNumber || null,
        panCardNumber: formData.panCardNumber || null,
        employeeFile: formData.employeeFile || null,
        status: formData.status || "active",
        avatar: formData.avatar || null, // For backward compatibility
      }

      // Include password only when creating (not updating)
      if (!editingId && formData.password) {
        employeeData.password = formData.password
      }

      if (editingId) {
        // Update existing employee
        await updateEmployee({
          employeeId: editingId,
          employeeData: employeeData,
        }).unwrap()

        toast({
          title: "Success",
          description: "Employee updated successfully",
        })
      } else {
        // Create new employee
        const result = await createEmployee(employeeData).unwrap()

        toast({
          title: "Success",
          description: `Employee created successfully with ID: ${result.employeeId}`,
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
        phone: "",
        email: "",
        password: "",
        address: "",
        aadharNumber: "",
        panCardNumber: "",
        employeeFile: "",
        status: "active",
      })

      // Refetch employees list
      refetch()
    } catch (error: any) {
      console.error("❌ Error saving employee:", error)
      toast({
        title: "Error",
        description: error?.error || error?.data || "Failed to save employee. Please try again.",
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
      await deleteEmployee(deleteId).unwrap()

      toast({
        title: "Employee Deleted Successfully! ✅",
        description: "Employee has been deleted from Firestore, Firebase Authentication, and Storage.",
      })

      // Close modal and reset
      setIsDeleteOpen(false)
      setDeleteId(null)

      // Refetch employees list
      refetch()
    } catch (error: any) {
      console.error("❌ Error deleting employee:", error)

      const errorMessage =
        error?.data?.error ||
        error?.data?.data ||
        error?.message ||
        "Failed to delete employee. Please try again."

      toast({
        title: "Failed to Delete Employee",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Employees</h1>
          <p className="text-muted-foreground">Manage employee profiles and assignments</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={16} className="mr-2" /> Add Employee
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
                  setStatusFilter(value as "all" | "active" | "inactive")
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
                {(error as any)?.data || (error as any)?.error || "Failed to load employees"}
              </p>
              <Button onClick={() => refetch()} variant="outline" className="cursor-pointer">
                <Loader2 size={16} className="mr-2" />
                Retry
              </Button>
            </div>
          ) : employees.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No employees found</p>
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
                      <th className="text-left py-3 px-4 font-semibold w-[120px]">Status</th>
                      <th className="text-left py-3 px-4 font-semibold w-[180px]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((employee) => {
                      // Get full name from firstName and lastName, or fallback to name
                      const fullName = employee.firstName && employee.lastName
                        ? `${employee.firstName} ${employee.lastName}`
                        : employee.name

                      // Get first letter for avatar fallback
                      const getInitials = () => {
                        if (employee.firstName && employee.lastName) {
                          return `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase()
                        }
                        return employee.name.charAt(0).toUpperCase()
                      }

                      return (
                        <tr key={employee.id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-8 w-8 shrink-0">
                                {employee.avatar && (
                                  <AvatarImage src={employee.avatar} alt={fullName} />
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
                              <span className="truncate">{employee.email}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {employee.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone size={14} className="text-muted-foreground shrink-0" />
                                <span>{formatMobileNumber(employee.phone)}</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <span className="text-muted-foreground font-medium">-</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={employee.status} />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(employee)} className="cursor-pointer shrink-0">
                                <Edit2 size={14} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(employee.id)}
                                className="text-destructive cursor-pointer shrink-0"
                              >
                                <Trash2 size={14} />
                              </Button>
                              <Link href={`/employees/${employee.id}`}>
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

      <EmployeeModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title={editingId ? "Edit Employee" : "Add New Employee"}
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
        title="Delete Employee"
        description="Are you sure you want to delete this employee? This will delete the employee from Firestore, Firebase Authentication, and all associated files from Storage. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  )
}
