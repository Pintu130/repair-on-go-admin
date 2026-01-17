"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type OrderStatus = "booked" | "confirmed" | "picked" | "serviceCenter" | "repair" | "outForDelivery" | "delivered" | "cancelled"

interface OrderStatusBadgeProps {
  status: OrderStatus
  className?: string
}

const statusColors: Record<OrderStatus, string> = {
  booked: "bg-blue-500 hover:bg-blue-600 text-white border-blue-600",
  confirmed: "bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-600",
  picked: "bg-purple-500 hover:bg-purple-600 text-white border-purple-600",
  serviceCenter: "bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-600",
  repair: "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600",
  outForDelivery: "bg-orange-500 hover:bg-orange-600 text-white border-orange-600",
  delivered: "bg-green-500 hover:bg-green-600 text-white border-green-600",
  cancelled: "bg-red-500 hover:bg-red-600 text-white border-red-600",
}

export const statusLabels: Record<OrderStatus, string> = {
  booked: "booked",
  confirmed: "Confirmed",
  picked: "Pickup",
  serviceCenter: "Service Center",
  repair: "Repair",
  outForDelivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <Badge className={cn(statusColors[status], className, "capitalize")}>
      {statusLabels[status]}
    </Badge>
  )
}

