"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Folder, IndianRupee, AlertCircle } from "lucide-react"
import { type Order } from "@/data/orders"
import { InfoCard } from "@/components/common/info-card"
import { OrderHeaderBadges } from "@/components/common/order-header-badges"
import { OrderTimeline } from "@/components/common/order-timeline"
import { CustomerSubmission } from "@/components/common/customer-submission"
import { AdditionalInformation } from "@/components/common/additional-information"
import { QuickActions } from "@/components/common/quick-actions"
import { ServiceCenterModal } from "@/components/common/service-center-modal"
import { useGetBookingByIdQuery, useUpdateBookingMutation } from "@/lib/store/api/bookingsApi"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OrderDetailSkeleton } from "@/components/common/order-detail-skeleton"
import { useToast } from "@/hooks/use-toast"

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
  const bookingId = params.id as string
  
  // Fetch booking from Firebase
  const { data: bookingData, isLoading, error, refetch } = useGetBookingByIdQuery(bookingId)
  
  // Update booking mutation
  const [updateBooking, { isLoading: isSaving }] = useUpdateBookingMutation()
  
  const { toast } = useToast()
  
  const [order, setOrder] = useState<Order | undefined>(bookingData?.booking || undefined)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)

  // Update order when data is fetched
  useEffect(() => {
    if (bookingData?.booking) {
      setOrder(bookingData.booking)
    }
  }, [bookingData])

  // Show loading state
  if (isLoading) {
    return <OrderDetailSkeleton />
  }

  // Show error state
  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <p className="text-destructive text-lg font-semibold">Order not found</p>
          <div className="flex gap-2">
            <Button onClick={() => refetch()} variant="outline">
              Retry
            </Button>
            <Link href="/orders">
              <Button variant="outline">Back to Orders</Button>
            </Link>
          </div>
        </div>
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
    const serviceCenterIndex = statusSteps.indexOf("serviceCenter")
    const newStatusIndex = statusSteps.indexOf(newStatus)
    
    // If changing from serviceCenter to a previous status, clear serviceReason and serviceAmount
    const shouldClearServiceFields = order.status === "serviceCenter" && newStatusIndex < serviceCenterIndex
    
    setOrder({
      ...order,
      status: newStatus,
      ...(reason && { serviceReason: reason }),
      ...(amount && { serviceAmount: amount }),
      // Clear serviceReason and serviceAmount if moving to a previous status
      ...(shouldClearServiceFields && {
        serviceReason: undefined,
        serviceAmount: undefined,
      }),
    })
    // TODO: API call here
    // When API is ready, send email notification
    console.log(`Status updated to: ${newStatus}`, { reason, amount })
  }

  // Handle Service Center form submit
  const handleServiceCenterSubmit = (data: { reason: string; amount?: number }) => {
    updateStatus("serviceCenter", data.reason, data.amount)
  }

  // Handle save to Firebase
  const handleSave = async () => {
    if (!order) return

    try {
      const updates: {
        status?: string
        serviceReason?: string
        serviceAmount?: number
        cancelledAtStatus?: string
        servicePaymentMethod?: string
        servicePaymentStatus?: string
      } = {
        status: order.status,
      }

      // Check if status is before serviceCenter
      const serviceCenterIndex = statusSteps.indexOf("serviceCenter")
      const currentStatusIndex = statusSteps.indexOf(order.status)
      const isBeforeServiceCenter = currentStatusIndex < serviceCenterIndex
      const isServiceCenterOrAfter = currentStatusIndex >= serviceCenterIndex

      // If status is at or after serviceCenter, include serviceReason and serviceAmount
      if (isServiceCenterOrAfter && order.serviceReason) {
        updates.serviceReason = order.serviceReason
        if (order.serviceAmount !== undefined) {
          updates.serviceAmount = order.serviceAmount
        }
      } else if (isBeforeServiceCenter) {
        // If status is before serviceCenter, clear serviceReason and serviceAmount
        updates.serviceReason = null as any
        updates.serviceAmount = null as any
      }

      // Always include servicePaymentMethod and servicePaymentStatus when available
      if (order.servicePaymentMethod) updates.servicePaymentMethod = order.servicePaymentMethod
      if (order.servicePaymentStatus) updates.servicePaymentStatus = order.servicePaymentStatus

      // If status is cancelled, include cancelledAtStatus
      if (order.status === "cancelled" && order.cancelledAtStatus) {
        updates.cancelledAtStatus = order.cancelledAtStatus
      }

      await updateBooking({
        bookingId: order.bookingId || order.id,
        updates,
      }).unwrap()

      // Refetch to get updated data
      await refetch()
      
      // Show success toast message
      toast({
        title: "Success",
        description: "Booking status updated successfully",
      })
    } catch (error: any) {
      console.error("❌ Error updating booking:", error)
      alert(error?.data || error?.message || "Failed to update booking. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{order.bookingId || order.id}</h1>
            <p className="text-muted-foreground text-sm">Order Details</p>
          </div>
          <OrderHeaderBadges order={order} statusLabels={statusLabels} />
        </div>
        <div className="flex items-center gap-3">
          <a href={`/orders/details/${order.bookingId || order.id}`} target="_blank" rel="noopener noreferrer">
            <Button variant="default" className="shrink-0 cursor-pointer">
              Details
            </Button>
          </a>
          <Link href="/orders">
            <Button variant="outline" className="shrink-0 cursor-pointer">
              <ArrowLeft size={20} className="mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      {/* Cancellation message: show when status is cancelled and cancellationMessage exists */}
      {order.status === "cancelled" && order.cancellationMessage?.trim() && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="destructive" className="shrink-0">
              Cancelled
            </Badge>
            <span className="text-sm text-foreground">{order.cancellationMessage}</span>
          </div>
        </div>
      )}

      {/* Key Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard
          icon={User}
          label="Customer"
          value={order.customer}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
          href={order.customerId ? `/customers/${order.customerId}` : undefined}
        />
        <InfoCard
          icon={Folder}
          label="Category"
          value={order.category}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-500/10"
          href="/categories"
        />
        <InfoCard
          icon={IndianRupee}
          label="Booking Amount"
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
        order={order}
      />

      {/* Quick Actions */}
      <QuickActions
        order={order}
        statusSteps={statusSteps}
        statusLabels={statusLabels}
        onStatusUpdate={handleStatusUpdate}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* Service Center Details - Show when status is at or after serviceCenter */}
      {(() => {
        const serviceCenterIndex = statusSteps.indexOf("serviceCenter")
        const currentIdx = statusSteps.indexOf(order.status)
        if (currentIdx < serviceCenterIndex) return null

        return (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">Service Center Details</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Service, payment & pickup information</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Service Payment Method */}
                {order.servicePaymentMethod && (
                  <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Service Payment Method</span>
                    <span className="text-base font-semibold capitalize">{order.servicePaymentMethod.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                )}
                {/* Service Payment Status */}
                {order.servicePaymentStatus && (
                  <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Service Payment Status</span>
                    <Badge className={`w-fit ${
                      order.servicePaymentStatus === "paid"
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : order.servicePaymentStatus === "pending"
                        ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                        : "bg-gray-500 hover:bg-gray-600 text-white"
                    }`}>
                      {order.servicePaymentStatus.charAt(0).toUpperCase() + order.servicePaymentStatus.slice(1)}
                    </Badge>
                  </div>
                )}
                {/* Service Amount */}
                {order.serviceAmount !== undefined && (
                  <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Service Amount</span>
                    <span className="text-base font-semibold">₹{order.serviceAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {/* Service Reason */}
                {order.serviceReason && (
                  <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 md:col-span-2 lg:col-span-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Service Reason</span>
                    <span className="text-base font-semibold">{order.serviceReason}</span>
                  </div>
                )}

                {/* Razorpay Payment Details */}
                {order.razorpayOrderId && (
                  <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Razorpay Order ID</span>
                    <span className="text-sm font-mono font-semibold break-all">{order.razorpayOrderId}</span>
                  </div>
                )}
                {order.razorpayPaymentId && (
                  <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Razorpay Payment ID</span>
                    <span className="text-sm font-mono font-semibold break-all">{order.razorpayPaymentId}</span>
                  </div>
                )}
                {order.razorpaySignature && (
                  <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Razorpay Signature</span>
                    <span className="text-sm font-mono font-semibold break-all">{order.razorpaySignature}</span>
                  </div>
                )}

                {/* Pickup Employee Details */}
                {order.pickupEmployeeName && (
                  <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pickup Employee Name</span>
                    <span className="text-base font-semibold">{order.pickupEmployeeName}</span>
                  </div>
                )}
                {order.pickupEmployeeId && (
                  <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pickup Employee ID</span>
                    <span className="text-sm font-mono font-semibold break-all">{order.pickupEmployeeId}</span>
                  </div>
                )}
                {(order.pickupOtp !== undefined || order.otp?.pickup) && (
                  <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pickup OTP</span>
                    <span className="text-base font-semibold font-mono tracking-wider text-primary">{order.pickupOtp || order.otp?.pickup || "N/A"}</span>
                    {order.pickupOtpAt && (
                      <span className="text-xs text-muted-foreground">{new Date(order.pickupOtpAt).toLocaleString("en-IN")}</span>
                    )}
                  </div>
                )}

                {/* Delivery Employee Details */}
                {order.deliveryEmployeeName && (
                  <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Delivery Employee Name</span>
                    <span className="text-base font-semibold">{order.deliveryEmployeeName}</span>
                  </div>
                )}
                {order.deliveryEmployeeId && (
                  <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Delivery Employee ID</span>
                    <span className="text-sm font-mono font-semibold break-all">{order.deliveryEmployeeId}</span>
                  </div>
                )}
                {(order.deliveryOtp !== undefined || order.otp?.delivery) && (
                  <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Delivery OTP</span>
                    <span className="text-base font-semibold font-mono tracking-wider text-primary">{order.deliveryOtp || order.otp?.delivery || "N/A"}</span>
                    {order.deliveryOtpAt && (
                      <span className="text-xs text-muted-foreground">{new Date(order.deliveryOtpAt).toLocaleString("en-IN")}</span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {/* Service Center Modal */}
      <ServiceCenterModal
        open={isServiceModalOpen}
        onOpenChange={setIsServiceModalOpen}
        onSubmit={handleServiceCenterSubmit}
      />

      {/* Additional Information */}
      <AdditionalInformation order={order} statusLabels={statusLabels} />
    </div>
  )
}
