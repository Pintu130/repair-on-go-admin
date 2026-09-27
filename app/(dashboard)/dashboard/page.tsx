"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { type Order } from "@/data/orders"
import Link from "next/link"
import { useState, useMemo } from "react"
import { Ban, Clock, MessageSquare, TrendingUp, Users, Zap } from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { DateRangeFilter } from "@/components/common/date-range-filter"
import { useGetBookingsQuery } from "@/lib/store/api/bookingsApi"
import { useGetCustomersQuery } from "@/lib/store/api/customersApi"
import { useGetEmployeesQuery } from "@/lib/store/api/employeesApi"
import { useGetContactsQuery } from "@/lib/store/api/contactsApi"
import {
  format,
  eachDayOfInterval,
  differenceInCalendarDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
} from "date-fns"

type DateRange = { from?: Date; to?: Date }
type TimePeriod = "today" | "week" | "month" | "year"

const getPeriodRange = (period: TimePeriod): DateRange => {
  const now = new Date()
  const to = endOfDay(now)

  if (period === "today") {
    return { from: startOfDay(now), to }
  }
  if (period === "week") {
    return { from: startOfWeek(now, { weekStartsOn: 1 }), to }
  }
  if (period === "month") {
    return { from: startOfMonth(now), to }
  }
  return { from: startOfYear(now), to }
}

const isInDateRange = (dateValue: string | Date | undefined, range?: DateRange) => {
  if (!range?.from) return true
  if (!dateValue) return false

  const date = startOfDay(new Date(dateValue))
  const from = startOfDay(range.from)
  const to = endOfDay(range.to ?? range.from)

  return date.getTime() >= from.getTime() && date.getTime() <= to.getTime()
}

const getLatestBookings = (orders: Order[], range?: DateRange) => {
  if (!orders || !Array.isArray(orders)) return []

  const filteredOrders = range?.from
    ? orders.filter((order) => isInDateRange(order.date, range))
    : orders

  return [...filteredOrders]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    created: "bg-yellow-100 text-yellow-800",
    verify: "bg-blue-100 text-blue-800",
    picked: "bg-purple-100 text-purple-800",
    repaired: "bg-orange-100 text-orange-800",
    delivered: "bg-green-100 text-green-800",
  }
  return colors[status] || "bg-gray-100 text-gray-800"
}

const CATEGORY_PIE_COLORS = [
  "#ED2C2C",
  "#F59E0B",
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
]

