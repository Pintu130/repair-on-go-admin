import type { Order } from "@/data/orders"

export type OrderStatus = Order["status"]

export type OrderStatusVariant = "default" | "secondary" | "destructive" | "outline"

/** Booking ka normal flow (cancel ke alawa) — timeline / stepper ke liye. */
export const ORDER_FLOW: OrderStatus[] = [
  "booked",
  "confirmed",
  "picked",
  "serviceCenter",
  "repair",
  "outForDelivery",
  "delivered",
]

export const ORDER_STATUSES: OrderStatus[] = [...ORDER_FLOW, "cancelled"]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  booked: "Booked",
  confirmed: "Confirmed",
  picked: "Picked Up",
  serviceCenter: "Service Center",
  repair: "In Repair",
  outForDelivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

/** Short labels — jagah kam ho to use karo. */
export const ORDER_STATUS_SHORT_LABELS: Record<OrderStatus, string> = {
  booked: "Booked",
  confirmed: "Confirmed",
  picked: "Picked",
  serviceCenter: "Service",
  repair: "Repair",
  outForDelivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

export const ORDER_STATUS_VARIANTS: Record<OrderStatus, OrderStatusVariant> = {
  booked: "secondary",
  confirmed: "default",
  picked: "default",
  serviceCenter: "secondary",
  repair: "secondary",
  outForDelivery: "default",
  delivered: "default",
  cancelled: "outline",
}

/** "Orders by Status" bars ke liye. */
export const ORDER_STATUS_BAR_COLORS: Record<OrderStatus, string> = {
  booked: "bg-amber-400",
  confirmed: "bg-sky-500",
  picked: "bg-indigo-400",
  serviceCenter: "bg-violet-400",
  repair: "bg-orange-400",
  outForDelivery: "bg-fuchsia-400",
  delivered: "bg-emerald-500",
  cancelled: "bg-muted-foreground/40",
}

/** Status ka badge colour (order detail / lists me reuse hota hai). */
export const ORDER_STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  booked: "bg-blue-500 hover:bg-blue-600 text-white border-blue-600",
  confirmed: "bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-600",
  picked: "bg-purple-500 hover:bg-purple-600 text-white border-purple-600",
  serviceCenter: "bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-600",
  repair: "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600",
  outForDelivery: "bg-orange-500 hover:bg-orange-600 text-white border-orange-600",
  delivered: "bg-green-500 hover:bg-green-600 text-white border-green-600",
  cancelled: "bg-red-500 hover:bg-red-600 text-white border-red-600",
}

/** Payment status (UPI/Card = paid, COD = pending, Cash = cash). */
export const PAYMENT_STATUS_LABELS: Record<Order["paymentStatus"], string> = {
  paid: "Paid",
  pending: "Payment Pending",
  cash: "Cash on Delivery",
}

/** Unknown / missing status ke liye safe fallback. */
export function getOrderStatusLabel(status: string | undefined | null): string {
  if (!status) return "Unknown"
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status
}
