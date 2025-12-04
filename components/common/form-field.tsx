"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff } from "lucide-react"
import { FormField as FormFieldType } from "./form-modal"

interface FormFieldProps {
  field: FormFieldType
  value: any
  onChange: (value: any) => void
}

export function FormField({ field, value, onChange }: FormFieldProps) {
  const colSpanClass = field.colSpan === 2 ? "col-span-2" : ""
  const [showPassword, setShowPassword] = useState(false)

  if (field.type === "select") {
    return (
      <div className={`space-y-2 ${colSpanClass}`}>
        <Label htmlFor={field.id}>
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Select
          value={value || ""}
          onValueChange={(val) => onChange(val)}
          disabled={field.disabled}
        >
          <SelectTrigger id={field.id} className="w-full">
            <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (field.type === "textarea") {
    return (
      <div className={`space-y-2 ${colSpanClass}`}>
        <Label htmlFor={field.id}>
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <textarea
          id={field.id}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={field.disabled}
          maxLength={field.maxLength}
          className="w-full min-h-[80px] px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-sm"
        />
      </div>
    )
  }

  // Handle password field with eye icon
  if (field.type === "password") {
    return (
      <div className={`space-y-2 ${colSpanClass}`}>
        <Label htmlFor={field.id}>
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="relative">
          <Input
            id={field.id}
            type={showPassword ? "text" : "password"}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            maxLength={field.maxLength}
            disabled={field.disabled}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            disabled={field.disabled}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${colSpanClass}`}>
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={field.id}
        type={field.type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        min={field.min}
        max={field.max}
        maxLength={field.maxLength}
        disabled={field.disabled}
      />
    </div>
  )
}

