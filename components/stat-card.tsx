import type { ReactNode } from "react"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  /** Extra classes for subtitle text (e.g. color) */
  subtitleClassName?: string
  icon?: ReactNode
  /** When set, the whole card becomes a link to this route */
  href?: string
}

export function StatCard({ title, value, subtitle, subtitleClassName, icon, href }: StatCardProps) {
  const content = (
    <Card
      className={
        href
          ? "h-full cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          : "h-full"
      }
    >
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

  if (href) {
    return (
      <Link href={href} className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        {content}
      </Link>
    )
  }

  return content
}
