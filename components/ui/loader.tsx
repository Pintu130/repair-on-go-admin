"use client"

import { cn } from "@/lib/utils"
import "./loader.css"

interface LoaderProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function Loader({ className, size = "md" }: LoaderProps) {
  const sizeClasses = {
    sm: "w-10 h-7",
    md: "w-[60px] h-10",
    lg: "w-20 h-14",
  }

  return (
    <span 
      className={cn("loader", sizeClasses[size], className)}
      role="status"
      aria-label="Loading"
    />
  )
}

