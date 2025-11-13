"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { mockOrders } from "@/data/orders"
import { useState } from "react"
import { Clock, TrendingUp, Users, Zap } from "lucide-react"
import { calculateStats } from "@/utils/stats" // Assuming this function is defined elsewhere

// Generate data based on time period
const generateChartData = (period: "week" | "month" | "year") => {
  const baseData = {
    week: [
      { label: "Mon", revenue: 2400 },
      { label: "Tue", revenue: 1398 },
      { label: "Wed", revenue: 9800 },
      { label: "Thu", revenue: 3908 },
      { label: "Fri", revenue: 4800 },
      { label: "Sat", revenue: 3800 },
      { label: "Sun", revenue: 4300 },
    ],
    month: [
      { label: "Week 1", revenue: 4000 },
      { label: "Week 2", revenue: 3000 },
      { label: "Week 3", revenue: 2000 },
      { label: "Week 4", revenue: 2780 },
    ],
    year: [
      { label: "Jan", revenue: 4000 },
      { label: "Feb", revenue: 3000 },
      { label: "Mar", revenue: 2000 },
      { label: "Apr", revenue: 2780 },
      { label: "May", revenue: 1890 },
      { label: "Jun", revenue: 2390 },
    ],
  }
  return baseData[period]
}

const categoryData = [
  { name: "Plumbing", value: 35 },
  { name: "Electrical", value: 25 },
  { name: "Carpentry", value: 20 },
  { name: "Painting", value: 20 },
]

const statusData = [
  { name: "Completed", value: 60 },
  { name: "In Progress", value: 25 },
  { name: "Pending", value: 15 },
]

const employeeData = [
  { name: "John", performance: 85 },
  { name: "Sarah", performance: 90 },
  { name: "Mike", performance: 75 },
  { name: "Emma", performance: 88 },
]

const COLORS = ["#ED2C2C", "#3B82F6", "#10B981", "#F59E0B"]

const getLatestBookings = () => {
  return [...mockOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    created: "bg-yellow-100 text-yellow-800",
    verified: "bg-blue-100 text-blue-800",
    picked: "bg-purple-100 text-purple-800",
    repaired: "bg-orange-100 text-orange-800",
    delivered: "bg-green-100 text-green-800",
  }
  return colors[status] || "bg-gray-100 text-gray-800"
}

export default function DashboardPage() {
  const [timePeriod, setTimePeriod] = useState<"week" | "month" | "year">("month")
  const chartData = generateChartData(timePeriod)
  const stats = calculateStats(mockOrders) // Assuming this function calculates totalRevenue and pendingAmount

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-balance">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to RepairOnGo admin panel</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="text-primary" size={18} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue}</div>
            <p className="text-xs text-green-600">+20.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="text-primary" size={18} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-green-600">+15% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Zap className="text-primary" size={18} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">Active staff members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Clock className="text-primary" size={18} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,456</div>
            <p className="text-xs text-green-600">+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceled Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">2.6% of total orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.pendingAmount}</div>
            <p className="text-xs text-muted-foreground">Amount pending for delivery</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        {(["week", "month", "year"] as const).map((period) => (
          <button
            key={period}
            onClick={() => setTimePeriod(period)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#ED2C2C" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bookings by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#ED2C2C" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="performance" fill="#ED2C2C" />
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
            {getLatestBookings().map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{booking.id}</p>
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
