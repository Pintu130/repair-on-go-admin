import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a URL-friendly slug from a string
 * Converts to lowercase, replaces spaces with hyphens, removes special characters
 * Automatically appends "-repair" at the end
 * @param str - The string to convert to slug
 * @returns URL-friendly slug with "-repair" suffix
 */
export function generateSlug(str: string): string {
  if (!str || typeof str !== 'string') return ''
  
  const baseSlug = str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '')   // Remove hyphens from start/end
  
  // Add "-repair" suffix if not already present
  if (!baseSlug.endsWith('-repair')) {
    return `${baseSlug}-repair`
  }
  
  return baseSlug
}
