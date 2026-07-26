export interface Order {
  id: string
  bookingId: string
  customerUid?: string
  customerId?: string
  customer: string
  service: string
  mobileNumber: string
  paymentStatus: "pending" | "paid" | "cash"
  paymentMethod: "UPI" | "Cash" | "Card"
  category: string
  amount: number
  status: "booked"| "confirmed" | "picked" | "serviceCenter" | "repair" | "outForDelivery" | "delivered" | "cancelled"
  date: string
  /** When each status was set (ISO string per status key). Used for timeline. */
  statusTimestamps?: Record<string, string>
  /** Last updated at (ISO string). */
  updatedAt?: string
  // Customer submission
  images?: string[]
  audioRecording?: string
  textDescription?: string
  // Service Center details
  serviceReason?: string
  serviceAmount?: number
  servicePaymentMethod?: string
  servicePaymentStatus?: string
  // Payment gateway details
  razorpayOrderId?: string
  razorpayPaymentId?: string
  razorpaySignature?: string
  // Pickup employee details
  pickupEmployeeId?: string
  pickupEmployeeName?: string
  pickupOtp?: string | null
  pickupOtpAt?: string
  otp?: Record<string, string>
  // Delivery employee details
  deliveryEmployeeId?: string
  deliveryEmployeeName?: string
  deliveryOtp?: string | null
  deliveryOtpAt?: string
  // Customer info
  customerEmail?: string
  // Cancellation details
  cancelledAtStatus?: "booked"| "confirmed" | "picked" | "serviceCenter" | "repair" | "outForDelivery" | "delivered"
  cancellationMessage?: string
}

