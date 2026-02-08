'use client'

import type React from 'react'
import { LucideIcon } from 'lucide-react'

function TextareaField({
  label,
  name,
  value,
  onChange,
  icon: Icon,
  rows = 3,
  placeholder,
  className,
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  icon?: LucideIcon
  rows?: number
  placeholder?: string
  className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-3 size-4 text-muted-foreground" />}
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          className="w-full pl-10 px-4 py-2 rounded-lg border border-border bg-background"
        />
      </div>
    </div>
  )
}

export { TextareaField }
