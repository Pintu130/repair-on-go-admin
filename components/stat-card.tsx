import type { ReactNode } from "react"
import Link from "next/link"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon: ReactNode
  /** Icon container ke colours, e.g. "bg-emerald-50 text-emerald-600" */
  iconClass: string
  loading?: boolean
  /** Set karo to poora card link ban jata hai */
  href?: string
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  iconClass,
  loading = false,
  href,
}: StatCardProps) {
  const card = (
    <Card
      className={cn(
        "gap-0 p-4",
        href && "transition-colors hover:border-primary/40 hover:bg-muted/30"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[13px] font-medium text-muted-foreground">{label}</p>
        <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", iconClass)}>
          {icon}
        </div>
      </div>

      <div className="mt-2">
        {loading ? (
          <Skeleton className="h-7 w-20 bg-muted" />
        ) : (
          <div className="truncate text-xl font-bold tabular-nums">{value}</div>
        )}
        {sub ? <p className="mt-1 truncate text-xs text-muted-foreground">{sub}</p> : null}
      </div>
    </Card>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block cursor-pointer rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {card}
      </Link>
    )
  }

  return card
}
