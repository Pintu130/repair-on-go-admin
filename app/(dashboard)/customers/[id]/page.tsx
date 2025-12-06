"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Phone, MapPin, User, Calendar, DollarSign, Star, Clock, Package, Home, MapPinned, Building2, TrendingUp, Award, AlertCircle, Coins } from "lucide-react"
import { mockCustomers } from "@/data/customers"
import { StatusBadge } from "@/components/common/status-badge"
import { InfoCard } from "@/components/common/info-card"

const mockBookingHistory = [
  { id: "O001", service: "Plumbing Repair", date: "2024-01-15", status: "completed", amount: "₹150" },
  { id: "O002", service: "Electrical Wiring", date: "2024-01-18", status: "completed", amount: "₹200" },
  { id: "O003", service: "Carpentry Work", date: "2024-02-05", status: "pending", amount: "₹350" },
]

export default function CustomerDetailPage() {
  const params = useParams()
  const customer = mockCustomers.find((c) => c.id === "9")

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-semibold">Customer not found</p>
      </div>
    )
  }

  // Calculate business metrics from booking history
  const totalEarned = mockBookingHistory
    .filter((booking) => booking.status === "completed")
    .reduce((sum, booking) => {
      const amount = parseInt(booking.amount.replace("₹", "").replace(",", ""))
      return sum + amount
    }, 0)

  const completedOrders = mockBookingHistory.filter((booking) => booking.status === "completed").length
  const totalOrders = mockBookingHistory.length
  const orderPerformance = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0

  // Calculate pending orders metrics
  const pendingOrders = mockBookingHistory.filter((booking) => booking.status === "pending")
  const totalPendingOrders = pendingOrders.length
  const totalPendingAmount = pendingOrders.reduce((sum, booking) => {
    const amount = parseInt(booking.amount.replace("₹", "").replace(",", ""))
    return sum + amount
  }, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/customers">
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <p className="text-sm text-muted-foreground">Customer Details</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <InfoCard
          icon={Coins}
          label="Total Earned"
          value={`₹${totalEarned.toLocaleString()}`}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
        />
        <InfoCard
          icon={Package}
          label="Total Orders"
          value={totalOrders.toString()}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
        />
        <InfoCard
          icon={TrendingUp}
          label="Order Performance"
          value={`${orderPerformance}%`}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-500/10"
        />
        <InfoCard
          icon={AlertCircle}
          label="Pending Orders"
          value={`${totalPendingOrders} (₹${totalPendingAmount.toLocaleString()})`}
          iconColor="text-yellow-500"
          iconBgColor="bg-yellow-500/10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="">
            <CardTitle className="text-base flex items-center gap-2">
              <User size={16} />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                  <User size={12} />
                </div>
                First Name
              </div>
              <span className="text-sm font-semibold">{customer.firstName || customer.name.split(" ")[0] || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                  <User size={12} />
                </div>
                Last Name
              </div>
              <span className="text-sm font-semibold">{customer.lastName || customer.name.split(" ").slice(1).join(" ") || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                  <Calendar size={12} />
                </div>
                Age
              </div>
              <span className="text-sm font-semibold">{customer.age || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                  <Phone size={12} />
                </div>
                Mobile Number
              </div>
              <span className="text-sm font-semibold">{customer.mobileNumber || customer.phone || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                  <Mail size={12} />
                </div>
                Email Address
              </div>
              <span className="text-sm font-semibold truncate">{customer.email}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="">
            <CardTitle className="text-base flex items-center gap-2">
              <Home size={16} />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                  <Building2 size={12} />
                </div>
                House No/Building
              </div>
              <span className="text-sm font-semibold">{customer.houseNo || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                  <MapPinned size={12} />
                </div>
                Road Name/Area
              </div>
              <span className="text-sm font-semibold">{customer.roadName || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                  <MapPin size={12} />
                </div>
                Nearby Landmark
              </div>
              <span className="text-sm font-semibold">{customer.nearbyLandmark || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                  <MapPin size={12} />
                </div>
                State
              </div>
              <span className="text-sm font-semibold">{customer.state || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                  <MapPin size={12} />
                </div>
                City
              </div>
              <span className="text-sm font-semibold">{customer.city || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                  <MapPin size={12} />
                </div>
                Pincode
              </div>
              <span className="text-sm font-semibold">{customer.pincode || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                  <Home size={12} />
                </div>
                Address Type
              </div>
              <span className="text-sm font-semibold">{customer.addressType || "N/A"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="">
            <CardTitle className="text-base flex items-center gap-2">
              <User size={16} />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                  <User size={12} />
                </div>
                Status
              </div>
              <StatusBadge status={customer.status} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                  <Package size={12} />
                </div>
                Total Orders
              </div>
              <span className="text-sm font-semibold">{customer.totalOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                  <Calendar size={12} />
                </div>
                Join Date
              </div>
              <span className="text-sm font-semibold">{customer.joinDate}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign size={16} />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                  <DollarSign size={12} />
                </div>
                Total Spent
              </div>
              <span className="text-sm font-semibold">₹4,250</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                  <Star size={12} />
                </div>
                Average Rating
              </div>
              <span className="text-sm font-semibold">4.8/5.0</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                  <Clock size={12} />
                </div>
                Last Order
              </div>
              <span className="text-sm font-semibold">2 weeks ago</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package size={16} />
            Booking History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-2 px-3 font-semibold text-xs">Order ID</th>
                  <th className="text-left py-2 px-3 font-semibold text-xs">Service</th>
                  <th className="text-left py-2 px-3 font-semibold text-xs">Date</th>
                  <th className="text-left py-2 px-3 font-semibold text-xs">Status</th>
                  <th className="text-left py-2 px-3 font-semibold text-xs">Amount</th>
                </tr>
              </thead>
              <tbody>
                {mockBookingHistory.map((booking) => (
                  <tr key={booking.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-2.5 px-3 font-mono text-xs">{booking.id}</td>
                    <td className="py-2.5 px-3">{booking.service}</td>
                    <td className="py-2.5 px-3">{booking.date}</td>
                    <td className="py-2.5 px-3">
                      <Badge 
                        variant={booking.status === "completed" ? "default" : "secondary"}
                        className={booking.status === "completed" 
                          ? "bg-green-500 hover:bg-green-600 text-white border-green-600" 
                          : "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600"
                        }
                      >
                        {booking.status === "completed" ? "Completed" : "Pending"}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 font-semibold">{booking.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
