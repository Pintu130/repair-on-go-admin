import type { ReactNode } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  /** Extra classes for subtitle text (e.g. color) */
  subtitleClassName?: string
  icon?: ReactNode
}

export function StatCard({ title, value, subtitle, subtitleClassName, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className={subtitleClassName ?? "text-xs text-muted-foreground"}>{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}


