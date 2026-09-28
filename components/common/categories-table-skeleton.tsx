import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const COLUMNS = ["Image", "Category", "Status", "Order", "Description", "Actions"]

export function CategoriesTableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-36 mb-2 bg-gray-200" />
          <Skeleton className="h-5 w-64 bg-gray-200" />
        </div>
        <Skeleton className="h-9 w-32 bg-gray-200" />
      </div>

      <Card>
        <CardContent className="px-5">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-10 w-full max-w-md bg-gray-200" />
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-none">
              <Skeleton className="h-10 w-40 bg-gray-200" />
              <Skeleton className="h-10 w-32 bg-gray-200" />
              <Skeleton className="h-10 w-24 bg-gray-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  {COLUMNS.map((col) => (
                    <th key={col} className="text-left py-3 px-4 font-semibold">
                      <Skeleton className="h-4 w-24 bg-gray-200" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-border">
                    <td className="py-3 px-4">
                      <Skeleton className="h-14 w-14 rounded bg-gray-200" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-40 bg-gray-200" />
                      <Skeleton className="mt-2 h-3 w-28 bg-gray-200" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-6 w-20 rounded-full bg-gray-200" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-12 bg-gray-200" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-7 w-16 rounded bg-gray-200" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-8 rounded bg-gray-200" />
                        <Skeleton className="h-8 w-8 rounded bg-gray-200" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
