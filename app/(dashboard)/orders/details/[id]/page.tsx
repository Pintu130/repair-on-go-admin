"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/ui/loader"
import { ArrowLeft, User, Folder, IndianRupee, Calendar, ExternalLink } from "lucide-react"
import { useGetBookingByIdQuery } from "@/lib/store/api/bookingsApi"
import { useGetEmployeeByUidQuery } from "@/lib/store/api/employeesApi"

const statusLabels: Record<string, string> = {
  booked: "Order Booked",
  confirmed: "Confirmed",
  picked: "Pickup",
  serviceCenter: "Service Center",
  repair: "Repair",
  outForDelivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

function formatDateTime(dateStr: string | undefined) {
  if (!dateStr) return "N/A"
  try {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    })
  } catch {
    return dateStr
  }
}

function formatMobile(phone: string | undefined) {
  if (!phone) return "N/A"
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  return phone
}

function DetailRow({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (value === undefined || value === null || value === "") return null
  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-sm font-semibold break-all">{value}</span>
    </div>
  )
}

export default function OrderDetailsPage() {
  const params = useParams()
  const bookingId = params.id as string

  const { data: bookingData, isLoading: orderLoading, error: orderError } = useGetBookingByIdQuery(bookingId)
  const order = bookingData?.booking

  const pickupEmployeeUid = order?.pickupEmployeeId || order?.assignedEmployeeId
  const { data: employeeData } = useGetEmployeeByUidQuery(pickupEmployeeUid || "", { skip: !pickupEmployeeUid })
  const pickupEmployee = employeeData?.employee

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="lg" />
      </div>
    )
  }

  if (orderError || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-semibold text-destructive">Order not found</p>
        <Link href="/orders">
          <Button variant="outline" className="mt-4 cursor-pointer">Back to Orders</Button>
        </Link>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    paid: "bg-green-500 hover:bg-green-600",
    pending: "bg-yellow-500 hover:bg-yellow-600",
    cash: "bg-blue-500 hover:bg-blue-600",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{order.bookingId || order.id}</h1>
            <p className="text-muted-foreground text-sm">Order Details</p>
          </div>
          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-700 border-indigo-500">
            {statusLabels[order.status] || order.status}
          </Badge>
        </div>
        <Link href="/orders">
          <Button variant="outline" className="shrink-0 cursor-pointer">
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
        </Link>
      </div>

      {/* Order Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-blue-500/10">
                <User size={18} className="text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Customer</p>
                <p className="text-sm font-semibold truncate">{order.customer}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-purple-500/10">
                <Folder size={18} className="text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Category</p>
                <p className="text-sm font-semibold truncate">{order.category}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-green-500/10">
                <IndianRupee size={18} className="text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Booking Amount</p>
                <p className="text-sm font-semibold truncate">₹{order.amount.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-orange-500/10">
                <Calendar size={18} className="text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Order Date</p>
                <p className="text-sm font-semibold truncate">{formatDateTime(order.date)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-muted-foreground font-medium">Booking Payment Status</span>
          <Badge className={`w-fit text-white ${statusColors[order.paymentStatus] || "bg-gray-500"}`}>
            {order.paymentStatus ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1) : "Pending"}
          </Badge>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-muted-foreground font-medium">Booking Payment Method</span>
          <Badge variant="outline" className={
            order.paymentMethod === "UPI" ? "bg-blue-500/10 text-blue-700 border-blue-500" :
            order.paymentMethod === "Cash" ? "bg-green-500/10 text-green-700 border-green-500" :
            "bg-purple-500/10 text-purple-700 border-purple-500"
          }>
            {order.paymentMethod || "N/A"}
          </Badge>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-muted-foreground font-medium">Order Status</span>
          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-700 border-indigo-500">
            {statusLabels[order.status] || order.status}
          </Badge>
        </div>
      </div>

      {/* Customer Info */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Customer Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <DetailRow label="Name" value={order.customer} />
          <DetailRow label="Mobile Number" value={formatMobile(order.mobileNumber)} />
          <DetailRow label="Customer Email" value={order.customerEmail} />
          <DetailRow label="Customer ID" value={order.customerId} />
          <DetailRow label="Customer UID" value={order.customerUid} />
        </div>
      </div>

      {/* Service Details */}
      {order.serviceReason && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">Service Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailRow label="Service Reason" value={order.serviceReason} />
              {order.serviceAmount !== undefined && <DetailRow label="Service Amount" value={`₹${order.serviceAmount.toLocaleString("en-IN")}`} />}
              <DetailRow label="Service Payment Method" value={order.servicePaymentMethod} />
              <DetailRow label="Service Payment Status" value={order.servicePaymentStatus} />
              <DetailRow label="Description" value={order.textDescription} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Gateway Details */}
      {(order.razorpayOrderId || order.razorpayPaymentId || order.razorpaySignature) && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Payment Gateway Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <DetailRow label="Razorpay Order ID" value={order.razorpayOrderId} />
            <DetailRow label="Razorpay Payment ID" value={order.razorpayPaymentId} />
            <DetailRow label="Razorpay Signature" value={order.razorpaySignature} />
          </div>
        </div>
      )}

      {/* Pickup Details */}
      {(order.pickupEmployeeName || order.pickupOtp || order.otp?.pickup) && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Pickup Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pickupEmployee ? (
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pickup Employee Name</span>
                <a
                  href={`/employees/${pickupEmployee.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  {order.pickupEmployeeName}
                  <ExternalLink size={14} />
                </a>
              </div>
            ) : (
              <DetailRow label="Pickup Employee Name" value={order.pickupEmployeeName} />
            )}
            <DetailRow label="Pickup Employee ID" value={order.pickupEmployeeId} />
            {(order.pickupOtp || order.otp?.pickup) && (
              <DetailRow label="Pickup OTP" value={order.pickupOtp || order.otp?.pickup} />
            )}
            {order.statusTimestamps?.picked && <DetailRow label="Picked At" value={formatDateTime(order.statusTimestamps.picked)} />}
          </div>
        </div>
      )}

      {/* Order Timestamps */}
      {order.statusTimestamps && Object.keys(order.statusTimestamps).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Order Timeline</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(order.statusTimestamps).map(([key, value]) => (
              <DetailRow key={key} label={`${key.charAt(0).toUpperCase() + key.slice(1)} At`} value={formatDateTime(value)} />
            ))}
          </div>
        </div>
      )}

      {/* Cancellation Info */}
      {order.status === "cancelled" && order.cancellationMessage && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-destructive">Cancellation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Cancellation Message" value={order.cancellationMessage} />
            {order.cancelledAtStatus && <DetailRow label="Cancelled At Status" value={statusLabels[order.cancelledAtStatus] || order.cancelledAtStatus} />}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
