"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, User, Folder, IndianRupee, Smartphone, Banknote, CreditCard, Settings2, FileText, DollarSign } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockOrders, type Order } from "@/data/orders"
import { InfoCard } from "@/components/common/info-card"
import { OrderHeaderBadges } from "@/components/common/order-header-badges"
import { OrderTimeline } from "@/components/common/order-timeline"
import { CustomerSubmission } from "@/components/common/customer-submission"

const statusSteps = ["booked", "confirmed", "picked", "serviceCenter", "repair", "outForDelivery", "delivered"]
const statusLabels = {
  booked: "Order Booked",
  confirmed: "Confirmed",
  picked: "Pickup",
  serviceCenter: "Service Center",
  repair: "Repair",
  outForDelivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

export default function OrderDetailPage() {
  const params = useParams()
  const initialOrder = mockOrders.find((o) => o.id === params.id)
  const [order, setOrder] = useState<Order | undefined>(initialOrder)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [serviceReason, setServiceReason] = useState("")
  const [serviceAmount, setServiceAmount] = useState("")

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-semibold">Order not found</p>
      </div>
    )
  }

  const isCancelled = order.status === "cancelled"
  // Find the status index where order was cancelled
  // If cancelled, use cancelledAtStatus to find the index, otherwise use current status
  const actualStatus = isCancelled && order.cancelledAtStatus 
    ? order.cancelledAtStatus 
    : order.status !== "cancelled" 
    ? order.status 
    : "booked" // fallback
  const currentStatusIndex = statusSteps.indexOf(actualStatus)

  // Get next status based on current status
  const getNextStatus = (currentStatus: Order["status"]): Order["status"] | null => {
    const currentIndex = statusSteps.indexOf(currentStatus)
    if (currentIndex < statusSteps.length - 1) {
      return statusSteps[currentIndex + 1] as Order["status"]
    }
    return null
  }

  // Handle status update
  const handleStatusUpdate = (newStatus: Order["status"]) => {
    if (newStatus === "cancelled") {
      // Cancel order - store the current status when cancelled
      const currentStatus = order.status
      setOrder({
        ...order,
        status: "cancelled" as Order["status"],
        cancelledAtStatus: currentStatus !== "cancelled" ? currentStatus : order.cancelledAtStatus, // Store the status at which it was cancelled
      })
      // TODO: API call here to cancel order
      console.log("Order cancelled at status:", currentStatus)
      return
    }
    if (newStatus === "serviceCenter") {
      setIsServiceModalOpen(true)
      return
    }
    updateStatus(newStatus)
  }

  // Update status
  const updateStatus = (newStatus: Order["status"], reason?: string, amount?: number) => {
    setOrder({
      ...order,
      status: newStatus,
      ...(reason && { serviceReason: reason }),
      ...(amount && { serviceAmount: amount }),
    })
    // TODO: API call here
    // When API is ready, send email notification
    console.log(`Status updated to: ${newStatus}`, { reason, amount })
  }

  // Handle Service Center form submit
  const handleServiceCenterSubmit = () => {
    if (!serviceReason.trim()) {
      alert("Please enter the reason for service")
      return
    }
    const amount = serviceAmount ? parseFloat(serviceAmount) : undefined
    updateStatus("serviceCenter", serviceReason, amount)
    setIsServiceModalOpen(false)
    setServiceReason("")
    setServiceAmount("")
  }

  // Get available actions based on current status
  const getAvailableActions = () => {
    const actions = []
    const currentIndex = statusSteps.indexOf(order.status)

    if (currentIndex < statusSteps.length - 1) {
      const nextStatus = statusSteps[currentIndex + 1] as Order["status"]
      actions.push({
        label: statusLabels[nextStatus],
        status: nextStatus,
        variant: nextStatus === "confirmed" ? "default" : "outline",
      })
    }

    return actions
  }

  const availableActions = getAvailableActions()

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/orders">
            <Button variant="ghost" size="icon" className="shrink-0 cursor-pointer">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{order.id}</h1>
            <p className="text-muted-foreground text-sm">Order Details</p>
          </div>
        </div>
        <OrderHeaderBadges order={order} statusLabels={statusLabels} />
      </div>

      {/* Key Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard
          icon={User}
          label="Customer"
          value={order.customer}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
        />
        <InfoCard
          icon={Folder}
          label="Category"
          value={order.category}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-500/10"
        />
        <InfoCard
          icon={IndianRupee}
          label="Amount"
          value={`₹${order.amount.toLocaleString("en-IN")}`}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
        />
      </div>

      {/* Customer Submission Section */}
      <CustomerSubmission
        images={order.images}
        audioRecording={order.audioRecording}
        textDescription={order.textDescription}
      />

      {/* Order Timeline */}
      <OrderTimeline
        statusSteps={statusSteps}
        statusLabels={statusLabels}
        currentStatusIndex={currentStatusIndex}
        orderDate={order.date}
        isCancelled={isCancelled}
        cancelledAtStatus={isCancelled ? order.cancelledAtStatus : undefined}
      />

      {/* Quick Actions */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">Manage order operations efficiently</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Update Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary"></div>
              <Label className="text-sm font-semibold text-foreground">Update Status</Label>
            </div>
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="w-full lg:w-[280px]">
                <Select
                  value={order.status}
                  onValueChange={(value) => {
                    if (value !== order.status) {
                      handleStatusUpdate(value as Order["status"])
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusSteps
                      .filter((step) => step !== "booked")
                      .map((step) => (
                        <SelectItem key={step} value={step} className="cursor-pointer">
                          {statusLabels[step as keyof typeof statusLabels]}
                        </SelectItem>
                      ))}
                    <SelectItem value="cancelled" className="cursor-pointer text-destructive">
                      Cancel Order
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Service Center Info Display - Right Side */}
              {order.status === "serviceCenter" && order.serviceReason && (
                <div className="flex-1 w-full lg:w-auto p-4 rounded-lg bg-muted/50 border">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-primary" />
                        <Label className="text-xs font-semibold text-muted-foreground">Service Reason</Label>
                      </div>
                      <p className="text-sm font-medium">{order.serviceReason}</p>
                    </div>
                    {order.serviceAmount && (
                      <div className="lg:w-[180px] space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-primary" />
                          <Label className="text-xs font-semibold text-muted-foreground">Service Amount</Label>
                        </div>
                        <p className="text-sm font-semibold">₹{order.serviceAmount.toLocaleString("en-IN")}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Service Center Modal */}
      <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Service Center Details</DialogTitle>
            <DialogDescription>
              Please provide the reason for service and optional service amount.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Service Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Describe the issue found in the product..."
                value={serviceReason}
                onChange={(e) => setServiceReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Service Amount (Optional)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter service amount"
                value={serviceAmount}
                onChange={(e) => setServiceAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsServiceModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleServiceCenterSubmit}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Additional Information */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Additional Information</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Complete order details</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mobile Number</span>
              <span className="text-base font-semibold">{order.mobileNumber || "N/A"}</span>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment Method</span>
              <div className="flex items-center gap-2">
                {order.paymentMethod === "UPI" && <Smartphone size={16} className="text-blue-500" />}
                {order.paymentMethod === "Cash" && <Banknote size={16} className="text-green-500" />}
                {order.paymentMethod === "Card" && <CreditCard size={16} className="text-purple-500" />}
                <span className="text-base font-semibold">{order.paymentMethod || "N/A"}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment Status</span>
              <Badge
                className={`w-fit ${
                  order.paymentStatus === "paid"
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : order.paymentStatus === "pending"
                    ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                    : order.paymentStatus === "cash"
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-500 hover:bg-gray-600 text-white"
                }`}
              >
                {order.paymentStatus
                  ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)
                  : "Pending"}
              </Badge>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Order Date</span>
              <span className="text-base font-semibold">
                {order.date
                  ? new Date(order.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A"}
              </span>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Order Status</span>
              <Badge className="w-fit bg-primary text-primary-foreground">
                {statusLabels[order.status as keyof typeof statusLabels] || order.status}
              </Badge>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Service</span>
              <span className="text-base font-semibold">{order.service || "N/A"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
