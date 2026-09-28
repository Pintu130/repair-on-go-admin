"use client"

import type { ReactNode } from "react"
import { Package } from "lucide-react"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  message?: string
  icon?: ReactNode
  className?: string
}

export function EmptyState({
  message = "No records found",
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex h-40 flex-col items-center justify-center px-4 text-center text-sm text-muted-foreground",
        className
      )}
    >
      <div className="mb-2 text-muted-foreground/60">{icon ?? <Package className="size-7" />}</div>
      <p>{message}</p>
    </div>
  )
}
