"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trash2, Star, Edit2, Plus, X, MessageSquare, CheckCircle, Eye } from "lucide-react"
import { SearchInput } from "@/components/common/search-input"
import { SelectFilter } from "@/components/common/select-filter"
import { InfoCard } from "@/components/common/info-card"
import { ReviewModal } from "@/components/common/review-modal"
import { Pagination } from "@/components/common/pagination"
import { ConfirmationModal } from "@/components/common/confirmation-modal"

interface Review {
  id: string
  customer: string
  product: string
  rating: number
  comment: string
  status: "approved" | "pending"
  date: string
}

const mockReviews: Review[] = [
  {
    id: "R001",
    customer: "John Smith",
    product: "Plumbing Repair",
    rating: 5,
    comment: "Excellent service, very professional",
    status: "approved",
    date: "2024-02-15",
  },
  {
    id: "R002",
    customer: "Sarah Johnson",
    product: "Electrical Wiring",
    rating: 4,
    comment: "Good work, arrived on time",
    status: "approved",
    date: "2024-02-14",
  },
  {
    id: "R003",
    customer: "Michael Brown",
    product: "Carpentry Work",
    rating: 5,
    comment: "Amazing quality and attention to detail",
    status: "approved",
    date: "2024-02-13",
  },
  {
    id: "R004",
    customer: "Emily Davis",
    product: "Painting",
    rating: 3,
    comment: "Decent job but could be better",
    status: "pending",
    date: "2024-02-12",
  },
  {
    id: "R005",
    customer: "David Wilson",
    product: "Plumbing Repair",
    rating: 4,
    comment: "Professional and courteous",
    status: "approved",
    date: "2024-02-11",
  },
  {
    id: "R006",
    customer: "Jessica Miller",
    product: "Electrical Installation",
    rating: 5,
    comment: "Outstanding service!",
    status: "pending",
    date: "2024-02-10",
  },
]

