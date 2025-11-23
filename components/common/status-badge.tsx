"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "active" | "inactive"
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isActive = status === "active"

  return (
    <Badge
      className={cn(
        isActive
          ? "bg-green-500 hover:bg-green-600 text-white border-green-600"
          : "bg-red-500 hover:bg-red-600 text-white border-red-600",
        className
      )}
    >
      {isActive ? "✓ Active" : "Inactive"}
    </Badge>
  )
}