export default function DashboardPage() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const { data: bookingsData } = useGetBookingsQuery()
  const { data: customersData } = useGetCustomersQuery()
  const { data: employeesData } = useGetEmployeesQuery()
  const { data: contactsData } = useGetContactsQuery()

  const orders: Order[] = bookingsData?.bookings || []
  const customers = customersData?.customers || []
  const employees = employeesData?.employees || []
  const messages = contactsData?.contacts || []

  const hasCustomRange = Boolean(dateRange?.from)

  const effectiveRange = useMemo(() => {
    if (hasCustomRange) return dateRange
    return getPeriodRange(timePeriod)
  }, [dateRange, hasCustomRange, timePeriod])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => isInDateRange(order.date, effectiveRange))
  }, [orders, effectiveRange])

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((customer) => customer.role === "customer" || !customer.role)
      .filter((customer) => isInDateRange(customer.joinDate, effectiveRange))
  }, [customers, effectiveRange])

  const filteredEmployees = useMemo(() => {
    return employees
      .filter((employee) => employee.role === "employee" || !employee.role)
      .filter((employee) => isInDateRange(employee.joinDate, effectiveRange))
  }, [employees, effectiveRange])

  const filteredMessages = useMemo(() => {
    return messages.filter((message) =>
      isInDateRange(message.date || message.createdAt, effectiveRange)
    )
  }, [messages, effectiveRange])

  const totalRevenue = filteredOrders
    .filter((order) => order.paymentStatus === "paid")
    .reduce((sum, order) => sum + (order.amount || 0), 0)
  const totalCustomers = filteredCustomers.length
  const totalEmployees = filteredEmployees.length
  const totalOrders = filteredOrders.length
  const canceledOrders = filteredOrders.filter((order) => order.status === "cancelled").length
  const totalMessages = filteredMessages.length
  const newMessages = filteredMessages.filter((message) => message.status === "new").length

  const rangeLabel = useMemo(() => {
    if (!effectiveRange?.from) return null
    if (effectiveRange.to) {
      return `${format(effectiveRange.from, "dd/MM/yyyy")} – ${format(effectiveRange.to, "dd/MM/yyyy")}`
    }
    return format(effectiveRange.from, "dd/MM/yyyy")
  }, [effectiveRange])

  const handlePeriodClick = (period: TimePeriod) => {
    setTimePeriod(period)
    setDateRange(undefined)
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
  }

  // Generate dynamic Revenue Trend data from bookings
  const chartData = useMemo(() => {
    if (hasCustomRange && dateRange?.from) {
      const from = startOfDay(dateRange.from)
      const to = startOfDay(dateRange.to ?? dateRange.from)
      const days = Math.max(1, differenceInCalendarDays(to, from) + 1)
      const dayList = eachDayOfInterval({ start: from, end: to })

      const revenueData: Record<string, number> = {}

      filteredOrders.forEach((order) => {
        if (order.paymentStatus !== "paid") return
        const orderDate = new Date(order.date)
        const label =
          days <= 31
            ? format(orderDate, "dd/MM")
            : days <= 92
              ? `W${Math.ceil(orderDate.getDate() / 7)} ${format(orderDate, "MMM")}`
              : format(orderDate, "MMM yyyy")
        revenueData[label] = (revenueData[label] || 0) + (order.amount || 0)
      })

      if (days <= 31) {
        return dayList.map((day) => {
          const label = format(day, "dd/MM")
          return { label, revenue: revenueData[label] || 0 }
        })
      }

      const labels = Object.keys(revenueData)
      if (labels.length === 0) {
        return [{ label: format(from, "dd/MM"), revenue: 0 }]
      }
      return labels.map((label) => ({
        label,
        revenue: revenueData[label] || 0,
      }))
    }

    const revenueData: Record<string, number> = {}

    filteredOrders.forEach((order) => {
      if (order.paymentStatus !== "paid") return

      const orderDate = new Date(order.date)

      if (timePeriod === "today") {
        const hour = orderDate.getHours()
        const label = `${hour}:00`
        revenueData[label] = (revenueData[label] || 0) + (order.amount || 0)
      } else if (timePeriod === "week") {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        const label = days[orderDate.getDay()]
        revenueData[label] = (revenueData[label] || 0) + (order.amount || 0)
      } else if (timePeriod === "month") {
        const weekNum = Math.ceil(orderDate.getDate() / 7)
        const label = `Week ${weekNum}`
        revenueData[label] = (revenueData[label] || 0) + (order.amount || 0)
      } else {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        const label = months[orderDate.getMonth()]
        revenueData[label] = (revenueData[label] || 0) + (order.amount || 0)
      }
    })

    let labels: string[]
    if (timePeriod === "today") {
      labels = Array.from({ length: 24 }, (_, i) => `${i}:00`)
    } else if (timePeriod === "week") {
      labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    } else if (timePeriod === "month") {
      labels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"]
    } else {
      labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    }

    return labels.map((label) => ({
      label,
      revenue: revenueData[label] || 0,
    }))
  }, [filteredOrders, timePeriod, dateRange, hasCustomRange])

  const categoryData = useMemo(() => {
    if (!filteredOrders.length) {
      return [
        { name: "Plumbing", value: 0 },
        { name: "Electrical", value: 0 },
        { name: "Carpentry", value: 0 },
        { name: "Painting", value: 0 },
      ]
    }

    const categoryCounts: Record<string, number> = {}

    filteredOrders.forEach((order) => {
      const category = order.category || "Other"
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    })

    return Object.entries(categoryCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [filteredOrders])

  const periodOrRangeLabel = hasCustomRange ? "selected range" : timePeriod
  const latestBookings = getLatestBookings(orders, effectiveRange)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-balance">Dashboard</h1>
          <p className="text-sm text-muted-foreground break-words">
            {rangeLabel ? `Showing data from ${rangeLabel}` : "Welcome to RepairOnGo admin panel"}
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-2 xl:w-auto xl:shrink-0 xl:flex-row xl:items-center xl:ml-auto">
          <div className="grid w-full grid-cols-4 gap-2 xl:flex xl:w-auto xl:flex-wrap">
            {(["today", "week", "month", "year"] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => handlePeriodClick(period)}
                className={`px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer truncate ${
                  !hasCustomRange && timePeriod === period
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          <DateRangeFilter
            value={dateRange}
            onChange={handleDateRangeChange}
            onClear={() => setDateRange(undefined)}
            placeholder="Filter by date range"
            className="w-full xl:w-[260px]"
            align="end"
          />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          subtitle="Paid bookings in period"
          subtitleClassName="text-xs text-muted-foreground"
          icon={<TrendingUp className="text-primary" size={18} />}
          href="/payments"
        />
        <StatCard
          title="Users Registered"
          value={totalCustomers.toLocaleString("en-IN")}
          subtitle="New users in period"
          subtitleClassName="text-xs text-muted-foreground"
          icon={<Users className="text-primary" size={18} />}
          href="/customers"
        />
        <StatCard
          title="Total Employees"
          value={totalEmployees.toLocaleString("en-IN")}
          subtitle="Joined in period"
          subtitleClassName="text-xs text-muted-foreground"
          icon={<Zap className="text-primary" size={18} />}
          href="/employees"
        />
        <StatCard
          title="Total Orders"
          value={totalOrders.toLocaleString("en-IN")}
          subtitle="Orders in period"
          subtitleClassName="text-xs text-muted-foreground"
          icon={<Clock className="text-primary" size={18} />}
          href="/orders"
        />
        <StatCard
          title="Canceled Orders"
          value={canceledOrders.toLocaleString("en-IN")}
          subtitle={
            totalOrders > 0
              ? `${((canceledOrders / totalOrders) * 100).toFixed(1)}% of total orders`
              : "0% of total orders"
          }
          subtitleClassName="text-xs text-muted-foreground"
          icon={<Ban className="text-primary" size={18} />}
          href="/orders"
        />
        <StatCard
          title="Total Messages"
          value={totalMessages.toLocaleString("en-IN")}
          subtitle={`${newMessages.toLocaleString("en-IN")} new messages`}
          subtitleClassName="text-xs text-muted-foreground"
          icon={<MessageSquare className="text-primary" size={18} />}
          href="/contact"
        />
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend ({periodOrRangeLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]} />
              <Line type="monotone" dataKey="revenue" stroke="#ED2C2C" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Bookings by Category ({periodOrRangeLabel})</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={`category-cell-${index}`}
                      fill={CATEGORY_PIE_COLORS[index % CATEGORY_PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} bookings`, "Count"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={20} />
              Latest Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {latestBookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/orders/${booking.id}`}
                  className="flex items-center justify-between gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-sm">{booking.bookingId || booking.id}</p>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{booking.customer}</p>
                    <p className="text-xs text-muted-foreground truncate">{booking.service}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">₹{booking.amount}</p>
                    <p className="text-xs text-muted-foreground">{new Date(booking.date).toLocaleDateString()}</p>
                  </div>
                </Link>
              ))}
              {latestBookings.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No bookings in selected period
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
