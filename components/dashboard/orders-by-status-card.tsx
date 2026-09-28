"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/common/empty-state"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/format"
import {
  ORDER_STATUS_BAR_COLORS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANTS,
} from "@/lib/order-status"
import type { StatusCount } from "@/lib/dashboard-stats"

interface OrdersByStatusCardProps {
  data: StatusCount[]
  totalOrders: number
  loading: boolean
}

export function OrdersByStatusCard({ data, totalOrders, loading }: OrdersByStatusCardProps) {
  const visible = data.filter((entry) => entry.count > 0)
  const maxCount = Math.max(1, ...visible.map((entry) => entry.count))

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Orders by Status</CardTitle>
        <CardDescription>{formatNumber(totalOrders)} orders in period</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-full bg-muted" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState message="No orders in this period" />
        ) : (
          <div className="space-y-3">
            {visible.map(({ status, count }) => (
              <div key={status}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Badge variant={ORDER_STATUS_VARIANTS[status]}>
                    {ORDER_STATUS_LABELS[status]}
                  </Badge>
                  <span className="text-sm font-semibold tabular-nums">{formatNumber(count)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-all", ORDER_STATUS_BAR_COLORS[status])}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