export default function ReviewsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending">("all")
  const [ratingFilter, setRatingFilter] = useState<"all" | number>("all")

  // Check if any filters are active
  const hasActiveFilters = searchTerm !== "" || statusFilter !== "all" || ratingFilter !== "all"

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setRatingFilter("all")
    setCurrentPage(1)
  }
  const [reviews, setReviews] = useState(mockReviews)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewingComment, setViewingComment] = useState<{ comment: string; customer: string } | null>(null)
  const [formData, setFormData] = useState({
    customer: "",
    product: "",
    rating: 5,
    comment: "",
    status: "pending" as "approved" | "pending",
  })

  const filtered = useMemo(() => {
    return reviews.filter((review) => {
      const matchesSearch =
        review.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.product.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || review.status === statusFilter
      const matchesRating = ratingFilter === "all" || review.rating === ratingFilter
      return matchesSearch && matchesStatus && matchesRating
    })
  }, [searchTerm, statusFilter, ratingFilter, reviews])

  const stats = {
    totalReviews: reviews.length,
    averageRating: (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1),
    approvedCount: reviews.filter((r) => r.status === "approved").length,
  }

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleEdit = (review: Review) => {
    setEditingId(review.id)
    setFormData({
      customer: review.customer,
      product: review.product,
      rating: review.rating,
      comment: review.comment,
      status: review.status,
    })
    setIsOpen(true)
  }

  const handleSave = () => {
    if (!formData.customer || !formData.comment) return

    if (editingId) {
      setReviews(
        reviews.map((r) =>
          r.id === editingId ? { ...r, ...formData, id: editingId, date: new Date().toISOString().split("T")[0] } : r,
        ),
      )
    } else {
      const newReview: Review = {
        ...formData,
        id: `R${Date.now().toString().slice(-3)}`,
        date: new Date().toISOString().split("T")[0],
      }
      setReviews([...reviews, newReview])
    }
    setIsOpen(false)
  }

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
  }

  const handleDeleteConfirm = () => {
    if (deletingId) {
      setReviews(reviews.filter((r) => r.id !== deletingId))
      setDeletingId(null)
    }
  }

  const handleApprove = (id: string) => {
    setReviews(reviews.map((r) => (r.id === id ? { ...r, status: "approved" as const } : r)))
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Reviews & Ratings</h1>
          <p className="text-muted-foreground">Manage customer reviews and ratings</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <InfoCard
          icon={MessageSquare}
          label="Total Reviews"
          value={stats.totalReviews.toString()}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
        />
        <InfoCard
          icon={Star}
          label="Average Rating"
          value={`${stats.averageRating}/5`}
          iconColor="text-yellow-500"
          iconBgColor="bg-yellow-500/10"
        />
        <InfoCard
          icon={CheckCircle}
          label="Approved"
          value={stats.approvedCount.toString()}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
        />
      </div>

      {/* Custom Filter Section */}
      <Card>
        <CardContent className="px-5">
          <div className="flex items-end justify-between gap-3">
            {/* Left Side - Search Input */}
            <SearchInput
              value={searchTerm}
              onChange={(value) => {
                setSearchTerm(value)
                setCurrentPage(1)
              }}
              placeholder="Search by customer or product..."
            />

            {/* Right Side - Status Filter, Rating Filter, Page Size, and Clear Button */}
            <div className="flex items-end gap-2">
              {/* Status Filter */}
              <SelectFilter
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value as "all" | "approved" | "pending")
                  setCurrentPage(1)
                }}
                options={[
                  { value: "all", label: "All Status" },
                  { value: "approved", label: "Approved" },
                  { value: "pending", label: "Pending" },
                ]}
                label="Status"
                placeholder="All Status"
              />

              {/* Rating Filter */}
              <SelectFilter
                value={ratingFilter === "all" ? "all" : ratingFilter.toString()}
                onChange={(value) => {
                  setRatingFilter(value === "all" ? "all" : Number(value))
                  setCurrentPage(1)
                }}
                options={[
                  { value: "all", label: "All Ratings" },
                  { value: "5", label: "5 Stars" },
                  { value: "4", label: "4 Stars" },
                  { value: "3", label: "3 Stars" },
                  { value: "2", label: "2 Stars" },
                  { value: "1", label: "1 Star" },
                ]}
                label="Rating"
                placeholder="All Ratings"
              />

              {/* Page Size */}
              <SelectFilter
                value={pageSize.toString()}
                onChange={(value) => {
                  setPageSize(Number(value))
                  setCurrentPage(1)
                }}
                options={[
                  { value: "5", label: "5" },
                  { value: "10", label: "10" },
                  { value: "20", label: "20" },
                  { value: "50", label: "50" },
                ]}
                label="Page Size"
                width="w-[140px]"
              />

              {/* Clear Filters Button - Only show when filters are active */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="gap-2 cursor-pointer"
                >
                  <X size={16} />
                  Clear
                </Button>
              )}
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
                  <th className="text-left py-3 px-4 font-semibold">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold">Category</th>
                  <th className="text-left py-3 px-4 font-semibold">Rating</th>
                  <th className="text-left py-3 px-4 font-semibold">Comment</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((review) => (
                  <tr key={review.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <p className="font-semibold">{review.customer}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-muted-foreground">{review.product}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                        <span className="text-xs text-muted-foreground ml-1">({review.rating})</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingComment({ comment: review.comment, customer: review.customer })}
                          className="cursor-pointer shrink-0 h-7 px-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground"
                        >
                          Show
                        </Button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-muted-foreground">{review.date}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={review.status === "approved" ? "default" : "secondary"}>
                        {review.status === "approved" ? "Approved" : "Pending"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(review)} className="cursor-pointer shrink-0">
                          <Edit2 size={14} />
                        </Button>
                        {review.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(review.id)}
                            className="cursor-pointer shrink-0"
                          >
                            <CheckCircle size={14} />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(review.id)}
                          className="text-destructive cursor-pointer shrink-0"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filtered.length}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Review Modal */}
      <ReviewModal
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsOpen(false)
            setEditingId(null)
            setFormData({ customer: "", product: "", rating: 5, comment: "", status: "pending" })
          } else {
            setIsOpen(open)
          }
        }}
        formData={formData}
        onFormDataChange={setFormData}
        onSave={handleSave}
        onCancel={() => {
          setIsOpen(false)
          setEditingId(null)
          setFormData({ customer: "", product: "", rating: 5, comment: "", status: "pending" })
        }}
        isEditing={!!editingId}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={!!deletingId}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingId(null)
          }
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Review?"
        description="Are you sure you want to delete this review? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Comment View Dialog */}
      <Dialog open={!!viewingComment} onOpenChange={(open) => !open && setViewingComment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Comment - {viewingComment?.customer}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {viewingComment?.comment}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
