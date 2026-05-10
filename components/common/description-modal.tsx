"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface DescriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
}

export function DescriptionModal({
  open,
  onOpenChange,
  title,
  description,
}: DescriptionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button> */}
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {description || "No description available"}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
