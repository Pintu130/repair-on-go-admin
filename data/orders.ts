export interface Order {
  id: string
  bookingId: string
  customer: string
  service: string
  mobileNumber: string
  paymentStatus: "pending" | "paid" | "cash"
  paymentMethod: "UPI" | "Cash" | "Card"
  category: string
  amount: number
  status: "booked"| "confirmed" | "picked" | "serviceCenter" | "repair" | "outForDelivery" | "delivered" | "cancelled"
  date: string
  // Customer submission
  images?: string[]
  audioRecording?: string
  textDescription?: string
  // Service Center details
  serviceReason?: string
  serviceAmount?: number
  // Cancellation details
  cancelledAtStatus?: "booked"| "confirmed" | "picked" | "serviceCenter" | "repair" | "outForDelivery" | "delivered"
}

