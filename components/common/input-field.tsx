'use client'

import type React from 'react'
import { LucideIcon } from 'lucide-react'

function InputField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  icon: Icon,
  placeholder,
  className,
}: {
  label: string
  name: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  icon?: LucideIcon
  placeholder?: string
  className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-10 px-4 py-2 rounded-lg border border-border bg-background"
        />
      </div>
    </div>
  )
}

export { InputField }
