"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface ServiceDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: any
  getStatusColor: (status: string) => string
  formatStatus: (status: string) => string
}

export function ServiceDetailsModal({ 
  open, 
  onOpenChange, 
  service, 
  getStatusColor, 
  formatStatus 
}: ServiceDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Service Details</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          {service && (
            <>
              {service.textDescription && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                    {service.textDescription}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
