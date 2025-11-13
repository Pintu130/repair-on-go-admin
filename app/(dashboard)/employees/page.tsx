"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Search, ChevronLeft, ChevronRight, Edit2, Trash2, Plus } from "lucide-react"
import { mockEmployees } from "@/data/employees"

const ITEMS_PER_PAGE = 8

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
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    tasksAssigned: 0,
    performanceScore: 0,
    status: "active" as const,
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

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

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

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any)
                setCurrentPage(1)
              }}
              className="px-4 py-2 rounded-lg border border-border bg-background"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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
              Showing {paginatedData.length ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
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
