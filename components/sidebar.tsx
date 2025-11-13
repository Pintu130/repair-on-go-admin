"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Briefcase,
  ListTodo,
  FolderOpen,
  Star,
  HelpCircle,
  CreditCard,
  Megaphone,
  Search,
  Settings,
  Lock,
  UserCog,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const pathname = usePathname()

  const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Employees", href: "/employees", icon: Briefcase },
    { label: "Orders", href: "/orders", icon: ListTodo },
    { label: "Categories", href: "/categories", icon: FolderOpen },
    { label: "Reviews", href: "/reviews", icon: Star },
    { label: "FAQ", href: "/faq", icon: HelpCircle },
    { label: "Payments", href: "/payments", icon: CreditCard },
    { label: "Announcements", href: "/announcements", icon: Megaphone },
    { label: "SEO", href: "/seo", icon: Search },
    { label: "Web Settings", href: "/web-settings", icon: Settings },
    { label: "Role Management", href: "/roles", icon: Lock },
    { label: "Admin Users", href: "/admin-users", icon: UserCog },
  ]

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-lg"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out z-30",
          isOpen ? "w-64" : "w-20",
          "md:translate-x-0",
          !isOpen && "max-md:-translate-x-full",
        )}
      >
        <div className="p-6 border-b border-sidebar-border">
          <h1 className={cn("font-bold text-xl", !isOpen && "text-center")}>{isOpen ? "RepairOnGo" : "RG"}</h1>
        </div>

        <nav className="p-4 space-y-2 flex flex-col h-[calc(100vh-80px)]">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const IconComponent = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                title={!isOpen ? item.label : ""}
              >
                <IconComponent size={20} className="shrink-0" />
                {isOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 md:hidden z-40" onClick={() => setIsOpen(false)} />}
    </>
  )
}
