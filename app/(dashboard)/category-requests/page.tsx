"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, MapPin, Search, Loader2, TrendingUp, Users, Globe } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { useGetCategoryRequestsQuery, useDeleteAllCategoryRequestsMutation, type CategoryRequest } from "@/lib/store/api/categoryRequestsApi"
import { SearchInput } from "@/components/common/search-input"
import { Pagination } from "@/components/common/pagination"
import { ConfirmationModal } from "@/components/common/confirmation-modal"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
    requests.forEach((req) => {
      const query = req.query.toLowerCase().trim()
      if (query) {
        queryCounts[query] = (queryCounts[query] || 0) + 1
      }
    })
    const topQueries = Object.entries(queryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([query, count]) => ({ query, count }))

    // Total unique queries
    const uniqueQueries = new Set(requests.map((r) => r.query.toLowerCase().trim())).size

    return {
      topQueryLocations,
      topQueries,
      totalRequests: requests.length,
      uniqueQueries,
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <p className="text-2xl font-bold">{stats.totalRequests}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <p className="text-2xl font-bold">{stats.uniqueQueries}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Combinations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <p className="text-2xl font-bold">{stats.topQueryLocations.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <p className="text-2xl font-bold">{stats.topQueries.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BarChart for Top Queries */}
        {stats.topQueries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Searched Queries</CardTitle>
              <p className="text-sm text-muted-foreground">
                Most popular search queries (recommendations for new categories)
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={stats.topQueries.map((item) => ({
                    name: item.query.length > 20 ? `${item.query.substring(0, 20)}...` : item.query,
                    fullQuery: item.query,
                    searches: item.count,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold mb-1">{data.fullQuery}</p>
                            <p className="text-sm font-medium">
                              <span className="text-primary">{data.searches}</span> searches
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="searches"
                    fill="#3B82F6"
                    radius={[8, 8, 0, 0]}
                    name="Number of Searches"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* BarChart for Query + Location Combinations */}
        {stats.topQueryLocations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Query & Location Combinations</CardTitle>
              <p className="text-sm text-muted-foreground">
                Most searched queries with their locations
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={stats.topQueryLocations.slice(0, 10).map((item) => ({
                    name: `${item.query.substring(0, 12)}${item.query.length > 12 ? "..." : ""}\n${item.city.substring(0, 10)}${item.city.length > 10 ? "..." : ""}`,
                    query: item.query,
                    city: item.city,
                    region: item.region,
                    searches: item.count,
                    fullLabel: `${item.query} - ${item.city}`,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold mb-1">{data.query}</p>
                            <p className="text-sm text-muted-foreground mb-1">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {data.city}, {data.region}
                            </p>
                            <p className="text-sm font-medium">
                              <span className="text-primary">{data.searches}</span> searches
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="searches"
                    fill="#ED2C2C"
                    radius={[8, 8, 0, 0]}
                    name="Number of Searches"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Query + Location Combination Cards */}
      {stats.topQueryLocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Query & Location Combinations (Recommendations)</CardTitle>
            <p className="text-sm text-muted-foreground">
              Most searched queries with their locations - Click on location to view map
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.topQueryLocations.map((item, index) => (
                <Card
                  key={`${item.query}-${item.city}-${index}`}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    if (item.lat && item.lon) {
                      handleLocationClick({
                        city: item.city,
                        region: item.region,
                        country: item.country,
                        countryCode: "",
                        ip: "",
                        lat: item.lat,
                        lon: item.lon,
                        pincode: item.pincode,
                        timezone: "",
                      })
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Search className="h-4 w-4 text-primary shrink-0" />
                          <p className="font-semibold text-sm truncate">{item.query}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{item.city}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.region}, {item.country}
                            </p>
                            {item.pincode && (
                              <p className="text-xs text-muted-foreground">{item.pincode}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        #{index + 1}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{item.count}</span> searches
                      </p>
                      {item.lat && item.lon && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLocationClick({
                              city: item.city,
                              region: item.region,
                              country: item.country,
                              countryCode: "",
                              ip: "",
                              lat: item.lat,
                              lon: item.lon,
                              pincode: item.pincode,
                              timezone: "",
                            })
                          }}
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          Map
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by query, user, email, or location..."
          label="Search Requests"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setSearchTerm("")}
            disabled={!searchTerm}
            className="cursor-pointer"
          >
            Clear
          </Button>
        </div>
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
                      <TableHead>User</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="font-semibold">{request.query}</div>
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
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLocationClick(request.location)}
                            className="cursor-pointer"
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            View Map
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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

      {/* Map Dialog */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Location on Map</DialogTitle>
            <DialogDescription>
              {selectedLocation && (
                <>
                  {selectedLocation.city}, {selectedLocation.region}, {selectedLocation.country}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedLocation && (
            <div className="w-full h-[400px] rounded-lg overflow-hidden border">
              {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${selectedLocation.lat},${selectedLocation.lon}&zoom=15`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <div className="text-center p-4">
                    <MapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">
                      {selectedLocation.city}, {selectedLocation.region}
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {selectedLocation.country} - {selectedLocation.pincode}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Coordinates: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable map view
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 cursor-pointer"
                      onClick={() => {
                        window.open(
                          `https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lon}`,
                          "_blank"
                        )
                      }}
                    >
                      Open in Google Maps
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
