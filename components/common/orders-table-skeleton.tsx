import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function OrdersTableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-32 mb-2 bg-gray-200" />
          <Skeleton className="h-5 w-64 bg-gray-200" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-gray-200" />
                  <Skeleton className="h-8 w-12 bg-gray-200" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full bg-gray-200" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Section Skeleton */}
      <Card>
        <CardContent className="px-5 py-4">
          <div className="flex items-end justify-between gap-3">
            <Skeleton className="h-10 w-full max-w-md bg-gray-200" />
            <div className="flex items-end gap-2">
              <Skeleton className="h-10 w-48 bg-gray-200" />
              <Skeleton className="h-10 w-32 bg-gray-200" />
              <Skeleton className="h-10 w-32 bg-gray-200" />
              <Skeleton className="h-10 w-32 bg-gray-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Skeleton */}
      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <th key={i} className="text-left py-3 px-4">
                      <Skeleton className="h-4 w-20 bg-gray-200" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((row) => (
                  <tr key={row} className="border-b border-border">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((cell) => (
                      <td key={cell} className="py-3 px-4">
                        <Skeleton className="h-4 w-full bg-gray-200" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Skeleton */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <Skeleton className="h-4 w-32 bg-gray-200" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 bg-gray-200" />
              <Skeleton className="h-9 w-9 bg-gray-200" />
              <Skeleton className="h-9 w-9 bg-gray-200" />
              <Skeleton className="h-9 w-9 bg-gray-200" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

