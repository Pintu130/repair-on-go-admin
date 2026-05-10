"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronFirst, ChevronLast } from "lucide-react"

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

  const handleFirst = () => {
    onPageChange(1)
  }

  const handleLast = () => {
    onPageChange(totalPages)
  }

  // Generate page numbers with ellipsis logic
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = []
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      // Calculate start and end of visible range around current page
      let start = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2))
      let end = Math.min(totalPages - 1, start + maxVisiblePages - 3)
      
      // Adjust if we're near the end
      if (end - start < maxVisiblePages - 3) {
        start = Math.max(2, end - (maxVisiblePages - 3) + 1)
      }
      
      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('...')
      } else if (start === 2) {
        // No ellipsis needed, just add page 2
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('...')
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 ${className}`}>
      <p className="text-sm text-muted-foreground">
        Showing {startItem.toLocaleString()} to {endItem.toLocaleString()} of {totalItems.toLocaleString()}
      </p>
      <div className="flex items-center gap-1">
        {/* First Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleFirst}
          disabled={currentPage === 1}
          className="cursor-pointer px-2"
          title="First Page"
        >
          <ChevronFirst size={16} />
        </Button>
        
        {/* Previous */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="cursor-pointer px-2"
        >
          <ChevronLeft size={16} />
        </Button>
        
        {/* Page Numbers */}
        <div className="flex gap-1 mx-1">
          {pageNumbers.map((pageNum, index) => (
            pageNum === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 py-1 text-sm text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum as number)}
                className="cursor-pointer min-w-[36px]"
              >
                {pageNum}
              </Button>
            )
          ))}
        </div>
        
        {/* Next */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentPage === totalPages || totalPages === 0}
          className="cursor-pointer px-2"
        >
          <ChevronRight size={16} />
        </Button>
        
        {/* Last Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLast}
          disabled={currentPage === totalPages || totalPages === 0}
          className="cursor-pointer px-2"
          title="Last Page"
        >
          <ChevronLast size={16} />
        </Button>
      </div>
      
      {/* Page Info */}
      <p className="text-sm text-muted-foreground">
        Page {currentPage.toLocaleString()} of {totalPages.toLocaleString()}
      </p>
    </div>
  )
}

