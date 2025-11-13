"use client"

import { Search, Bell, Settings, LogOut, Menu, X } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"

export function Header() {
  const [showProfile, setShowProfile] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const { logout } = useAuth()

  return (
    <header className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg sticky top-0 z-20">
      <div className="flex items-center justify-between px-6 py-4 gap-4">
        {/* Search Bar - Desktop */}
        <div className="flex-1 hidden md:flex">
          <div className="relative w-full max-w-md">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-foreground/60"
              size={18}
            />
            <input
              type="text"
              placeholder="Search orders, customers..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-primary-foreground/10 text-primary-foreground placeholder-primary-foreground/60 border border-primary-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary-foreground/30"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-6">
          {/* Mobile Menu Button */}
          <button className="md:hidden text-primary-foreground hover:bg-primary-foreground/10 p-2 rounded-lg">
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Notification Bell */}
          <button className="p-2 hover:bg-primary-foreground/10 rounded-lg transition-colors relative group">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse" />
            <div className="absolute -bottom-10 right-0 bg-card text-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md">
              3 new updates
            </div>
          </button>

          {/* Settings */}
          <button className="p-2 hover:bg-primary-foreground/10 rounded-lg transition-colors">
            <Settings size={20} />
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="p-2 hover:bg-primary-foreground/10 rounded-lg transition-colors flex items-center gap-2"
            >
              <div className="w-9 h-9 bg-primary-foreground/20 rounded-full flex items-center justify-center font-semibold text-sm">
                A
              </div>
              <span className="text-sm font-medium hidden sm:inline">Admin</span>
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-xl p-0 overflow-hidden">
                {/* Profile Header */}
                <div className="px-4 py-3 border-b border-border bg-muted">
                  <p className="text-sm font-semibold">Admin User</p>
                  <p className="text-xs text-muted-foreground">admin@repairon.go</p>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <button className="w-full text-left px-3 py-2 hover:bg-muted rounded-md flex items-center gap-2 text-sm transition-colors">
                    <Settings size={16} /> Settings & Preferences
                  </button>
                  <button className="w-full text-left px-3 py-2 hover:bg-muted rounded-md flex items-center gap-2 text-sm transition-colors">
                    <Bell size={16} /> Notification Settings
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-border p-2">
                  <button
                    onClick={() => {
                      logout()
                      setShowProfile(false)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-destructive/10 rounded-md flex items-center gap-2 text-sm text-destructive transition-colors"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
