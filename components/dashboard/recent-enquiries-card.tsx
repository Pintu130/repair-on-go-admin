"use client"

import { useRouter } from "next/navigation"
import { Mail } from "lucide-react"

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
import { timeAgo } from "@/lib/format"
import type { RecentEnquiry } from "@/lib/dashboard-stats"

interface RecentEnquiriesCardProps {
  data: RecentEnquiry[]
  loading: boolean
}

export function RecentEnquiriesCard({ data, loading }: RecentEnquiriesCardProps) {
  const router = useRouter()

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0">
          <CardTitle>Recent Enquiries</CardTitle>
          <CardDescription>Contact form leads</CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => router.push("/contact")}>
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
          <EmptyState message="No enquiries in this period" icon={<Mail className="size-7" />} />
        ) : (
          <div className="space-y-2">
            {data.map((enquiry) => (
              <div
                key={enquiry.id}
                className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Mail className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{enquiry.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {enquiry.subject || enquiry.email || "No message"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant={enquiry.status === "new" ? "default" : "secondary"}>
                    {enquiry.status === "new" ? "New" : "Read"}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {timeAgo(enquiry.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
