"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { type Order } from "@/data/orders"
import { useState, useMemo } from "react"
import { Clock, TrendingUp, Users, Zap } from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { useGetBookingsQuery } from "@/lib/store/api/bookingsApi"
import { useGetCustomersQuery } from "@/lib/store/api/customersApi"
import { useGetEmployeesQuery } from "@/lib/store/api/employeesApi"



const getLatestBookings = (orders: Order[], timePeriod?: "today" | "week" | "month" | "year") => {
  if (!orders || !Array.isArray(orders)) {
    return []
  }
  
  let filteredOrders = orders
  
  if (timePeriod === "today") {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.date)
      orderDate.setHours(0, 0, 0, 0)
      return orderDate.getTime() === today.getTime()
    })
  }
  
  return [...filteredOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
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

export default function DashboardPage() {
  const [timePeriod, setTimePeriod] = useState<"today" | "week" | "month" | "year">("month")
  
  const { data: bookingsData, isLoading: bookingsLoading } = useGetBookingsQuery()
  const { data: customersData, isLoading: customersLoading } = useGetCustomersQuery()
  const { data: employeesData, isLoading: employeesLoading } = useGetEmployeesQuery()
  
  const orders: Order[] = bookingsData?.bookings || []
  const customers = customersData?.customers || []
  const employees = employeesData?.employees || []
  
  // Calculate statistics from real data with proper filtering
  const totalRevenue = orders
    .filter(order => order.paymentStatus === "paid")
    .reduce((sum, order) => sum + (order.amount || 0), 0)
  const totalCustomers = customers.filter(customer => customer.role === "customer" || !customer.role).length
  const totalEmployees = employees.filter(employee => employee.role === "employee" || !employee.role).length
  const totalOrders = orders.length
  const canceledOrders = orders.filter(order => order.status === "cancelled").length
  
  // Generate dynamic Revenue Trend data from bookings
  const chartData = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (!orders.length) {
      if (timePeriod === "today") {
        return Array.from({ length: 24 }, (_, i) => ({
          label: `${i}:00`,
          revenue: 0
        }))
      } else if (timePeriod === "week") {
        return [
          { label: "Mon", revenue: 0 },
          { label: "Tue", revenue: 0 },
          { label: "Wed", revenue: 0 },
          { label: "Thu", revenue: 0 },
          { label: "Fri", revenue: 0 },
          { label: "Sat", revenue: 0 },
          { label: "Sun", revenue: 0 },
        ]
      } else if (timePeriod === "month") {
        return [
          { label: "Week 1", revenue: 0 },
          { label: "Week 2", revenue: 0 },
          { label: "Week 3", revenue: 0 },
          { label: "Week 4", revenue: 0 },
        ]
      } else {
        return [
          { label: "Jan", revenue: 0 },
          { label: "Feb", revenue: 0 },
          { label: "Mar", revenue: 0 },
          { label: "Apr", revenue: 0 },
          { label: "May", revenue: 0 },
          { label: "Jun", revenue: 0 },
          { label: "Jul", revenue: 0 },
          { label: "Aug", revenue: 0 },
          { label: "Sep", revenue: 0 },
          { label: "Oct", revenue: 0 },
          { label: "Nov", revenue: 0 },
          { label: "Dec", revenue: 0 },
        ]
      }
    }
    
    const revenueData: Record<string, number> = {}
    
    orders.forEach(order => {
      if (order.paymentStatus !== "paid") return
      
      const orderDate = new Date(order.date)
      
      if (timePeriod === "today") {
        const orderDateStart = new Date(orderDate)
        orderDateStart.setHours(0, 0, 0, 0)
        
        if (orderDateStart.getTime() !== today.getTime()) return
        
        const hour = orderDate.getHours()
        const label = `${hour}:00`
        revenueData[label] = (revenueData[label] || 0) + (order.amount || 0)
      } else {
        let label: string
        
        if (timePeriod === "week") {
          const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
          label = days[orderDate.getDay()]
        } else if (timePeriod === "month") {
          const weekNum = Math.ceil(orderDate.getDate() / 7)
          label = `Week ${weekNum}`
        } else {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
          label = months[orderDate.getMonth()]
        }
        
        revenueData[label] = (revenueData[label] || 0) + (order.amount || 0)
      }
    })
    
    let labels: string[]
    if (timePeriod === "today") {
      labels = Array.from({ length: 24 }, (_, i) => `${i}:00`)
    } else if (timePeriod === "week") {
      labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    } else if (timePeriod === "month") {
      labels = ["Week 1", "Week 2", "Week 3", "Week 4"]
    } else {
      labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    }
    
    return labels.map(label => ({
      label,
      revenue: revenueData[label] || 0
    }))
  }, [orders, timePeriod])
  
  // Generate dynamic Bookings by Category data
  const categoryData = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let filteredOrders = orders
    
    if (timePeriod === "today") {
      filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.date)
        orderDate.setHours(0, 0, 0, 0)
        return orderDate.getTime() === today.getTime()
      })
    }
    
    if (!filteredOrders.length) {
      return [
        { name: "Plumbing", value: 0 },
        { name: "Electrical", value: 0 },
        { name: "Carpentry", value: 0 },
        { name: "Painting", value: 0 },
      ]
    }
    
    const categoryCounts: Record<string, number> = {}
    
    filteredOrders.forEach(order => {
      const category = order.category || "Other"
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    })
    
    return Object.entries(categoryCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [orders, timePeriod])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-balance">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to RepairOnGo admin panel</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          subtitle="+20.1% from last month"
          subtitleClassName="text-xs text-green-600"
          icon={<TrendingUp className="text-primary" size={18} />}
        />
        <StatCard
          title="Total Customers"
          value={totalCustomers.toLocaleString("en-IN")}
          subtitle="+15% from last month"
          subtitleClassName="text-xs text-green-600"
          icon={<Users className="text-primary" size={18} />}
        />
        <StatCard
          title="Total Employees"
          value={totalEmployees.toLocaleString("en-IN")}
          subtitle="Active staff members"
          subtitleClassName="text-xs text-muted-foreground"
          icon={<Zap className="text-primary" size={18} />}
        />
        <StatCard
          title="Total Orders"
          value={totalOrders.toLocaleString("en-IN")}
          subtitle="+8% from last month"
          subtitleClassName="text-xs text-green-600"
          icon={<Clock className="text-primary" size={18} />}
        />
        <StatCard
          title="Canceled Orders"
          value={canceledOrders.toLocaleString("en-IN")}
          subtitle={totalOrders > 0 ? `${((canceledOrders / totalOrders) * 100).toFixed(1)}% of total orders` : "0% of total orders"}
          subtitleClassName="text-xs text-muted-foreground"
        />
      </div>

      <div className="flex gap-2">
        {(["today", "week", "month", "year"] as const).map((period) => (
          <button
            key={period}
            onClick={() => setTimePeriod(period)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
              timePeriod === period
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="space-y-6">
        {/* Revenue Trend - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend ({timePeriod})</CardTitle>
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

        {/* Bookings by Category - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings by Category ({timePeriod})</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value} bookings`, "Count"]} />
                <Bar dataKey="value" fill="#ED2C2C" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={20} />
            Latest Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getLatestBookings(orders, timePeriod).map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{booking.bookingId || booking.id}</p>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{booking.customer}</p>
                  <p className="text-xs text-muted-foreground">{booking.service}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{booking.amount}</p>
                  <p className="text-xs text-muted-foreground">{new Date(booking.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {getLatestBookings(orders, timePeriod).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No bookings {timePeriod === "today" ? "today" : `for this ${timePeriod}`}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
