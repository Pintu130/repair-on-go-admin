import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns"

import type { Order } from "@/data/orders"
import type { Customer } from "@/data/customers"
import type { Employee } from "@/data/employees"
import type { Contact } from "@/lib/store/api/contactsApi"
import type { Category } from "@/lib/store/api/categoriesApi"
import { ORDER_STATUSES, type OrderStatus } from "@/lib/order-status"

/* -------------------------------------------------------------------------- */
/*                                    Types                                    */
/* -------------------------------------------------------------------------- */

export type DashboardRangeKey = "7d" | "30d" | "90d" | "all"

export type DateRangeValue = { from?: Date; to?: Date }

export const DASHBOARD_RANGE_OPTIONS: { value: DashboardRangeKey; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
]

export const RANGE_LABELS: Record<DashboardRangeKey, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
}

/** Booking flow ke beech ke statuses (booked + delivered ke bahar). */
const IN_PROGRESS_STATUSES: OrderStatus[] = [
  "confirmed",
  "picked",
  "serviceCenter",
  "repair",
  "outForDelivery",
]

export type DashboardSummary = {
  revenue: number
  orders: number
  netOrders: number
  paidOrders: number
  avgOrderValue: number
  pendingOrders: number
  inProgressOrders: number
  deliveredOrders: number
  canceledOrders: number
  customers: number
  newCustomers: number
  employees: number
  newEmployees: number
  totalCategories: number
  activeCategories: number
  enquiries: number
  newEnquiries: number
}

export type StatusCount = {
  status: OrderStatus
  count: number
}

export type TrendPoint = {
  /** Bucket ka start — tooltip/format ke liye */
  date: string
  label: string
  revenue: number
  orders: number
}

export type TopCategory = {
  categoryId: string
  name: string
  /** Category image URL (Firebase Storage). Empty string = image nahi hai. */
  image: string
  bookings: number
  paidBookings: number
  revenue: number
}

export type RecentEnquiry = {
  id: string
  name: string
  email: string
  subject: string
  status: Contact["status"]
  createdAt: string
}

export type ResolvedRange = {
  from: Date
  to: Date
}

export type DashboardStats = {
  range: { key: DashboardRangeKey | "custom"; from: Date; to: Date }
  summary: DashboardSummary
  ordersByStatus: StatusCount[]
  revenueTrend: TrendPoint[]
  topCategories: TopCategory[]
  recentOrders: Order[]
  recentEnquiries: RecentEnquiry[]
}

export type BuildDashboardStatsInput = {
  orders: Order[]
  customers: Customer[]
  employees: Employee[]
  contacts: Contact[]
  categories: Category[]
  range: ResolvedRange
  /** Preset ya custom — header subtitle me dikhta hai */
  rangeKey: DashboardRangeKey | "custom"
  /** "all" se category gate nahi hota — undefined = sabhi categories */
  categoryId?: string
  categoryName?: string
}

/* -------------------------------------------------------------------------- */
/*                                 Date helpers                                */
/* -------------------------------------------------------------------------- */

