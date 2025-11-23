"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  className?: string
  maxVisiblePages?: number
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  className = "",
  maxVisiblePages = 5,
}: PaginationProps) {
  const startItem = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const handlePrevious = () => {
    onPageChange(Math.max(1, currentPage - 1))
  }

  const handleNext = () => {
    onPageChange(Math.min(totalPages, currentPage + 1))
  }

  const visiblePages = Math.min(maxVisiblePages, totalPages)
  const pageNumbers = Array.from({ length: visiblePages }, (_, i) => i + 1)

  return (
    <div className={`flex items-center justify-between mt-6 ${className}`}>
      <p className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalItems}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="cursor-pointer"
        >
          <ChevronLeft size={16} />
        </Button>
        {pageNumbers.map((pageNum) => (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            className="cursor-pointer"
          >
            {pageNum}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="cursor-pointer"
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}

