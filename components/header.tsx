"use client"

import Image from "next/image"
import { Eye, EyeOff, LogOut, Menu, Shield, User2, X } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useSidebarContext } from "@/lib/sidebar-context"
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
import { auth } from "@/lib/firebase/config"
import { updatePassword } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"

export function Header() {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { logout, user: authUser } = useAuth()
  const { setMobileOpen } = useSidebarContext()
  const { toast } = useToast()

  const user = {
    name: authUser?.name || "Admin User",
    email: authUser?.email || "admin@repairon.go",
    role: authUser?.role || "Super Admin",
  }

  const handleCloseModal = () => {
    setIsChangePasswordOpen(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setNewPassword("")
    setConfirmPassword("")
    setIsLoading(false)
  }

  const handleChangePassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        toast({
          title: "Error",
          description: "No user is currently logged in",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      await updatePassword(currentUser, newPassword)
      
      toast({
        title: "Success!",
        description: "Password changed successfully",
      })
      
      handleCloseModal()
    } catch (error: any) {
      console.error("Password change error:", error)
      
      let errorMessage = "Failed to change password"
      
      if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please log out and log in again before changing your password"
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Please choose a stronger password"
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      
      setIsLoading(false)
    }
  }

  return (
    <>
      <header className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg sticky top-0 z-20">
        <div className="flex items-center justify-between md:justify-end px-4 sm:px-6 py-4 gap-4">
          <button
            className="md:hidden text-primary-foreground hover:bg-primary-foreground/10 p-2 rounded-lg -ml-1"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium leading-tight">{user.email}</span>
                <span className="text-[11px] uppercase tracking-wide flex items-center gap-1 text-primary-foreground/80">
                  <Shield className="w-3 h-3" /> {user.role}
                </span>
              </div>

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
                      <p className="text-sm font-medium leading-none text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setIsChangePasswordOpen(true)}
                    className="cursor-pointer text-foreground"
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
            </div>
          </div>
        </div>
      </header>

      {isChangePasswordOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/80 z-[9999]"
            onClick={handleCloseModal}
          />
          <div className="fixed left-[50%] top-[50%] z-[10000] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border border-border bg-background p-6 shadow-lg rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground">Change Password</h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Update your account password. Make sure it&apos;s strong and unique.
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">New Password</label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pr-10 text-foreground bg-white dark:bg-gray-900"
                    style={{ color: 'var(--foreground)' }}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="pr-10 text-foreground bg-white dark:bg-gray-900"
                    style={{ color: 'var(--foreground)' }}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                className="cursor-pointer text-foreground"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                className="cursor-pointer"
                onClick={handleChangePassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Changing...
                  </>
                ) : (
                  "Save Password"
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
