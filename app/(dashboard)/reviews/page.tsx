"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Search, ChevronLeft, ChevronRight, Trash2, Star, Edit2, Plus } from "lucide-react"

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

const ITEMS_PER_PAGE = 8

export default function ReviewsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending">("all")
  const [ratingFilter, setRatingFilter] = useState<"all" | number>("all")
  const [reviews, setReviews] = useState(mockReviews)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    customer: "",
    product: "",
    rating: 5,
    comment: "",
    status: "pending" as const,
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

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleAdd = () => {
    setEditingId(null)
    setFormData({ customer: "", product: "", rating: 5, comment: "", status: "pending" })
    setIsOpen(true)
  }

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

  const handleDelete = (id: string) => {
    setReviews(reviews.filter((r) => r.id !== id))
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
        <Button onClick={handleAdd}>
          <Plus size={16} className="mr-2" /> Add Review
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
            <p className="text-xs text-muted-foreground">Total customer reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating}/5</div>
            <p className="text-xs text-muted-foreground">Overall customer satisfaction</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedCount}</div>
            <p className="text-xs text-muted-foreground">Approved reviews</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by customer or product..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any)
                setCurrentPage(1)
              }}
              className="px-4 py-2 rounded-lg border border-border bg-background"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value === "all" ? "all" : Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-4 py-2 rounded-lg border border-border bg-background"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reviews List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paginatedData.map((review) => (
              <div key={review.id} className="border-b border-border pb-4 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{review.customer}</p>
                    <p className="text-sm text-muted-foreground">
                      {review.product} • {review.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>{renderStars(review.rating)}</div>
                    <Badge variant={review.status === "approved" ? "default" : "secondary"}>
                      {review.status === "approved" ? "Approved" : "Pending"}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm mb-3">{review.comment}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(review)}>
                    <Edit2 size={14} className="mr-2" /> Edit
                  </Button>
                  {review.status === "pending" && (
                    <Button size="sm" onClick={() => handleApprove(review.id)}>
                      Approve
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(review.id)}
                    className="text-destructive"
                  >
                    <Trash2 size={14} className="mr-2" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {paginatedData.length ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                <Button
                  key={i + 1}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit review dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Review" : "Add New Review"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Customer Name</label>
              <input
                type="text"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Product/Service</label>
              <input
                type="text"
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Rating</label>
              <select
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: Number.parseInt(e.target.value) })}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
              >
                <option value="1">1 Star</option>
                <option value="2">2 Stars</option>
                <option value="3">3 Stars</option>
                <option value="4">4 Stars</option>
                <option value="5">5 Stars</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Comment</label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editingId ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
