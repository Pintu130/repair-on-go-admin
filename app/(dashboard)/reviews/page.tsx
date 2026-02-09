"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trash2, Star, Edit2, Plus, X, MessageSquare, CheckCircle, Eye, Loader2 } from "lucide-react"
import { SearchInput } from "@/components/common/search-input"
import { SelectFilter } from "@/components/common/select-filter"
import { InfoCard } from "@/components/common/info-card"
import { ReviewModal } from "@/components/common/review-modal"
import { Pagination } from "@/components/common/pagination"
import { ConfirmationModal } from "@/components/common/confirmation-modal"
import { useGetReviewsQuery, useCreateReviewMutation, useUpdateReviewMutation, useDeleteReviewMutation, useUpdateReviewStatusMutation, type Review } from "@/lib/store/api/reviewsApi"
import { useToast } from "@/hooks/use-toast"

export default function ReviewsPage() {
  // Fetch reviews from Firebase
  const { data, isLoading, isError, error, refetch } = useGetReviewsQuery()
  const [createReview, { isLoading: isCreating }] = useCreateReviewMutation()
  const [updateReview, { isLoading: isUpdating }] = useUpdateReviewMutation()
  const [deleteReview, { isLoading: isDeleting }] = useDeleteReviewMutation()
  const [updateReviewStatus, { isLoading: isUpdatingStatus }] = useUpdateReviewStatusMutation()
  const { toast } = useToast()

  // Extract reviews from API response or use empty array
  const reviews = data?.reviews || []
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
    city: "",
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

  const stats = useMemo(() => {
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : "0.0"
    const approvedCount = reviews.filter((r) => r.status === "approved").length
    
    return {
      totalReviews,
      averageRating,
      approvedCount,
    }
  }, [reviews])

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
      city: review.city || "",
    })
    setIsOpen(true)
  }

  const handleSave = async () => {
    if (!formData.customer || !formData.comment) {
      toast({
        title: "Validation Error",
        description: "Customer name and comment are required.",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingId) {
        await updateReview({
          reviewId: editingId,
          reviewData: {
            ...formData,
            date: new Date().toISOString().split("T")[0],
          },
        }).unwrap()

        toast({
          title: "Review Updated Successfully! ✅",
          description: "Review has been updated successfully.",
        })
      } else {
        await createReview({
          ...formData,
          date: new Date().toISOString().split("T")[0],
        }).unwrap()

        toast({
          title: "Review Created Successfully! 🎉",
          description: "Review has been added successfully.",
        })
      }

      setIsOpen(false)
      setEditingId(null)
      setFormData({ customer: "", product: "", rating: 5, comment: "", status: "pending", city: "" })
      refetch()
    } catch (error: any) {
      console.error("❌ Error saving review:", error)

      const errorMessage =
        error?.data?.error ||
        error?.data?.data ||
        error?.message ||
        "Failed to save review. Please try again."

      toast({
        title: "Failed to Save Review",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingId) return

    try {
      await deleteReview(deletingId).unwrap()

      toast({
        title: "Review Deleted Successfully! ✅",
        description: "Review has been deleted successfully.",
      })

      setDeletingId(null)
      refetch()
    } catch (error: any) {
      console.error("❌ Error deleting review:", error)

      const errorMessage =
        error?.data?.error ||
        error?.data?.data ||
        error?.message ||
        "Failed to delete review. Please try again."

      toast({
        title: "Failed to Delete Review",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await updateReviewStatus({ reviewId: id, status: "approved" }).unwrap()

      toast({
        title: "Review Approved Successfully! ✅",
        description: "Review status has been updated to approved.",
      })

      refetch()
    } catch (error: any) {
      console.error("❌ Error approving review:", error)

      const errorMessage =
        error?.data?.error ||
        error?.data?.data ||
        error?.message ||
        "Failed to approve review. Please try again."

      toast({
        title: "Failed to Approve Review",
        description: errorMessage,
        variant: "destructive",
      })
    }
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
        <Button onClick={() => setIsOpen(true)} className="cursor-pointer">
          <Plus size={16} className="mr-2" /> Add Review
        </Button>
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-destructive">Error loading reviews. Please try again.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold">City</th>
                    <th className="text-left py-3 px-4 font-semibold">Category</th>
                    <th className="text-left py-3 px-4 font-semibold">Rating</th>
                    <th className="text-left py-3 px-4 font-semibold">Comment</th>
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        No reviews found. Click "Add Review" to create your first review.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((review) => {
                  const fullName =
                    review.customerFirstName && review.customerLastName
                      ? `${review.customerFirstName} ${review.customerLastName}`
                      : review.customer

                  const getInitials = () => {
                    if (review.customerFirstName && review.customerLastName) {
                      return `${review.customerFirstName.charAt(0)}${review.customerLastName.charAt(0)}`.toUpperCase()
                    }
                    return review.customer.charAt(0).toUpperCase()
                  }

                  return (
                    <tr key={review.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-8 w-8 shrink-0">
                            {review.customerAvatar && (
                              <AvatarImage src={review.customerAvatar} alt={fullName} />
                            )}
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                              {getInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium truncate capitalize">{fullName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-muted-foreground truncate">{review.city || "—"}</p>
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
                              disabled={isUpdatingStatus}
                            >
                              {isUpdatingStatus ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <CheckCircle size={14} />
                              )}
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
                    )
                  }))}
                </tbody>
              </table>
            </div>
          )}

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
            setFormData({ customer: "", product: "", rating: 5, comment: "", status: "pending", city: "" })
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
          setFormData({ customer: "", product: "", rating: 5, comment: "", status: "pending", city: "" })
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
        isLoading={isDeleting}
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
