"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Search, ChevronLeft, ChevronRight, Edit2, Trash2, Plus, X } from "lucide-react"
import { mockEmployees } from "@/data/employees"
import { SearchInput } from "@/components/common/search-input"
import { SelectFilter } from "@/components/common/select-filter"

interface Employee {
  id: string
  name: string
  email: string
  role: string
  tasksAssigned: number
  performanceScore: number
  status: "active" | "inactive"
}

export default function EmployeesPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees)

  // Check if any filters are active
  const hasActiveFilters = searchTerm !== "" || statusFilter !== "all"

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setCurrentPage(1)
  }
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    email: string
    role: string
    tasksAssigned: number
    performanceScore: number
    status: "active" | "inactive"
  }>({
    name: "",
    email: "",
    role: "",
    tasksAssigned: 0,
    performanceScore: 0,
    status: "active",
  })

  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || emp.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchTerm, statusFilter, employees])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleAdd = () => {
    setEditingId(null)
    setFormData({ name: "", email: "", role: "", tasksAssigned: 0, performanceScore: 0, status: "active" })
    setIsOpen(true)
  }

  const handleEdit = (employee: Employee) => {
    setEditingId(employee.id)
    setFormData({ ...employee })
    setIsOpen(true)
  }

  const handleSave = () => {
    if (!formData.name || !formData.email) return

    if (editingId) {
      setEmployees(employees.map((e) => (e.id === editingId ? { ...e, ...formData, id: editingId } : e)))
    } else {
      const newEmployee: Employee = { ...formData, id: Date.now().toString() }
      setEmployees([...employees, newEmployee])
    }
    setIsOpen(false)
  }

  const handleDelete = (id: string) => {
    setEmployees(employees.filter((e) => e.id !== id))
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
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Role</th>
                  <th className="text-left py-3 px-4 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 font-semibold">Tasks</th>
                  <th className="text-left py-3 px-4 font-semibold">Performance</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((emp) => (
                  <tr key={emp.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 font-semibold">{emp.name}</td>
                    <td className="py-3 px-4">{emp.role}</td>
                    <td className="py-3 px-4 text-xs">{emp.email}</td>
                    <td className="py-3 px-4">{emp.tasksAssigned}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${emp.performanceScore}%` }} />
                        </div>
                        <span className="text-xs font-semibold">{emp.performanceScore}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={emp.status === "active" ? "default" : "secondary"}>
                        {emp.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(emp)}>
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(emp.id)}
                        className="text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                      <Link href={`/admin/employees/${emp.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Showing {paginatedData.length ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
              {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Employee" : "Add New Employee"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                placeholder="e.g., Plumber, Electrician"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tasks Assigned</label>
                <input
                  type="number"
                  value={formData.tasksAssigned}
                  onChange={(e) => setFormData({ ...formData, tasksAssigned: Number.parseInt(e.target.value) || 0 })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Performance (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.performanceScore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      performanceScore: Math.min(100, Math.max(0, Number.parseInt(e.target.value) || 0)),
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
