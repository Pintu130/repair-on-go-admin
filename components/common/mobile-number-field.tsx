"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface MobileNumberFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  colSpan?: 1 | 2
  error?: string
}

export function MobileNumberField({
  id,
  label,
  value,
  onChange,
  placeholder = "Enter 10-digit mobile number",
  required = false,
  disabled = false,
  className,
  colSpan = 1,
  error,
}: MobileNumberFieldProps) {
  const [touched, setTouched] = useState(false)

  // Format mobile number: Add space after 5 digits (e.g., 98765 43210)
  const formatMobileNumber = (input: string) => {
    // Remove all non-digit characters
    const digits = input.replace(/\D/g, "")
    
    // Limit to 10 digits
    const limitedDigits = digits.slice(0, 10)
    
    // Add space after 5 digits
    if (limitedDigits.length > 5) {
      return `${limitedDigits.slice(0, 5)} ${limitedDigits.slice(5)}`
    }
    
    return limitedDigits
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatMobileNumber(e.target.value)
    onChange(formatted)
  }

  const handleBlur = () => {
    setTouched(true)
  }

  // Validate Indian mobile number
  // Indian mobile numbers: Start with 6, 7, 8, or 9 and have exactly 10 digits
  const digits = value.replace(/\D/g, "")
  const isValid = digits.length === 10 && /^[6-9]\d{9}$/.test(digits)
  const showError = touched && value && !isValid

  const colSpanClass = colSpan === 2 ? "col-span-2" : ""

  return (
    <div className={cn("space-y-2", colSpanClass, className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={id}
        type="tel"
        value={value || ""}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={11} // 10 digits + 1 space
        className={cn(
          showError || error ? "border-destructive focus:ring-destructive" : ""
        )}
      />
      {(showError || error) && (
        <p className="text-xs text-destructive">
          {error || "Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)"}
        </p>
      )}
    </div>
  )
}

