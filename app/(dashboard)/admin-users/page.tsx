"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit2, Trash2, Plus, Upload, User } from "lucide-react"

interface AdminUser {
  id: string
  fullName: string
  email: string
  mobile: string
  password: string
  role: string
  status: "Active" | "Inactive"
  avatar?: string
}

interface Role {
  id: string
  name: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([
    {
      id: "1",
      fullName: "John Doe",
      email: "john@example.com",
      mobile: "9876543210",
      password: "******",
      role: "Admin",
      status: "Active",
    },
    {
      id: "2",
      fullName: "Jane Smith",
      email: "jane@example.com",
      mobile: "9876543211",
      password: "******",
      role: "Manager",
      status: "Active",
    },
  ])

  const [roles] = useState<Role[]>([
    { id: "1", name: "Super Admin" },
    { id: "2", name: "Admin" },
    { id: "3", name: "Manager" },
    { id: "4", name: "Subadmin" },
    { id: "5", name: "Blog Manager" },
  ])

  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    role: "",
    status: "Active" as "Active" | "Inactive",
    avatar: "",
  })

  const handleAdd = () => {
    setEditingId(null)
    setFormData({
      fullName: "",
      email: "",
      mobile: "",
      password: "",
      role: "",
      status: "Active",
      avatar: "",
    })
    setIsOpen(true)
  }

  const handleEdit = (user: AdminUser) => {
    setEditingId(user.id)
    setFormData({
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      password: user.password,
      role: user.role,
      status: user.status,
      avatar: user.avatar || "",
    })
    setIsOpen(true)
  }

  const handleSave = () => {
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.role) return

    if (editingId) {
      setUsers(
        users.map((u) =>
          u.id === editingId
            ? {
                ...u,
                fullName: formData.fullName,
                email: formData.email,
                mobile: formData.mobile,
                password: formData.password,
                role: formData.role,
                status: formData.status,
                avatar: formData.avatar,
              }
            : u,
        ),
      )
    } else {
      const newUser: AdminUser = {
        id: Date.now().toString(),
        fullName: formData.fullName,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
        role: formData.role,
        status: formData.status,
        avatar: formData.avatar,
      }
      setUsers([...users, newUser])
    }
    setIsOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter((u) => u.id !== id))
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Admin Users</h1>
          <p className="text-muted-foreground">Manage admin user accounts and assign roles</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={16} className="mr-2" /> Add Admin User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Admin Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(user.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.mobile}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(user)}>
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(user.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Admin User" : "Add New Admin User"}</DialogTitle>
            <p className="text-sm text-muted-foreground">Create a new admin user account</p>
          </DialogHeader>
          <div className="space-y-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={formData.avatar} />
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    <User size={32} />
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon-sm"
                  variant="secondary"
                  className="absolute bottom-0 right-0 rounded-full"
                  onClick={() => {
                    // In a real app, this would open a file picker
                    alert("File upload functionality would go here")
                  }}
                >
                  <Upload size={14} />
                </Button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="text-sm font-medium block mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter full name"
              />
            </div>

            {/* Email and Mobile */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Mobile Number *</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter 10-digit mobile number"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium block mb-2">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••"
              />
            </div>

            {/* Role and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Role *</label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as "Active" | "Inactive" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.fullName.trim() || !formData.email.trim() || !formData.role}>
              {editingId ? "Update User" : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
