'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

function ImageUploadField({
  label,
  value,
  onSelect,
  className,
}: {
  label: string
  value?: string
  onSelect: (dataUrl: string) => void
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  function handleFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      onSelect(result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className={cn('w-[280px]', className)}>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="relative">
        <div
          className="border-2 border-dashed border-border rounded-lg h-40 w-full flex items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-muted/50 overflow-hidden"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files?.[0]
            handleFile(file)
          }}
        >
          {value ? (
            <img src={value} alt={label} className="max-h-32 w-auto object-contain rounded mx-auto" />
          ) : (
            <p className="text-muted-foreground">Drag & drop or click to browse</p>
          )}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onSelect('')}
            className="absolute right-2 top-2 inline-flex items-center justify-center rounded-md border bg-background text-muted-foreground hover:bg-muted px-2 py-1 cursor-pointer"
            aria-label="Remove image"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export { ImageUploadField }
