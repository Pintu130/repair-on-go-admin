"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Check } from "lucide-react"
import { mockOrders } from "@/data/orders"

const statusSteps = ["booked", "verify", "confirmed", "picked", "serviceCenter", "repair", "outForDelivery", "delivered"]
const statusLabels = {
  booked: "Verify",
  verify: "Verify",
  confirmed: "Confirmed",
  picked: "Pickup",
  serviceCenter: "Service Center",
  repair: "Repair",
  outForDelivery: "Out for Delivery",
  delivered: "Delivered",
}

export default function OrderDetailPage() {
  const params = useParams()
  const order = mockOrders.find((o) => o.id === params.id)

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-semibold">Order not found</p>
      </div>
    )
  }

  const currentStatusIndex = statusSteps.indexOf(order.status)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{order.id}</h1>
          <p className="text-muted-foreground">Order Details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{order.customer}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Service</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{order.service}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">${order.amount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStatusIndex
              const isCurrent = index === currentStatusIndex
              return (
                <div key={step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                        isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted && <Check size={20} />}
                      {!isCompleted && index + 1}
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className={`w-1 h-12 mt-2 ${isCompleted ? "bg-primary" : "bg-muted"}`} />
                    )}
                  </div>
                  <div className="pb-6 flex-1">
                    <h3 className={`font-semibold ${isCurrent ? "text-primary" : ""}`}>
                      {statusLabels[step as keyof typeof statusLabels]}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isCurrent ? "Currently in progress" : isCompleted ? "Completed" : "Pending"}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Verify Order</Button>
            <Button variant="outline">Assign to Employee</Button>
            <Button variant="outline">Add Cost</Button>
            <Button variant="outline">Approve</Button>
            <Button variant="outline">Deliver</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date Created:</span>
            <span className="font-semibold">{order.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Category:</span>
            <span className="font-semibold">{order.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Status:</span>
            <Badge className="bg-primary text-primary-foreground">
              {statusLabels[order.status as keyof typeof statusLabels]}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
