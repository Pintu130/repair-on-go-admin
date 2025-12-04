"use client"

import { useRef } from "react"
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
  const inputIdRef = useRef(`search-input-${Math.random().toString(36).substr(2, 9)}`)

  return (
    <div className={width}>
      <label className="text-sm font-medium mb-1 block" htmlFor={inputIdRef.current}>
        {label}
      </label>
      <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            type="search"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`pl-10 ${className}`}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            role="searchbox"
            name="search-query"
            id={inputIdRef.current}
            data-1p-ignore
            data-form-type="other"
          />
        </div>
      </form>
    </div>
  )
}

