"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"

interface DateRangeFilterProps {
  value?: { from?: Date; to?: Date }
  onChange: (range: { from?: Date; to?: Date } | undefined) => void
  onClear?: () => void
  placeholder?: string
  className?: string
}

export function DateRangeFilter({
  value,
  onChange,
  onClear,
  placeholder = "Pick a date range",
  className,
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false)
  const [tempRange, setTempRange] = useState<DateRange | undefined>(
    value?.from ? { from: value.from, to: value.to } : undefined
  )

  // Sync tempRange with value prop when it changes externally (e.g., from Clear button)
  useEffect(() => {
    if (value?.from) {
      setTempRange({ from: value.from, to: value.to })
    } else {
      setTempRange(undefined)
    }
  }, [value])

  const displayText = value?.from
    ? value.to
      ? `${format(value.from, "dd/MM/yyyy")} - ${format(value.to, "dd/MM/yyyy")}`
      : format(value.from, "dd/MM/yyyy")
    : placeholder

  const handleApply = () => {
    if (tempRange?.from) {
      onChange({
        from: tempRange.from,
        to: tempRange.to,
      })
    }
    setOpen(false)
  }

  const handleClear = () => {
    setTempRange(undefined)
    onChange(undefined)
    if (onClear) {
      onClear()
    }
    setOpen(false)
  }

  const handleClose = () => {
    // Reset temp range to current value when closing without applying
    setTempRange(value?.from ? { from: value.from, to: value.to } : undefined)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full md:w-[280px] justify-start text-left font-normal cursor-pointer hover:bg-transparent hover:text-foreground",
            !value?.from && "text-muted-foreground",
            !value?.from && "hover:text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={tempRange?.from}
            selected={tempRange}
            onSelect={setTempRange}
            numberOfMonths={2}
          />
          <div className="flex items-center justify-between gap-2 p-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="cursor-pointer"
            >
              <X size={14} className="mr-1" />
              Clear
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="cursor-pointer"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                disabled={!tempRange?.from}
                className="cursor-pointer"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

