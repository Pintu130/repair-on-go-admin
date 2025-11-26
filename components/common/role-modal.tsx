"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, Edit, Trash } from "lucide-react"

export interface Permission {
  view: boolean
  edit: boolean
  delete: boolean
}

export interface RolePermissions {
  [page: string]: Permission
}

interface RoleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: {
    name: string
    permissions: RolePermissions
  }
  onFormDataChange: (data: { name: string; permissions: RolePermissions }) => void
  onSave: () => void
  onCancel: () => void
  isEditing: boolean
}

// Permission Row Component
function PermissionRow({
  label,
  permissions,
  onToggle,
}: {
  label: string
  permissions: Permission
  onToggle: (type: "view" | "edit" | "delete") => void
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm font-medium flex-1">{label}</span>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={permissions.view} onCheckedChange={() => onToggle("view")} />
          <Eye className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">View</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={permissions.edit} onCheckedChange={() => onToggle("edit")} />
          <Edit className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Edit</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={permissions.delete} onCheckedChange={() => onToggle("delete")} />
          <Trash className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Delete</span>
        </label>
      </div>
    </div>
  )
}

export function RoleModal({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSave,
  onCancel,
  isEditing,
}: RoleModalProps) {
  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  const togglePermission = (page: string, type: "view" | "edit" | "delete") => {
    onFormDataChange({
      ...formData,
      permissions: {
        ...formData.permissions,
        [page]: {
          ...formData.permissions[page],
          [type]: !formData.permissions[page][type],
        },
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Role" : "Add New Role"}</DialogTitle>
          <p className="text-sm text-muted-foreground">Create a new role and assign permissions</p>
        </DialogHeader>
        <div className="space-y-4 flex-1 overflow-y-auto px-2">
          <div>
            <Label htmlFor="role-name" className="text-sm font-medium block mb-2">
              Role Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="role-name"
              type="text"
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              placeholder="Enter role name"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">Permissions</Label>
            <div className="space-y-3">
              {/* Dashboard Section */}
              <div className="border border-border rounded-lg p-4 bg-muted/20">
                <h3 className="font-semibold mb-3">Dashboard</h3>
                <div className="space-y-3">
                  <PermissionRow
                    label="Dashboard"
                    permissions={formData.permissions["Dashboard"] || { view: false, edit: false, delete: false }}
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
                    permissions={formData.permissions["Customers"] || { view: false, edit: false, delete: false }}
                    onToggle={(type) => togglePermission("Customers", type)}
                  />
                  <PermissionRow
                    label="Employees"
                    permissions={formData.permissions["Employees"] || { view: false, edit: false, delete: false }}
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
                    permissions={formData.permissions["Orders"] || { view: false, edit: false, delete: false }}
                    onToggle={(type) => togglePermission("Orders", type)}
                  />
                  <PermissionRow
                    label="Categories"
                    permissions={formData.permissions["Categories"] || { view: false, edit: false, delete: false }}
                    onToggle={(type) => togglePermission("Categories", type)}
                  />
                  <PermissionRow
                    label="Reviews"
                    permissions={formData.permissions["Reviews"] || { view: false, edit: false, delete: false }}
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
                    permissions={formData.permissions["FAQ"] || { view: false, edit: false, delete: false }}
                    onToggle={(type) => togglePermission("FAQ", type)}
                  />
                  <PermissionRow
                    label="Payments"
                    permissions={formData.permissions["Payments"] || { view: false, edit: false, delete: false }}
                    onToggle={(type) => togglePermission("Payments", type)}
                  />
                  <PermissionRow
                    label="Announcements"
                    permissions={formData.permissions["Announcements"] || { view: false, edit: false, delete: false }}
                    onToggle={(type) => togglePermission("Announcements", type)}
                  />
                  <PermissionRow
                    label="SEO"
                    permissions={formData.permissions["SEO"] || { view: false, edit: false, delete: false }}
                    onToggle={(type) => togglePermission("SEO", type)}
                  />
                  <PermissionRow
                    label="Web Settings"
                    permissions={formData.permissions["Web Settings"] || { view: false, edit: false, delete: false }}
                    onToggle={(type) => togglePermission("Web Settings", type)}
                  />
                  <PermissionRow
                    label="Role Management"
                    permissions={formData.permissions["Role Management"] || { view: false, edit: false, delete: false }}
                    onToggle={(type) => togglePermission("Role Management", type)}
                  />
                  <PermissionRow
                    label="Admin Users"
                    permissions={formData.permissions["Admin Users"] || { view: false, edit: false, delete: false }}
                    onToggle={(type) => togglePermission("Admin Users", type)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleCancel} className="cursor-pointer">
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!formData.name.trim()} className="cursor-pointer">
            {isEditing ? "Update Role" : "Add Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

