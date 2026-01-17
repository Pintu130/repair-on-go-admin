import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Section Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg bg-gray-200" />
          <div>
            <Skeleton className="h-8 w-32 mb-2 bg-gray-200" />
            <Skeleton className="h-4 w-24 bg-gray-200" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-20 bg-gray-200" />
          <Skeleton className="h-10 w-20 bg-gray-200" />
        </div>
      </div>

      {/* Key Information Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg bg-gray-200" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-16 mb-2 bg-gray-200" />
                  <Skeleton className="h-5 w-24 bg-gray-200" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Customer Submission Section Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 bg-gray-200" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-32 mb-2 bg-gray-200" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg bg-gray-200" />
                ))}
              </div>
            </div>
            <div>
              <Skeleton className="h-4 w-32 mb-2 bg-gray-200" />
              <Skeleton className="h-20 w-full rounded-lg bg-gray-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Timeline Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 bg-gray-200" />
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Skeleton className="h-1 w-full mb-8 bg-gray-200" />
            <div className="flex items-start justify-between">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex flex-col items-center flex-1">
                  <Skeleton className="h-10 w-10 rounded-full mb-2 bg-gray-200" />
                  <Skeleton className="h-4 w-16 mb-1 bg-gray-200" />
                  <Skeleton className="h-3 w-20 bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2 bg-gray-200" />
          <Skeleton className="h-4 w-64 bg-gray-200" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-24 mb-3 bg-gray-200" />
              <Skeleton className="h-11 w-full max-w-[280px] bg-gray-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2 bg-gray-200" />
          <Skeleton className="h-4 w-48 bg-gray-200" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-3 rounded-lg bg-gray-100">
                <Skeleton className="h-3 w-24 mb-2 bg-gray-200" />
                <Skeleton className="h-5 w-32 bg-gray-200" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
