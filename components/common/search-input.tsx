"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  className?: string
  width?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search by name or email...",
  label = "Search",
  className = "",
  width = "w-[400px]",
}: SearchInputProps) {
  return (
    <div className={width}>
      <label className="text-sm font-medium mb-1 block">{label}</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`pl-10 ${className}`}
        />
      </div>
    </div>
  )
}

