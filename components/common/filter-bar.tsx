"use client"

import { useState, useEffect } from "react"
import { Search, X, Calendar as CalendarIcon, ChevronDown } from "lucide-react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"

export type FilterType = "search" | "select" | "multiselect" | "daterange"

export interface FilterOption {
  label: string
  value: string
}

export interface FilterConfig {
  id: string
  type: FilterType
  label: string
  placeholder?: string
  options?: FilterOption[]
  defaultValue?: string | string[] | { from?: Date; to?: Date }
}

export interface FilterBarProps {
  filters: FilterConfig[]
  onFilterChange: (filters: Record<string, any>) => void
  onPageSizeChange?: (pageSize: number) => void
  defaultPageSize?: number
  showPageSize?: boolean
  searchPlaceholder?: string
  className?: string
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 50, 100]

export function FilterBar({
  filters,
  onFilterChange,
  onPageSizeChange,
  defaultPageSize = 10,
  showPageSize = true,
  searchPlaceholder = "Search...",
  className = "",
}: FilterBarProps) {
  // Initialize filter values
  const initialValues: Record<string, any> = {}
  filters.forEach((filter) => {
    initialValues[filter.id] = filter.defaultValue || (filter.type === "multiselect" ? [] : "")
  })

  const [filterValues, setFilterValues] = useState<Record<string, any>>(initialValues)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  // Check if any filter is active
  const hasActiveFilters = Object.entries(filterValues).some(([key, value]) => {
    const filter = filters.find((f) => f.id === key)
    if (!filter) return false
    
    if (filter.type === "multiselect") {
      return Array.isArray(value) && value.length > 0
    }
    if (filter.type === "search") {
      return value && value.trim() !== ""
    }
    return value && value !== "" && value !== "all"
  })

  // Notify parent when filters change
  useEffect(() => {
    onFilterChange(filterValues)
  }, [filterValues, onFilterChange])

  const handleFilterChange = (filterId: string, value: any) => {
    setFilterValues((prev) => ({
      ...prev,
      [filterId]: value,
    }))
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    onPageSizeChange?.(newPageSize)
  }

  const clearAllFilters = () => {
    const clearedValues: Record<string, any> = {}
    filters.forEach((filter) => {
      clearedValues[filter.id] = filter.type === "multiselect" ? [] : ""
    })
    setFilterValues(clearedValues)
  }

  const searchFilter = filters.find((f) => f.type === "search")
  const otherFilters = filters.filter((f) => f.type !== "search")

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Filters</CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-8">
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          {searchFilter && (
            <div className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <input
                  type="text"
                  placeholder={searchFilter.placeholder || searchPlaceholder}
                  value={filterValues[searchFilter.id] || ""}
                  onChange={(e) => handleFilterChange(searchFilter.id, e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                {filterValues[searchFilter.id] && (
                  <button
                    onClick={() => handleFilterChange(searchFilter.id, "")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Other Filters */}
          {otherFilters.map((filter) => {
            if (filter.type === "select") {
              return (
                <div key={filter.id} className="w-full md:w-auto">
                  <Select
                    value={filterValues[filter.id] || filter.defaultValue || ""}
                    onValueChange={(value) => handleFilterChange(filter.id, value)}
                  >
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder={filter.placeholder || filter.label} />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            }

            if (filter.type === "multiselect") {
              const selectedValues = (filterValues[filter.id] || []) as string[]
              const selectedCount = selectedValues.length
              const displayText =
                selectedCount === 0
                  ? filter.placeholder || filter.label
                  : selectedCount === 1
                    ? filter.options?.find((opt) => opt.value === selectedValues[0])?.label || `${selectedCount} selected`
                    : `${selectedCount} selected`

              return (
                <div key={filter.id} className="w-full md:w-auto">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full md:w-[200px] justify-between text-left font-normal"
                      >
                        <span className={selectedCount === 0 ? "text-muted-foreground" : ""}>
                          {displayText}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                      <div className="max-h-[300px] overflow-y-auto p-2">
                        {filter.options?.map((option) => {
                          const isSelected = selectedValues.includes(option.value)
                          return (
                            <div
                              key={option.value}
                              className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                              onClick={() => {
                                const newValues = isSelected
                                  ? selectedValues.filter((v) => v !== option.value)
                                  : [...selectedValues, option.value]
                                handleFilterChange(filter.id, newValues)
                              }}
                            >
                              <Checkbox checked={isSelected} />
                              <label className="text-sm font-normal cursor-pointer flex-1">
                                {option.label}
                              </label>
                            </div>
                          )
                        })}
                      </div>
                      {selectedCount > 0 && (
                        <div className="border-t p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => handleFilterChange(filter.id, [])}
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              )
            }

            if (filter.type === "daterange") {
              const dateRange = filterValues[filter.id] as { from?: Date; to?: Date } | undefined
              const displayText = dateRange?.from
                ? dateRange.to
                  ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                  : format(dateRange.from, "LLL dd, y")
                : filter.placeholder || "Pick a date range"

              // Convert to DateRange format for Calendar component
              const calendarRange = dateRange?.from
                ? { from: dateRange.from, to: dateRange.to }
                : undefined

              return (
                <div key={filter.id} className="w-full md:w-auto">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full md:w-[280px] justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className={!dateRange?.from ? "text-muted-foreground" : ""}>
                          {displayText}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={calendarRange}
                        onSelect={(range) => {
                          handleFilterChange(filter.id, range ? { from: range.from, to: range.to } : {})
                        }}
                        numberOfMonths={2}
                      />
                      {dateRange?.from && (
                        <div className="border-t p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => handleFilterChange(filter.id, {})}
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              )
            }

            return null
          })}

          {/* Page Size Selector */}
          {showPageSize && (
            <div className="w-full md:w-auto">
              <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                <SelectTrigger className="w-full md:w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} per page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

