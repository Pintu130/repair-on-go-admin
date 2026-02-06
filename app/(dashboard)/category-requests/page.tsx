"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, MapPin, Search, Loader2, TrendingUp, Users, Globe, Repeat } from "lucide-react"
import { useGetCategoryRequestsQuery, useDeleteAllCategoryRequestsMutation, type CategoryRequest } from "@/lib/store/api/categoryRequestsApi"
import { SearchInput } from "@/components/common/search-input"
import { Pagination } from "@/components/common/pagination"
import { ConfirmationModal } from "@/components/common/confirmation-modal"
import { InfoCard } from "@/components/common/info-card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function CategoryRequestsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<CategoryRequest["location"] | null>(null)
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Fetch category requests from Firebase
  const { data: requestsData, isLoading, error, refetch } = useGetCategoryRequestsQuery()
  const [deleteAllRequests, { isLoading: isDeleting }] = useDeleteAllCategoryRequestsMutation()

  const requests: CategoryRequest[] = requestsData?.requests || []

  // Filter requests based on search term
  const filtered = useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch =
        request.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.location.region.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
  }, [searchTerm, requests])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Query match count: har query kitni baar aayi (table column ke liye)
  const queryMatchCount = useMemo(() => {
    const map: Record<string, number> = {}
    requests.forEach((r) => {
      const q = r.query.toLowerCase().trim()
      map[q] = (map[q] || 0) + 1
    })
    return map
  }, [requests])

  // Calculate statistics for cards
  const stats = useMemo(() => {
    // Most common query + location combinations
    const queryLocationCounts: Record<string, {
      query: string
      city: string
      region: string
      country: string
      pincode: string
      lat: number
      lon: number
      count: number
    }> = {}
    
    requests.forEach((req) => {
      const query = req.query.toLowerCase().trim()
      const city = req.location.city || "Unknown"
      const region = req.location.region || "Unknown"
      const key = `${query}-${city}-${region}`
      
      if (!queryLocationCounts[key] && query) {
        queryLocationCounts[key] = {
          query: req.query, // Keep original case
          city,
          region,
          country: req.location.country || "",
          pincode: req.location.pincode || "",
          lat: req.location.lat || 0,
          lon: req.location.lon || 0,
          count: 0,
        }
      }
      if (queryLocationCounts[key]) {
        queryLocationCounts[key].count++
      }
    })
    
    const topQueryLocations = Object.values(queryLocationCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Most common queries (for stats)
    const queryCounts: Record<string, number> = {}
    const queryToOriginal: Record<string, string> = {}
    requests.forEach((req) => {
      const query = req.query.toLowerCase().trim()
      if (query) {
        queryCounts[query] = (queryCounts[query] || 0) + 1
        if (!queryToOriginal[query]) queryToOriginal[query] = req.query
      }
    })
    const topQueries = Object.entries(queryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([query, count]) => ({ query, count }))

    // Total unique queries
    const uniqueQueries = new Set(requests.map((r) => r.query.toLowerCase().trim())).size

    // Query match breakdown: har query kitni baar search hua (sorted by count desc)
    const queryMatchBreakdown = Object.entries(queryCounts)
      .map(([q, count]) => ({ query: queryToOriginal[q] || q, count }))
      .sort((a, b) => b.count - a.count)

    // Total matched (repeated) searches: jitni baar same query dobara search hua
    const totalMatchedRepeats = Object.values(queryCounts).reduce(
      (sum, count) => sum + (count > 1 ? count - 1 : 0),
      0
    )

    return {
      topQueryLocations,
      topQueries,
      totalRequests: requests.length,
      uniqueQueries,
      queryMatchBreakdown,
      totalMatchedRepeats,
      queryCounts, // lowercase query -> count (for table column)
    }
  }, [requests])

  const handleDeleteAll = async () => {
    try {
      await deleteAllRequests().unwrap()
      setIsDeleteOpen(false)
      refetch()
    } catch (error) {
      console.error("Error deleting requests:", error)
    }
  }

  const handleLocationClick = (location: CategoryRequest["location"]) => {
    setSelectedLocation(location)
    setIsMapOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading category requests...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <p className="text-destructive text-lg font-semibold">Error loading category requests</p>
          <Button onClick={() => refetch()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-balance">Category Requests</h1>
          <p className="text-muted-foreground">View user search queries and location data to identify new category demands</p>
        </div>
        <Button
          variant="destructive"
          onClick={() => setIsDeleteOpen(true)}
          disabled={requests.length === 0 || isDeleting}
          className="cursor-pointer"
        >
          {isDeleting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete All
            </>
          )}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard
          icon={Search}
          label="Total Requests"
          value={stats.totalRequests.toString()}
          iconColor="text-primary"
          iconBgColor="bg-primary/10"
        />
        <InfoCard
          icon={Repeat}
          label="Matched (Repeated)"
          value={stats.totalMatchedRepeats.toString()}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-500/10"
        />
        <InfoCard
          icon={TrendingUp}
          label="Unique Queries"
          value={stats.uniqueQueries.toString()}
          iconColor="text-primary"
          iconBgColor="bg-primary/10"
        />
        <InfoCard
          icon={Globe}
          label="Top Combinations"
          value={stats.topQueryLocations.length.toString()}
          iconColor="text-primary"
          iconBgColor="bg-primary/10"
        />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by query, user, email, or location..."
          label="Search Requests"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <p className="text-sm text-muted-foreground">
            Showing {paginatedData.length} of {filtered.length} requests
          </p>
        </CardHeader>
        <CardContent>
          {paginatedData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No requests found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Query</TableHead>
                      <TableHead className="w-24 text-center">Match count</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((request) => {
                      const count = stats.queryCounts[request.query.toLowerCase().trim()] ?? 1
                      return (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="font-semibold">{request.query}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={count > 1 ? "default" : "secondary"}>{count}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.userName}</div>
                            <div className="text-sm text-muted-foreground">{request.userEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium text-sm">{request.location.city}</div>
                              <div className="text-xs text-muted-foreground">
                                {request.location.region}, {request.location.country}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {request.location.pincode}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(request.date || request.timestamp).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(request.date || request.timestamp).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={filtered.length}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteAll}
        title="Delete All Category Requests?"
        description={`Are you sure you want to delete all ${requests.length} category requests? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  )
}
