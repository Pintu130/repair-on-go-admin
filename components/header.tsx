"use client"

import Image from "next/image"
import { Eye, EyeOff, LogOut, Menu, Shield, User2, X } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Header() {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { logout, user: authUser } = useAuth()

  // Use user data from auth context, fallback to default if not available
  const user = {
    name: authUser?.name || "Admin User",
    email: authUser?.email || "admin@repairon.go",
    role: authUser?.role || "Super Admin",
  }

  return (
    <header className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg sticky top-0 z-20">
      <div className="flex items-center justify-end px-6 py-4 gap-4">

        {/* Right Section */}
        <div className="flex items-center gap-6">
          {/* Mobile Menu Button (placeholder for future) */}
          <button
            className="md:hidden text-primary-foreground hover:bg-primary-foreground/10 p-2 rounded-lg"
            onClick={() => setShowMobileMenu((prev) => !prev)}
          >
            <Menu size={24} />
          </button>

          {/* User Info + Avatar + Menu */}
          <div className="flex items-center gap-3">
            {/* Email & Role */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium leading-tight">{user.email}</span>
              <span className="text-[11px] uppercase tracking-wide flex items-center gap-1 text-primary-foreground/80">
                <Shield className="w-3 h-3" /> {user.role}
              </span>
            </div>

            {/* Avatar + Dropdown + Change Password Modal */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="relative h-9 w-9 rounded-full overflow-hidden border border-primary-foreground/30 bg-primary-foreground/20 flex items-center justify-center cursor-pointer">
                  <Image
                    src="/placeholder-user.jpg"
                    alt={user.name}
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <User2 className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="cursor-pointer"
                >
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout()
                  }}
                  variant="destructive"
                  className="cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Custom Change Password Modal */}
            {isChangePasswordOpen && (
              <>
                {/* Overlay */}
                <div
                  className="fixed inset-0 bg-black/80 z-50 animate-in fade-in-0"
                  onClick={() => setIsChangePasswordOpen(false)}
                />
                {/* Modal Content */}
                <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border border-border bg-background p-6 shadow-lg rounded-lg animate-in fade-in-0 zoom-in-95">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold leading-none tracking-tight">Change Password</h2>
                      <p className="text-sm text-muted-foreground mt-1.5">
                        Update your account password. Make sure it&apos;s strong and unique.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsChangePasswordOpen(false)}
                      className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </button>
                  </div>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">New Password</label>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Confirm Password</label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter new password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsChangePasswordOpen(false)
                        setShowNewPassword(false)
                        setShowConfirmPassword(false)
                      }}
                      className="cursor-pointer text-black"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="cursor-pointer"
                      onClick={() => {
                        // TODO: Add password change logic here
                        setIsChangePasswordOpen(false)
                        setShowNewPassword(false)
                        setShowConfirmPassword(false)
                      }}
                    >
                      Save Password
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
