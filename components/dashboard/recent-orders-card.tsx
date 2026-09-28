"use client"

import { useRouter } from "next/navigation"
import { Eye, Wrench } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/common/empty-state"
import { formatDate, formatINR } from "@/lib/format"
import { ORDER_STATUS_LABELS, ORDER_STATUS_VARIANTS } from "@/lib/order-status"
import type { Order } from "@/data/orders"

interface RecentOrdersCardProps {
  data: Order[]
  loading: boolean
}

export function RecentOrdersCard({ data, loading }: RecentOrdersCardProps) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0">
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest {data.length} orders in period</CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => router.push("/orders")}>
          View all
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full bg-muted" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <EmptyState message="No orders in this period" icon={<Wrench className="size-7" />} />
        ) : (
          <div className="divide-y">
            {data.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="hidden size-10 shrink-0 items-center justify-center rounded-md bg-muted sm:flex">
                  <Wrench className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {order.bookingId || order.id}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {order.customer || "Unknown customer"} · {order.category || "—"} ·{" "}
                    {formatDate(order.date)}
                  </p>
                </div>
                <div className="hidden flex-col items-end sm:flex">
                  <span className="text-sm font-semibold tabular-nums">
                    {formatINR(order.amount)}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {order.paymentStatus}
                  </span>
                </div>
                <Badge variant={ORDER_STATUS_VARIANTS[order.status]}>
                  {ORDER_STATUS_LABELS[order.status]}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="cursor-pointer"
                  aria-label={`View order ${order.bookingId || order.id}`}
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <Eye className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
