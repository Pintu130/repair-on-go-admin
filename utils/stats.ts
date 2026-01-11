import type { Order } from "@/data/orders"

export interface Stats {
  totalRevenue: number
  pendingAmount: number
}

export function calculateStats(orders: Order[] | undefined | null): Stats {
  // Handle undefined or null orders
  if (!orders || !Array.isArray(orders)) {
    return {
      totalRevenue: 0,
      pendingAmount: 0,
    }
  }

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