function toDate(value: string | number | Date | undefined | null): Date | null {
  if (value === undefined || value === null || value === "") return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === "number") {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof value === "string") {
    const plainDay = /^\d{4}-\d{2}-\d{2}$/.test(value)
    const d = plainDay ? new Date(`${value}T00:00:00`) : new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function inRange(date: Date | null, from: Date, to: Date): boolean {
  if (!date) return false
  const t = date.getTime()
  return t >= from.getTime() && t <= to.getTime()
}

/**
 * Preset range ya custom range ko actual { from, to } me resolve karta hai.
 * "all" ke liye data ka earliest booking use hota hai taaki chart khali na rahe.
 */
export function resolveDashboardRange(
  range: DashboardRangeKey,
  customRange: DateRangeValue | undefined,
  allOrders: Order[] = []
): ResolvedRange {
  const now = new Date()
  const to = endOfDay(now)

  if (customRange?.from) {
    const start = startOfDay(customRange.from)
    const end = endOfDay(customRange.to ?? customRange.from)
    // Reversed range pick ho to normalise kar do
    return end.getTime() < start.getTime() ? { from: end, to: endOfDay(start) } : { from: start, to: end }
  }

  switch (range) {
    case "7d":
      return { from: startOfDay(subDays(now, 6)), to }
    case "30d":
      return { from: startOfDay(subDays(now, 29)), to }
    case "90d":
      return { from: startOfDay(subDays(now, 89)), to }
    case "all":
    default: {
      const earliest = allOrders.reduce<Date | null>((acc, order) => {
        const d = toDate(order.date)
        if (!d) return acc
        if (!acc || d.getTime() < acc.getTime()) return d
        return acc
      }, null)
      const from = earliest ? startOfDay(earliest) : startOfMonth(now)
      return from.getTime() > to.getTime() ? { from: to, to } : { from, to }
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                              Revenue trend buckets                          */
/* -------------------------------------------------------------------------- */

type Granularity = "day" | "week" | "month"

type TrendBuckets = {
  granularity: Granularity
  starts: Date[]
  labels: string[]
  indexOf: (date: Date) => number
}

function buildTrendBuckets(from: Date, to: Date): TrendBuckets {
  // Reversed range ka safety net — eachDayOfInterval start > end pe throw karta hai
  if (to.getTime() < from.getTime()) {
    return { granularity: "day", starts: [startOfDay(from)], labels: [format(from, "dd MMM")], indexOf: () => 0 }
  }

  const days = Math.max(1, differenceInCalendarDays(to, from) + 1)
  // 1–31 din → daily
  if (days <= 31) {
    const daysList = eachDayOfInterval({ start: from, end: to })
    const starts = daysList.map((d) => startOfDay(d))
    const indexMap = new Map(starts.map((d, i) => [d.getTime(), i]))
    return {
      granularity: "day",
      starts,
      labels: starts.map((d) => format(d, "dd MMM")),
      indexOf: (date) => indexMap.get(startOfDay(date).getTime()) ?? -1,
    }
  }

  // 32–92 din → weekly (7 day chunks, anchored at `from`)
  if (days <= 92) {
    const starts: Date[] = []
    for (let cursor = from; differenceInCalendarDays(to, cursor) >= 0; cursor = addDays(cursor, 7)) {
      starts.push(startOfDay(cursor))
    }
    return {
      granularity: "week",
      starts,
      labels: starts.map((d) => format(d, "dd MMM")),
      indexOf: (date) => {
        const diff = differenceInCalendarDays(startOfDay(date), from)
        return diff < 0 ? -1 : Math.floor(diff / 7)
      },
    }
  }

  // 93+ din → monthly
  const starts: Date[] = []
  for (let cursor = startOfMonth(from); cursor.getTime() <= to.getTime(); cursor = addMonths(cursor, 1)) {
    starts.push(startOfDay(cursor))
  }
  return {
    granularity: "month",
    starts,
    labels: starts.map((d) => format(d, "MMM yyyy")),
    indexOf: (date) => {
      const fromMonth = from.getFullYear() * 12 + from.getMonth()
      const dateMonth = date.getFullYear() * 12 + date.getMonth()
      const idx = dateMonth - fromMonth
      return idx < 0 ? -1 : idx
    },
  }
}

function buildRevenueTrend(orders: Order[], from: Date, to: Date): TrendPoint[] {
  const buckets = buildTrendBuckets(from, to)
  const revenue = new Array(buckets.starts.length).fill(0)
  const count = new Array(buckets.starts.length).fill(0)

  orders.forEach((order) => {
    const date = toDate(order.date)
    if (!inRange(date, from, to)) return
    const idx = buckets.indexOf(date!)
    if (idx < 0 || idx >= revenue.length) return
    count[idx] += 1
    if (order.paymentStatus === "paid") {
      revenue[idx] += order.amount || 0
    }
  })

  return buckets.starts.map((start, i) => ({
    date: start.toISOString(),
    label: buckets.labels[i],
    revenue: revenue[i],
    orders: count[i],
  }))
}

/* -------------------------------------------------------------------------- */
/*                              Category matching                              */
/* -------------------------------------------------------------------------- */

function matchesCategory(order: Order, categoryId?: string, categoryName?: string): boolean {
  if (!categoryId && !categoryName) return true
  if (categoryId && order.categoryId === categoryId) return true
  if (categoryName && order.category && order.category === categoryName) return true
  return false
}

/* -------------------------------------------------------------------------- */
/*                              Main aggregation                               */
/* -------------------------------------------------------------------------- */

export function buildDashboardStats({
  orders,
  customers,
  employees,
  contacts,
  categories,
  range,
  rangeKey,
  categoryId,
  categoryName,
}: BuildDashboardStatsInput): DashboardStats {
  const from = startOfDay(range.from)
  const to = endOfDay(range.to)

  /* ---------------------------- Orders / range ---------------------------- */
  const gatedOrders = (orders ?? []).filter((order) => matchesCategory(order, categoryId, categoryName))

  const scopedOrders = gatedOrders.filter((order) => inRange(toDate(order.date), from, to))

  const isPaid = (order: Order) => order.paymentStatus === "paid"

  const paidOrders = scopedOrders.filter(isPaid)
  const revenue = paidOrders.reduce((sum, order) => sum + (order.amount || 0), 0)
  const paidOrderCount = paidOrders.length

  const canceledOrders = scopedOrders.filter((order) => order.status === "cancelled").length
  const pendingOrders = scopedOrders.filter((order) => order.status === "booked").length
  const inProgressOrders = scopedOrders.filter((order) => IN_PROGRESS_STATUSES.includes(order.status)).length
  const deliveredOrders = scopedOrders.filter((order) => order.status === "delivered").length

  /* --------------------------- Orders by status --------------------------- */
  const statusCounts = new Map<OrderStatus, number>()
  scopedOrders.forEach((order) => {
    statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1)
  })
  const ordersByStatus: StatusCount[] = ORDER_STATUSES.map((status) => ({
    status,
    count: statusCounts.get(status) ?? 0,
  })).sort((a, b) => b.count - a.count)

  /* --------------------------- Revenue trend ------------------------------ */
  const revenueTrend = buildRevenueTrend(scopedOrders, from, to)

  /* ---------------------------- Top categories ---------------------------- */
  const categoryMeta = new Map<string, Category>()
  ;(categories ?? []).forEach((category) => {
    categoryMeta.set(category.id, category)
    if (category.name) categoryMeta.set(`name:${category.name}`, category)
  })

  const topMap = new Map<string, TopCategory>()
  scopedOrders.forEach((order) => {
    const key = order.categoryId || `name:${order.category}`
    const meta = categoryMeta.get(key) ?? categoryMeta.get(`name:${order.category}`)
    const name = meta?.name || order.category || "Uncategorised"
    // Category image (icon) prefer karo, warna seo image — koi na ho to empty
    const image = meta?.icon || meta?.seoImage || ""

    const current = topMap.get(key) ?? {
      categoryId: order.categoryId || "",
      name,
      image,
      bookings: 0,
      paidBookings: 0,
      revenue: 0,
    }
    current.bookings += 1
    if (isPaid(order)) {
      current.paidBookings += 1
      current.revenue += order.amount || 0
    }
    topMap.set(key, current)
  })

  const topCategories = [...topMap.values()]
    .sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings)
    .slice(0, 5)

  /* --------------------------- Recent orders ------------------------------ */
  const recentOrders = [...scopedOrders]
    .sort((a, b) => (toDate(b.date)?.getTime() ?? 0) - (toDate(a.date)?.getTime() ?? 0))
    .slice(0, 6)

  /* ---------------------------- Customers --------------------------------- */
  const allCustomers = customers ?? []
  const isCustomer = (c: Customer) => !c.role || c.role === "customer"
  const newCustomers = allCustomers.filter(
    (c) => isCustomer(c) && inRange(toDate(c.joinDate), from, to)
  ).length

  /* ---------------------------- Employees --------------------------------- */
  const allEmployees = employees ?? []
  const isEmployee = (e: Employee) => !e.role || e.role === "employee"
  const newEmployees = allEmployees.filter(
    (e) => isEmployee(e) && inRange(toDate(e.joinDate), from, to)
  ).length

  /* ---------------------------- Categories -------------------------------- */
  const allCategories = categories ?? []
  const activeCategories = allCategories.filter(
    (c) => c.status !== undefined && c.status !== "inactive"
  ).length

  /* ---------------------------- Enquiries --------------------------------- */
  const scopedContacts = (contacts ?? []).filter((c) =>
    inRange(toDate(c.createdAt || c.date), from, to)
  )
  const recentEnquiries: RecentEnquiry[] = [...scopedContacts]
    .sort(
      (a, b) =>
        (toDate(b.createdAt || b.date)?.getTime() ?? 0) - (toDate(a.createdAt || a.date)?.getTime() ?? 0)
    )
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      name: c.name || "Unknown",
      email: c.email || "",
      subject: c.message || "",
      status: c.status,
      createdAt: c.createdAt || c.date || "",
    }))

  const summary: DashboardSummary = {
    revenue,
    orders: scopedOrders.length,
    netOrders: scopedOrders.length - canceledOrders,
    paidOrders: paidOrderCount,
    avgOrderValue: paidOrderCount ? revenue / paidOrderCount : 0,
    pendingOrders,
    inProgressOrders,
    deliveredOrders,
    canceledOrders,
    customers: allCustomers.filter(isCustomer).length,
    newCustomers,
    employees: allEmployees.filter(isEmployee).length,
    newEmployees,
    totalCategories: allCategories.length,
    activeCategories,
    enquiries: scopedContacts.length,
    newEnquiries: scopedContacts.filter((c) => c.status === "new").length,
  }

  return {
    range: {
      key: rangeKey,
      from,
      to,
    },
    summary,
    ordersByStatus,
    revenueTrend,
    topCategories,
    recentOrders,
    recentEnquiries,
  }
}
