"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { mockCustomers } from "@/data/customers"

const mockBookingHistory = [
  { id: "O001", service: "Plumbing Repair", date: "2024-01-15", status: "completed", amount: "₹150" },
  { id: "O002", service: "Electrical Wiring", date: "2024-01-18", status: "completed", amount: "₹200" },
  { id: "O003", service: "Carpentry Work", date: "2024-02-05", status: "pending", amount: "₹350" },
]

export default function CustomerDetailPage() {
  const params = useParams()
  const customer = mockCustomers.find((c) => c.id === params.id)

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-semibold">Customer not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/customers">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{customer.name}</h1>
          <p className="text-muted-foreground">Customer Profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{customer.email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{customer.phone}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">City</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{customer.city}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                {customer.status === "active" ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Orders:</span>
              <span className="font-semibold">{customer.totalOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Join Date:</span>
              <span className="font-semibold">{customer.joinDate}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Spent:</span>
              <span className="font-semibold">₹4,250</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average Rating:</span>
              <span className="font-semibold">4.8/5.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Order:</span>
              <span className="font-semibold">2 weeks ago</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Order ID</th>
                  <th className="text-left py-3 px-4 font-semibold">Service</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {mockBookingHistory.map((booking) => (
                  <tr key={booking.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 font-mono text-xs">{booking.id}</td>
                    <td className="py-3 px-4">{booking.service}</td>
                    <td className="py-3 px-4">{booking.date}</td>
                    <td className="py-3 px-4">
                      <Badge variant={booking.status === "completed" ? "default" : "secondary"}>
                        {booking.status === "completed" ? "Completed" : "Pending"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold">{booking.amount}</td>
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
