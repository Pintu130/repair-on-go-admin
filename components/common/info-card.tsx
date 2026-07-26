"use client"

import Link from "next/link"
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
  href?: string
}

export function InfoCard({
  icon: Icon,
  label,
  value,
  iconColor = "text-blue-500",
  iconBgColor = "bg-blue-500/10",
  className,
  href,
}: InfoCardProps) {
  const content = (
    <Card className={href ? "cursor-pointer" : undefined}>
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

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

