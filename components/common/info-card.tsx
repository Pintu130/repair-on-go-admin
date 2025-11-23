"use client"

import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface InfoCardProps {
  icon: LucideIcon
  label: string
  value: string
  iconColor?: string
  iconBgColor?: string
  className?: string
}

export function InfoCard({
  icon: Icon,
  label,
  value,
  iconColor = "text-blue-500",
  iconBgColor = "bg-blue-500/10",
  className,
}: InfoCardProps) {
  return (
    <Card>
      <CardContent className={cn("pt-2 pb-2", className)}>
        <div className="flex items-center gap-3">
          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", iconBgColor)}>
            <Icon size={18} className={iconColor} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-sm font-semibold truncate">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

