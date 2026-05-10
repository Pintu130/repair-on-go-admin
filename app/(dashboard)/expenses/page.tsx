"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, Plus, Download, File, X, Loader2 } from "lucide-react"
import * as XLSX from "xlsx"
import { Expense, PAYMENT_METHODS, formatCurrency } from "@/data/expenses"
import { ExpenseModal } from "@/components/common/expense-modal"
import { ConfirmationModal } from "@/components/common/confirmation-modal"
import { useToast } from "@/hooks/use-toast"
import { SearchInput } from "@/components/common/search-input"
import { SelectFilter } from "@/components/common/select-filter"
import { Pagination } from "@/components/common/pagination"
import { DescriptionModal } from "@/components/common/description-modal"
import { DateRangeFilter } from "@/components/common/date-range-filter"
import {
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} from "@/lib/store/api/expensesApi"

export default function ExpensesPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentModeFilter, setPaymentModeFilter] = useState("all")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined)
  const [descriptionModal, setDescriptionModal] = useState<{ open: boolean; title: string; description: string }>({
    open: false,
    title: "",
    description: ""
  })

  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Expense>>({})
  const { toast } = useToast()

  // Fetch expenses from Firebase
  const { data, isLoading, isError, refetch } = useGetExpensesQuery()
  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation()
  const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation()
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation()

  const expenses = data?.expenses || []

  // Check if any filters are active
  const hasActiveFilters = searchTerm !== "" || paymentModeFilter !== "all" || dateRange?.from !== undefined

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("")
    setPaymentModeFilter("all")
    setDateRange(undefined)
    setCurrentPage(1)
  }

  // Filter and search expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch = 
        expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesPaymentMode = paymentModeFilter === "all" || expense.paymentMethod === paymentModeFilter

      // Date range filter
      let matchesDateRange = true
      if (dateRange?.from) {
        const expenseDate = new Date(expense.date)
        const fromDate = new Date(dateRange.from)
        const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from)

        fromDate.setHours(0, 0, 0, 0)
        toDate.setHours(23, 59, 59, 999)
        expenseDate.setHours(0, 0, 0, 0)

        matchesDateRange = expenseDate >= fromDate && expenseDate <= toDate
      }

      return matchesSearch && matchesPaymentMode && matchesDateRange
    })
  }, [expenses, searchTerm, paymentModeFilter, dateRange])

  // Pagination
  const totalItems = filteredExpenses.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + pageSize)

  // Reset page when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handlePaymentModeFilterChange = (value: string) => {
    setPaymentModeFilter(value)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value))
    setCurrentPage(1)
  }

  // Modal handlers
  const handleAdd = () => {
    setEditingId(null)
    setFormData({
      title: "",
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: "",
      // status: "pending",
      paymentMethod: ""
    })
    setIsOpen(true)
  }

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id)
    setFormData({ ...expense })
    setIsOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeleteId(id)
    setIsDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    
    try {
      await deleteExpense(deleteId).unwrap()
      toast({
        title: "Success",
        description: "Expense deleted successfully"
      })
    } catch (error: any) {
      console.error("Error deleting expense:", error)
      toast({
        title: "Error",
        description: "Failed to delete expense. Please try again.",
        variant: "destructive"
      })
    }
    
    setIsDeleteOpen(false)
    setDeleteId(null)
  }

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateExpense({
          expenseId: editingId,
          expenseData: {
            ...formData,
            id: editingId,
          }
        }).unwrap()
        toast({
          title: "Success",
          description: "Expense updated successfully"
        })
      } else {
        await createExpense(formData).unwrap()
        toast({
          title: "Success",
          description: "Expense added successfully"
        })
      }
      setIsOpen(false)
      refetch()
    } catch (error: any) {
      console.error("Error saving expense:", error)
      toast({
        title: "Error",
        description: "Failed to save expense. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleFormDataChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const openDescriptionModal = (title: string, description: string) => {
    setDescriptionModal({
      open: true,
      title,
      description
    })
  }

  const handleExport = () => {
    if (expenses.length === 0) {
      toast({
        title: "No Data",
        description: "No expenses to export",
        variant: "destructive"
      })
      return
    }

    // Prepare data for Excel
    const exportData = expenses.map((expense, index) => ({
      "S.No": index + 1,
      "Title": expense.title,
      "Amount": expense.amount,
      "Date": expense.date,
      "Payment Mode": expense.paymentMethod || "-",
      // "Status": expense.status,
      "Description": expense.description || "-",
      "Attachment": expense.attachmentUrl ? "Yes" : "No"
    }))

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // Set column widths
    const colWidths = [
      { wch: 6 },  // S.No
      { wch: 25 }, // Title
      { wch: 12 }, // Amount
      { wch: 12 }, // Date
      { wch: 15 }, // Payment Mode
      // { wch: 10 }, // Status
      { wch: 30 }, // Description
      { wch: 12 }, // Attachment
    ]
    worksheet['!cols'] = colWidths

    // Create workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses")

    // Generate filename with current date
    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `expenses_${dateStr}.xlsx`

    // Download file
    XLSX.writeFile(workbook, filename)

    toast({
      title: "Export Successful",
      description: `Exported ${expenses.length} expenses to ${filename}`
    })
  }

  const paymentModeColors: Record<string, string> = {
    Cash: "bg-blue-100 text-blue-800",
    "Bank Transfer": "bg-purple-100 text-purple-800",
    "Credit Card": "bg-green-100 text-green-800",
    "Debit Card": "bg-orange-100 text-orange-800",
    UPI: "bg-pink-100 text-pink-800",
    Cheque: "bg-gray-100 text-gray-800",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Expenses</h1>
          <p className="text-muted-foreground">Manage and track all expenses</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAdd} className="cursor-pointer">
            <Plus size={16} className="mr-2" /> Add Expense
          </Button>
          <Button variant="outline" className="cursor-pointer" onClick={handleExport}>
            <Download size={16} className="mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card>
        <CardContent className="px-5">
          <div className="flex items-end justify-between gap-3">
            {/* Search Input */}
            <SearchInput
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search expenses by title or description..."
            />

            {/* Right Side - Filters */}
            <div className="flex items-end gap-2">
              <SelectFilter
                value={paymentModeFilter}
                onChange={handlePaymentModeFilterChange}
                options={[
                  { value: "all", label: "All Payment Modes" },
                  ...PAYMENT_METHODS.map(method => ({ value: method, label: method }))
                ]}
                label="Payment Mode"
                placeholder="All Modes"
              />

              <DateRangeFilter
                value={dateRange}
                onChange={setDateRange}
                placeholder="Filter by date"
              />

              <SelectFilter
                value={pageSize.toString()}
                onChange={handlePageSizeChange}
                options={[
                  { value: "5", label: "5" },
                  { value: "10", label: "10" },
                  { value: "20", label: "20" },
                  { value: "50", label: "50" },
                ]}
                label="Page Size"
                width="w-[140px]"
              />

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

      {/* Table Card */}
      <Card>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-destructive">Error loading expenses. Please try again.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Title</th>
                    <th className="text-left py-3 px-4 font-semibold">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Payment Mode</th>
                    <th className="text-left py-3 px-4 font-semibold">Description</th>
                    <th className="text-left py-3 px-4 font-semibold">File</th>
                    <th className="text-left py-3 px-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        No expenses found. Click "Add Expense" to create your first expense.
                      </td>
                    </tr>
                  ) : (
                    paginatedExpenses.map((expense) => (
                      <tr key={expense.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{expense.title}</td>
                        <td className="py-3 px-4 font-semibold">{formatCurrency(expense.amount)}</td>
                        <td className="py-3 px-4 text-xs">
                          {new Date(expense.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </td>
                        <td className="py-3 px-4">
                          {expense.paymentMethod ? (
                            <Badge className={paymentModeColors[expense.paymentMethod] || "bg-gray-100 text-gray-800"}>
                              {expense.paymentMethod}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                           <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDescriptionModal(expense.title, expense.description || "No description available")}
                              className="cursor-pointer shrink-0 h-7 px-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground"
                            >
                              Show
                            </Button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {expense.attachmentUrl ? (
                            <a 
                              href={expense.attachmentUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                            >
                              <File className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-primary cursor-pointer hover:underline">View</span>
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(expense)} className="cursor-pointer">
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(expense.id)}
                            className="text-destructive cursor-pointer shrink-0"
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <ExpenseModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title={editingId ? "Edit Expense" : "Add Expense"}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        onSave={handleSave}
        isEditing={!!editingId}
        isLoading={isCreating || isUpdating}
      />

      {/* Delete Confirmation */}
      <ConfirmationModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
        onConfirm={confirmDelete}
      />

      {/* Description Modal */}
      <DescriptionModal
        open={descriptionModal.open}
        onOpenChange={(open) => setDescriptionModal(prev => ({ ...prev, open }))}
        title={descriptionModal.title}
        description={descriptionModal.description}
      />
    </div>
  )
}
