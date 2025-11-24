export interface Order {
  id: string
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

export const mockOrders: Order[] = [
  {
    id: "ORD001",
    customer: "John Smith",
    service: "Plumbing Repair",
    mobileNumber: "+91 98765 43210",
    paymentStatus: "paid",
    paymentMethod: "UPI",
    category: "Plumbing",
    amount: 150,
    status: "delivered",
    date: "2024-01-15",
  },
  {
    id: "ORD002",
    customer: "Sarah Johnson",
    service: "Electrical Wiring",
    mobileNumber: "+91 98765 43211",
    paymentStatus: "pending",
    paymentMethod: "Card",
    category: "Electrical",
    amount: 200,
    status: "repair",
    date: "2024-01-18",
    images: [
      "https://via.placeholder.com/300x200?text=Electrical+Issue+1",
      "https://via.placeholder.com/300x200?text=Electrical+Issue+2",
      "https://via.placeholder.com/300x200?text=Electrical+Issue+3",
    ],
    audioRecording: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    textDescription: "The electrical wiring in my kitchen is not working properly. There seems to be a short circuit issue and the lights keep flickering.",
  },
  {
    id: "ORD003",
    customer: "Michael Brown",
    service: "Carpentry Work",
    mobileNumber: "+91 98765 43212",
    paymentStatus: "cash",
    paymentMethod: "Cash",
    category: "Carpentry",
    amount: 350,
    status: "picked",
    date: "2024-02-05",
  },
  {
    id: "ORD004",
    customer: "Emily Davis",
    service: "Painting",
    mobileNumber: "+91 98765 43213",
    paymentStatus: "pending",
    paymentMethod: "UPI",
    category: "Painting",
    amount: 280,
    status: "booked",
    date: "2024-02-10",
  },
  {
    id: "ORD005",
    customer: "David Wilson",
    service: "Plumbing Repair",
    mobileNumber: "+91 98765 43214",
    paymentStatus: "paid",
    paymentMethod: "Card",
    category: "Plumbing",
    amount: 175,
    status: "booked",
    date: "2024-02-15",
  },
  {
    id: "ORD006",
    customer: "Jessica Miller",
    service: "Electrical Installation",
    mobileNumber: "+91 98765 43215",
    paymentStatus: "paid",
    paymentMethod: "UPI",
    category: "Electrical",
    amount: 450,
    status: "delivered",
    date: "2024-02-12",
  },
  {
    id: "ORD007",
    customer: "James Taylor",
    service: "Cabinet Making",
    mobileNumber: "+91 98765 43216",
    paymentStatus: "cash",
    paymentMethod: "Cash",
    category: "Carpentry",
    amount: 550,
    status: "serviceCenter",
    date: "2024-02-08",
  },
  {
    id: "ORD008",
    customer: "Lisa Anderson",
    service: "Wall Painting",
    mobileNumber: "+91 98765 43217",
    paymentStatus: "paid",
    paymentMethod: "Card",
    category: "Painting",
    amount: 320,
    status: "outForDelivery",
    date: "2024-02-14",
  },
]
