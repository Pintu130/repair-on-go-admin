import type React from "react"
import { useRef } from "react"
import { Upload, X, Image as ImageIcon, Film } from "lucide-react"

interface MediaUploadFieldProps {
  label: string
  type: "image" | "video"
  value: string
  onSelect: (dataUrl: string) => void
}

export function MediaUploadField({ label, type, value, onSelect }: MediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      onSelect(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const accept = type === "image" ? "image/*" : "video/*"

  return (
    <div
      className="relative flex flex-col items-center justify-center border rounded-md w-48 h-48 overflow-hidden bg-muted/20 cursor-pointer"
      onClick={() => inputRef.current?.click()}
    >
      {!value && (
        <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
          {type === "image" ? <ImageIcon size={24} /> : <Film size={24} />}
          <span className="text-sm">{label}</span>
          <Upload size={16} />
        </div>
      )}
      {value && type === "image" && (
        <img src={value} alt="preview" className="w-full h-full object-cover" />
      )}
      {value && type === "video" && (
        <video src={value} className="w-full h-full object-cover" controls />
      )}
      {value && (
        <button
          className="absolute top-2 right-2 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            onSelect("")
          }}
        >
          <X size={14} />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
