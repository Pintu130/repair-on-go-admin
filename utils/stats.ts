import type { Order } from "@/data/orders"

export interface Stats {
  totalRevenue: number
  pendingAmount: number
}

export function calculateStats(orders: Order[]): Stats {
  const totalRevenue = orders
    .filter((order) => order.status === "delivered")
    .reduce((sum, order) => sum + order.amount, 0)

  const pendingAmount = orders
    .filter((order) => order.status !== "delivered" && order.status !== "cancelled")
    .reduce((sum, order) => sum + order.amount, 0)

  return {
    totalRevenue,
    pendingAmount,
  }
}
