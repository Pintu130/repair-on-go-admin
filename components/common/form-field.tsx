"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormField as FormFieldType } from "./form-modal"

interface FormFieldProps {
  field: FormFieldType
  value: any
  onChange: (value: any) => void
}

export function FormField({ field, value, onChange }: FormFieldProps) {
  const colSpanClass = field.colSpan === 2 ? "col-span-2" : ""

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

