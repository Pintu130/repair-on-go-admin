"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { SidebarProvider } from "@/lib/sidebar-context"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Loader } from "@/components/ui/loader"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [showLoader, setShowLoader] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  // Show loader for minimum 1 second to ensure it's always visible
  useEffect(() => {
    if (hasMounted && !isLoading && isAuthenticated) {
      // Always show loader for at least 1 second after mount
      const timer = setTimeout(() => {
        setShowLoader(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [hasMounted, isLoading, isAuthenticated])

  // Show loading loader while checking authentication or during minimum display time
  if (!hasMounted || isLoading || showLoader) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader size="md" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background min-w-0">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 ml-0 md:ml-64">
          <Header />
          <main className="flex-1 overflow-auto bg-background">
            <div className="p-4 sm:p-6">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
