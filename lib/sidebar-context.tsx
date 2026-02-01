"use client"

import * as React from "react"

type SidebarContextValue = {
  mobileOpen: boolean
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const value = React.useMemo(
    () => ({ mobileOpen, setMobileOpen }),
    [mobileOpen]
  )
  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  )
}

export function useSidebarContext() {
  const ctx = React.useContext(SidebarContext)
  if (!ctx) {
    return { mobileOpen: false, setMobileOpen: () => {} }
  }
  return ctx
}
