"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit2, Trash2, Plus, Eye, Edit, Trash } from "lucide-react"

interface Permission {
  view: boolean
  edit: boolean
  delete: boolean
}

interface RolePermissions {
  [page: string]: Permission
}

interface Role {
  id: string
  name: string
  permissions: RolePermissions
  userCount: number
}
console.log('11111');

const defaultPermission: Permission = { view: false, edit: false, delete: false }

const createDefaultPermissions = (): RolePermissions => {
  const pages = [
    "Dashboard",
    "Customers",
    "Employees",
    "Orders",
    "Categories",
    "Reviews",
    "FAQ",
    "Payments",
    "Announcements",
    "SEO",
    "Web Settings",
    "Role Management",
    "Admin Users",
  ]
  
  const permissions: RolePermissions = {}
  pages.forEach(page => {
    permissions[page] = { ...defaultPermission }
  })
  return permissions
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([
    { 
      id: "1", 
      name: "Super Admin", 
      permissions: Object.fromEntries(
        Object.keys(createDefaultPermissions()).map(page => [page, { view: true, edit: true, delete: true }])
      ),
      userCount: 2
    },
    {
      id: "2",
      name: "Manager",
      permissions: {
        ...createDefaultPermissions(),
        "Dashboard": { view: true, edit: false, delete: false },
        "Customers": { view: true, edit: false, delete: false },
        "Orders": { view: true, edit: true, delete: false },
        "Categories": { view: true, edit: true, delete: false },
        "Reviews": { view: true, edit: false, delete: false },
      },
      userCount: 5,
    },
  ])
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: "", permissions: createDefaultPermissions() })

  const handleAdd = () => {
    setEditingId(null)
    setFormData({ name: "", permissions: createDefaultPermissions() })
    setIsOpen(true)
  }

  const handleEdit = (role: Role) => {
    setEditingId(role.id)
    setFormData({ name: role.name, permissions: { ...role.permissions } })
    setIsOpen(true)
  }

  const handleSave = () => {
    if (!formData.name.trim()) return

    if (editingId) {
      setRoles(
        roles.map((r) =>
          r.id === editingId
            ? { ...r, name: formData.name, permissions: formData.permissions }
            : r,
        ),
      )
    } else {
      const newRole: Role = {
        id: Date.now().toString(),
        name: formData.name,
        permissions: formData.permissions,
        userCount: 0,
      }
      setRoles([...roles, newRole])
    }
    setIsOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this role?")) {
      setRoles(roles.filter((r) => r.id !== id))
    }
  }

  const togglePermission = (page: string, type: 'view' | 'edit' | 'delete') => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [page]: {
          ...prev.permissions[page],
          [type]: !prev.permissions[page][type],
        },
      },
    }))
  }

  const getPermissionCount = (permissions: RolePermissions) => {
    let count = 0
    Object.values(permissions).forEach(perm => {
      if (perm.view) count++
      if (perm.edit) count++
      if (perm.delete) count++
    })
    return count
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Role Management</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={16} className="mr-2" /> Add Role
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{role.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{role.userCount} users</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Permissions:</h4>
                <div className="text-sm text-muted-foreground">
                  {getPermissionCount(role.permissions)} permission(s) assigned
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(role)} className="flex-1">
                  <Edit2 size={16} className="mr-2" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(role.id)}
                  className="flex-1 text-destructive"
                >
                  <Trash2 size={16} className="mr-2" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit role dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Role" : "Add New Role"}</DialogTitle>
            <p className="text-sm text-muted-foreground">Create a new role and assign permissions</p>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-y-auto px-2">
            <div>
              <label className="text-sm font-medium block mb-2">Role Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter role name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-3 block">Permissions</label>
              <div className="space-y-3">
                {/* Dashboard Section */}
                <div className="border border-border rounded-lg p-4 bg-muted/20">
                  <h3 className="font-semibold mb-3">Dashboard</h3>
                  <div className="space-y-3">
                    <PermissionRow 
                      label="Dashboard" 
                      permissions={formData.permissions["Dashboard"]}
                      onToggle={(type) => togglePermission("Dashboard", type)}
                    />
                  </div>
                </div>

                {/* User Management Section */}
                <div className="border border-border rounded-lg p-4 bg-muted/20">
                  <h3 className="font-semibold mb-3">User Management</h3>
                  <div className="space-y-3">
                    <PermissionRow 
                      label="Customers" 
                      permissions={formData.permissions["Customers"]}
                      onToggle={(type) => togglePermission("Customers", type)}
                    />
                    <PermissionRow 
                      label="Employees" 
                      permissions={formData.permissions["Employees"]}
                      onToggle={(type) => togglePermission("Employees", type)}
                    />
                  </div>
                </div>

                {/* Order & Category Management */}
                <div className="border border-border rounded-lg p-4 bg-muted/20">
                  <h3 className="font-semibold mb-3">Order & Category Management</h3>
                  <div className="space-y-3">
                    <PermissionRow 
                      label="Orders" 
                      permissions={formData.permissions["Orders"]}
                      onToggle={(type) => togglePermission("Orders", type)}
                    />
                    <PermissionRow 
                      label="Categories" 
                      permissions={formData.permissions["Categories"]}
                      onToggle={(type) => togglePermission("Categories", type)}
                    />
                    <PermissionRow 
                      label="Reviews" 
                      permissions={formData.permissions["Reviews"]}
                      onToggle={(type) => togglePermission("Reviews", type)}
                    />
                  </div>
                </div>

                {/* Other Sections */}
                <div className="border border-border rounded-lg p-4 bg-muted/20">
                  <h3 className="font-semibold mb-3">Other</h3>
                  <div className="space-y-3">
                    <PermissionRow 
                      label="FAQ" 
                      permissions={formData.permissions["FAQ"]}
                      onToggle={(type) => togglePermission("FAQ", type)}
                    />
                    <PermissionRow 
                      label="Payments" 
                      permissions={formData.permissions["Payments"]}
                      onToggle={(type) => togglePermission("Payments", type)}
                    />
                    <PermissionRow 
                      label="Announcements" 
                      permissions={formData.permissions["Announcements"]}
                      onToggle={(type) => togglePermission("Announcements", type)}
                    />
                    <PermissionRow 
                      label="SEO" 
                      permissions={formData.permissions["SEO"]}
                      onToggle={(type) => togglePermission("SEO", type)}
                    />
                    <PermissionRow 
                      label="Web Settings" 
                      permissions={formData.permissions["Web Settings"]}
                      onToggle={(type) => togglePermission("Web Settings", type)}
                    />
                    <PermissionRow 
                      label="Role Management" 
                      permissions={formData.permissions["Role Management"]}
                      onToggle={(type) => togglePermission("Role Management", type)}
                    />
                    <PermissionRow 
                      label="Admin Users" 
                      permissions={formData.permissions["Admin Users"]}
                      onToggle={(type) => togglePermission("Admin Users", type)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name.trim()}>
              {editingId ? "Update Role" : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Permission Row Component
function PermissionRow({ 
  label, 
  permissions, 
  onToggle 
}: { 
  label: string
  permissions: Permission
  onToggle: (type: 'view' | 'edit' | 'delete') => void
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm font-medium flex-1">{label}</span>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox 
            checked={permissions.view}
            onCheckedChange={() => onToggle('view')}
          />
          <Eye className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">View</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox 
            checked={permissions.edit}
            onCheckedChange={() => onToggle('edit')}
          />
          <Edit className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Edit</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox 
            checked={permissions.delete}
            onCheckedChange={() => onToggle('delete')}
          />
          <Trash className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Delete</span>
        </label>
      </div>
    </div>
  )
}
