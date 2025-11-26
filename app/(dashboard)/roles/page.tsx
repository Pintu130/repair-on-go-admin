"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, Plus } from "lucide-react"
import { RoleModal, Permission, RolePermissions } from "@/components/common/role-modal"
import { ConfirmationModal } from "@/components/common/confirmation-modal"

interface Role {
  id: string
  name: string
  permissions: RolePermissions
  userCount: number
}

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
  const [deletingId, setDeletingId] = useState<string | null>(null)
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

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
  }

  const handleDeleteConfirm = () => {
    if (deletingId) {
      setRoles(roles.filter((r) => r.id !== deletingId))
      setDeletingId(null)
    }
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
        <Button onClick={handleAdd} className="cursor-pointer">
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
                <Button variant="outline" size="sm" onClick={() => handleEdit(role)} className="flex-1 cursor-pointer">
                  <Edit2 size={16} className="mr-2" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(role.id)}
                  className="flex-1 text-destructive cursor-pointer"
                >
                  <Trash2 size={16} className="mr-2" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit role modal */}
      <RoleModal
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsOpen(false)
            setEditingId(null)
            setFormData({ name: "", permissions: createDefaultPermissions() })
          } else {
            setIsOpen(open)
          }
        }}
        formData={formData}
        onFormDataChange={setFormData}
        onSave={handleSave}
        onCancel={() => {
          setIsOpen(false)
          setEditingId(null)
          setFormData({ name: "", permissions: createDefaultPermissions() })
        }}
        isEditing={!!editingId}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={!!deletingId}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingId(null)
          }
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Role?"
        description="Are you sure you want to delete this role? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  )
}

