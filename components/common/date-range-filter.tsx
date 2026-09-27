"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"

interface DateRangeFilterProps {
  value?: { from?: Date; to?: Date }
  onChange: (range: { from?: Date; to?: Date } | undefined) => void
  onClear?: () => void
  placeholder?: string
  className?: string
  align?: "start" | "center" | "end"
}

export function DateRangeFilter({
  value,
  onChange,
  onClear,
  placeholder = "Pick a date range",
  className,
  align = "start",
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()
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
            "w-full md:w-[280px] min-w-0 justify-start text-left font-normal cursor-pointer hover:bg-transparent hover:text-foreground",
            !value?.from && "text-muted-foreground",
            !value?.from && "hover:text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-[calc(100vw-1.5rem)] p-0" align={align}>
        <div className="max-h-[80vh] overflow-y-auto p-3">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={tempRange?.from}
            selected={tempRange}
            onSelect={setTempRange}
            numberOfMonths={isMobile ? 1 : 2}
          />
        </div>
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
      </PopoverContent>
    </Popover>
  )
}

