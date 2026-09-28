"use client"

import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle ? <div className="text-sm text-muted-foreground">{subtitle}</div> : null}
      </div>
      {actions ? (
        <div className="flex w-full min-w-0 flex-col gap-2 lg:ml-auto lg:w-auto lg:shrink-0 lg:flex-row lg:flex-wrap lg:items-center">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
