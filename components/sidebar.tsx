"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  X,
  LayoutDashboard,
  Users,
  Star,
  ShoppingCart,
  UserCog,
  Shield,
  ShieldCheck,
  Tag,
  Megaphone,
  CreditCard,
  HelpCircle,
  Globe,
  FolderTree,
  Search,
  Settings,
  ChevronDown,
  ChevronRight,
  UserCircle2,
  UsersRound,
  Sparkles,
  MessageCircle,
  FileSearch,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/components/ui/use-mobile"
import { useSidebarContext } from "@/lib/sidebar-context"

interface MenuItem {
  label: string
  href?: string
  icon: any
  children?: MenuItem[]
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const { mobileOpen, setMobileOpen } = useSidebarContext()

  const menuItems: MenuItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    {
      label: "Customer",
      icon: UserCircle2,
      children: [
        { label: "Customers", href: "/customers", icon: Users },
        { label: "Reviews", href: "/reviews", icon: Star },
      ],
    },
    { label: "Orders", href: "/orders", icon: ShoppingCart },
    {
      label: "Categories",
      icon: FolderTree,
      children: [
        { label: "Category", href: "/categories", icon: FolderTree },
        { label: "Category Requests", href: "/category-requests", icon: FileSearch },
      ],
    },
    {
      label: "Promotions",
      icon: Sparkles,
      children: [
        { label: "Coupons", href: "/coupons", icon: Tag },
        { label: "Announcements", href: "/announcements", icon: Megaphone },
      ],
    },
    {
      label: "Staff Management",
      icon: UsersRound,
      children: [
        { label: "Employees", href: "/employees", icon: UserCog },
        { label: "Role Management", href: "/roles", icon: Shield },
        { label: "Admin Users", href: "/admin-users", icon: ShieldCheck },
      ],
    },
    { label: "Payments", href: "/payments", icon: CreditCard },
    { label: "FAQ", href: "/faq", icon: HelpCircle },
    { label: "Contact", href: "/contact", icon: MessageCircle },
    {
      label: "Web Configurations",
      icon: Globe,
      children: [
        { label: "SEO", href: "/seo", icon: Search },
        { label: "Web Settings", href: "/web-settings", icon: Settings },
      ],
    },
  ]

  // Find the active parent based on current pathname
  const activeParent = menuItems.find(
    (item) =>
      item.children &&
      item.children.some((child) => child.href && pathname.startsWith(child.href))
  )

  const [manualOpen, setManualOpen] = useState<string | null>(null)
  const openDropdown: string | null =
    manualOpen === "closed" ? null : manualOpen ?? activeParent?.label ?? null

  const closeMobileSidebar = () => {
    if (isMobile) setMobileOpen(false)
  }

  const renderMenuItem = (item: MenuItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = openDropdown === item.label
    const isActive = item.href && pathname === item.href
    const IconComponent = item.icon

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            type="button"
            onClick={() => setManualOpen(isExpanded ? "closed" : item.label)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              isExpanded
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              depth > 0 && "pl-8"
            )}
            title={!isOpen ? item.label : ""}
          >
            <IconComponent size={20} className="shrink-0" />
            {isOpen && (
              <>
                <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                {isExpanded ? (
                  <ChevronDown size={16} className="shrink-0" />
                ) : (
                  <ChevronRight size={16} className="shrink-0" />
                )}
              </>
            )}
          </button>
          {isOpen && isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children?.map((child) => {
                const childActive = child.href && pathname.startsWith(child.href)
                const ChildIcon = child.icon

                return (
                  <Link
                    key={child.href}
                    href={child.href || "#"}
                    onClick={() => {
                      setManualOpen(item.label)
                      closeMobileSidebar()
                    }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                      childActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      "pl-8"
                    )}
                  >
                    <ChildIcon size={20} className="shrink-0" />
                    <span className="text-sm font-medium">{child.label}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.href}
        href={item.href || "#"}
        onClick={() => {
          setManualOpen(null)
          closeMobileSidebar()
        }}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          depth > 0 && "pl-8"
        )}
        title={!isOpen ? item.label : ""}
      >
        <IconComponent size={20} className="shrink-0" />
        {isOpen && <span className="text-sm font-medium">{item.label}</span>}
      </Link>
    )
  }

  const sidebarTranslate = isMobile ? (mobileOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"
  const sidebarWidth = isMobile ? "w-64 max-w-[85vw]" : isOpen ? "w-64" : "w-20"

  return (
    <>
      {/* Overlay for mobile: tap outside to close */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out z-50",
          sidebarWidth,
          sidebarTranslate,
          "md:translate-x-0"
        )}
      >
        <div className="p-4 sm:p-6 border-b border-sidebar-border flex items-center justify-between gap-2">
          <h1 className={cn("font-bold text-lg sm:text-xl truncate", !isOpen && !isMobile && "text-center")}>
            {isOpen || isMobile ? "RepairOnGo" : "RG"}
          </h1>
          {/* Close button: only on mobile when drawer is open */}
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="p-3 sm:p-4 space-y-2 flex flex-col h-[calc(100vh-80px)] overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => renderMenuItem(item))}
        </nav>
      </aside>
    </>
  )
}
