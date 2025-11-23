"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface SelectOption {
  value: string
  label: string
}

interface SelectFilterProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  label: string
  placeholder?: string
  width?: string
  className?: string
}

export function SelectFilter({
  value,
  onChange,
  options,
  label,
  placeholder,
  width = "w-[150px]",
  className = "",
}: SelectFilterProps) {
  return (
    <div className={width}>
      <label className="text-sm font-medium mb-1 block">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={`w-full cursor-pointer ${className}`}>
          <SelectValue placeholder={placeholder || label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="cursor-pointer">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

