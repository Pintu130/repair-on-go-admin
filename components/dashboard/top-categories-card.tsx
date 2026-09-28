"use client"

import { useRouter } from "next/navigation"
import { FolderTree } from "lucide-react"

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
import { formatINR, formatNumber } from "@/lib/format"
import type { TopCategory } from "@/lib/dashboard-stats"

interface TopCategoriesCardProps {
  data: TopCategory[]
  loading: boolean
}

export function TopCategoriesCard({ data, loading }: TopCategoriesCardProps) {
  const router = useRouter()
  const best = data[0]

  return (
    <Card className="lg:col-span-3">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0">
          <CardTitle>Top Categories</CardTitle>
          <CardDescription className="truncate">
            By revenue{best ? ` · ${best.name} is the top performer` : ""}
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="cursor-pointer"
          onClick={() => router.push("/categories")}
        >
          View all
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full bg-muted" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <EmptyState message="No bookings in this period" icon={<FolderTree className="size-7" />} />
        ) : (
          <div className="space-y-1">
            {data.map((category, index) => (
              <div
                key={category.categoryId || category.name}
                className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"
              >
                <span className="w-4 shrink-0 text-center text-sm font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="size-full object-contain"
                    />
                  ) : (
                    <FolderTree className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{category.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatNumber(category.bookings)} bookings · {formatNumber(category.paidBookings)} paid
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 tabular-nums">
                  {formatINR(category.revenue)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
