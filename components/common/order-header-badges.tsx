"use client"

import { Badge } from "@/components/ui/badge"
import { CreditCard, Smartphone, Banknote, CheckCircle, Clock, Calendar, Package } from "lucide-react"
import type { Order } from "@/data/orders"

interface OrderHeaderBadgesProps {
  order: Order
  statusLabels: Record<string, string>
}

export function OrderHeaderBadges({ order, statusLabels }: OrderHeaderBadgesProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Payment Status */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] text-muted-foreground font-medium">Payment Status</span>
        <Badge
          variant="outline"
          className={
            order.paymentStatus === "paid"
              ? "bg-green-500/10 text-green-700 border-green-500 hover:bg-green-500/20 dark:text-green-400 dark:border-green-400"
              : order.paymentStatus === "pending"
              ? "bg-yellow-500/10 text-yellow-700 border-yellow-500 hover:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-400"
              : order.paymentStatus === "cash"
              ? "bg-blue-500/10 text-blue-700 border-blue-500 hover:bg-blue-500/20 dark:text-blue-400 dark:border-blue-400"
              : "bg-gray-500/10 text-gray-700 border-gray-500 hover:bg-gray-500/20"
          }
        >
          {order.paymentStatus === "paid" && <CheckCircle size={14} className="mr-1.5" />}
          {order.paymentStatus === "pending" && <Clock size={14} className="mr-1.5" />}
          {order.paymentStatus === "cash" && <CheckCircle size={14} className="mr-1.5" />}
          <span className="font-medium">
            {order.paymentStatus ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1) : "Pending"}
          </span>
        </Badge>
      </div>

      {/* Payment Method */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] text-muted-foreground font-medium">Payment Method</span>
        <Badge
          variant="outline"
          className={
            order.paymentMethod === "UPI"
              ? "bg-blue-500/10 text-blue-700 border-blue-500 hover:bg-blue-500/20 dark:text-blue-400 dark:border-blue-400"
              : order.paymentMethod === "Cash"
              ? "bg-green-500/10 text-green-700 border-green-500 hover:bg-green-500/20 dark:text-green-400 dark:border-green-400"
              : "bg-purple-500/10 text-purple-700 border-purple-500 hover:bg-purple-500/20 dark:text-purple-400 dark:border-purple-400"
          }
        >
          {order.paymentMethod === "UPI" && <Smartphone size={14} className="mr-1.5" />}
          {order.paymentMethod === "Cash" && <Banknote size={14} className="mr-1.5" />}
          {order.paymentMethod === "Card" && <CreditCard size={14} className="mr-1.5" />}
          <span className="font-medium">{order.paymentMethod || "N/A"}</span>
        </Badge>
      </div>

      {/* Order Date */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] text-muted-foreground font-medium">Order Date</span>
        <Badge variant="outline" className="bg-orange-500/10 text-orange-700 border-orange-500 hover:bg-orange-500/20 dark:text-orange-400 dark:border-orange-400">
          <Calendar size={14} className="mr-1.5" />
          <span className="font-medium">
            {order.date
              ? new Date(order.date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "N/A"}
          </span>
        </Badge>
      </div>

      {/* Order Status */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] text-muted-foreground font-medium">Order Status</span>
        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-700 border-indigo-500 hover:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-400">
          <Package size={14} className="mr-1.5" />
          <span className="font-medium">{statusLabels[order.status as keyof typeof statusLabels] || order.status}</span>
        </Badge>
      </div>
    </div>
  )
}

