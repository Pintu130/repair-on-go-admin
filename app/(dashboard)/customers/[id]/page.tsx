"use client"

import React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, Package, TrendingUp, AlertCircle, Coins } from "lucide-react"
import { useGetCustomerByIdQuery } from "@/lib/store/api/customersApi"
import { useGetBookingsByCustomerIdQuery } from "@/lib/store/api/bookingsApi"
import { useGetReviewsByCustomerIdQuery } from "@/lib/store/api/reviewsApi"
import { InfoCard } from "@/components/common/info-card"
import { Loader } from "@/components/ui/loader"
import { BookingHistory } from "@/components/common/booking-history"
import { PersonalInformation } from "@/components/common/personal-information"
import { AddressInformation } from "@/components/common/address-information"
import { AccountStatistics } from "@/components/common/account-statistics"

export default function CustomerDetailPage() {
  const params = useParams()
  const customerId = params.id as string

  // Fetch customer details from Firebase
  const { data: customerData, isLoading: customerLoading, isError: customerError } = useGetCustomerByIdQuery(customerId)
  const { data: bookingsData, isLoading: bookingsLoading, isError: bookingsError } = useGetBookingsByCustomerIdQuery(customerId)
  
  const customer = customerData?.customer
  const { data: reviewsData, isLoading: reviewsLoading, isError: reviewsError } = useGetReviewsByCustomerIdQuery(customer?.uid || "")

  const bookings = bookingsData?.bookings || []
  const reviews = reviewsData?.reviews || []

  // State for service details modal is now handled in BookingHistory component

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "0.0"

  // Loading state
  if (customerLoading || bookingsLoading || reviewsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="lg" />
      </div>
    )
  }

  // Error state
  if (customerError || bookingsError || !customer) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-semibold text-destructive">Customer not found</p>
        <p className="text-sm text-muted-foreground mt-2">
          {customerError ? "Failed to load customer data" : "Customer does not exist"}
        </p>
        <Link href="/customers">
          <Button variant="outline" className="mt-4 cursor-pointer">
            Back to Customers
          </Button>
        </Link>
      </div>
    )
  }

  // Calculate business metrics from booking history
  const completedBookings = bookings.filter((booking) => booking.status === "delivered")
  const totalEarned = completedBookings.reduce((sum, booking) => {
    const amount = parseFloat(booking.amount?.toString() || "0")
    return sum + amount
  }, 0)

  const totalOrders = bookings.length
  const completedOrders = completedBookings.length
  const orderPerformance = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0

  // Calculate pending orders metrics
  const pendingBookings = bookings.filter((booking) => 
    booking.status === "booked" || booking.status === "confirmed" || booking.status === "picked"
  )
  const totalPendingOrders = pendingBookings.length
  const totalPendingAmount = pendingBookings.reduce((sum, booking) => {
    const amount = parseFloat(booking.amount?.toString() || "0")
    return sum + amount
  }, 0)

  // Get last order date
  const lastOrder = bookings.length > 0 ? bookings[0] : null
  const lastOrderDate = lastOrder ? new Date(lastOrder.date).toLocaleString('en-GB', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }) : "N/A"

  // Format customer name
  const getCustomerName = () => {
    if (customer.firstName && customer.lastName) {
      return `${customer.firstName} ${customer.lastName}`
    }
    return customer.name || "Unknown Customer"
  }

  // Format date with time (proper timezone handling)
  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      })
    } catch (e) {
      return dateString
    }
  }

  // Format mobile number
  const formatMobileNumber = (number: string | undefined) => {
    if (!number) return "N/A"
    const digits = number.replace(/\D/g, "")
    if (digits.length === 10) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
    }
    return number
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-500 hover:bg-green-600 text-white border-green-600"
      case "cancelled":
        return "bg-red-500 hover:bg-red-600 text-white border-red-600"
      case "booked":
      case "confirmed":
      case "picked":
        return "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600"
      case "serviceCenter":
      case "repair":
      case "outForDelivery":
        return "bg-blue-500 hover:bg-blue-600 text-white border-blue-600"
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white border-gray-600"
    }
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case "delivered": return "Completed"
      case "cancelled": return "Cancelled"
      case "booked": return "Booked"
      case "confirmed": return "Confirmed"
      case "picked": return "Picked"
      case "serviceCenter": return "Service Center"
      case "repair": return "Repair"
      case "outForDelivery": return "Out for Delivery"
      default: return status
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {customer.avatar ? (
              <img 
                src={customer.avatar} 
                alt={getCustomerName()} 
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <User size={24} className="text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{getCustomerName()}</h1>
            <p className="text-sm text-muted-foreground">Customer Details</p>
          </div>
        </div>
        <Link href="/customers">
          <Button variant="outline" className="cursor-pointer">
            Back to Customers
          </Button>
        </Link>
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
        <PersonalInformation 
          customer={customer} 
          formatMobileNumber={formatMobileNumber} 
        />
        <AddressInformation customer={customer} />
      </div>

      <AccountStatistics
        customer={customer}
        totalOrders={totalOrders}
        totalEarned={totalEarned}
        averageRating={averageRating}
        lastOrderDate={lastOrderDate}
        formatDateTime={formatDateTime}
      />

      {/* Booking History */}
      <BookingHistory
        bookings={bookings}
        getStatusColor={getStatusColor}
        formatStatus={formatStatus}
      />
    </div>
  )
}
