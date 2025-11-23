export interface Order {
  id: string
  customer: string
  service: string
  category: string
  amount: number
  status: "booked"| "confirmed" | "picked" | "serviceCenter" | "repair" | "outForDelivery" | "delivered"
  date: string
}

export const mockOrders: Order[] = [
  {
    id: "ORD001",
    customer: "John Smith",
    service: "Plumbing Repair",
    category: "Plumbing",
    amount: 150,
    status: "delivered",
    date: "2024-01-15",
  },
  {
    id: "ORD002",
    customer: "Sarah Johnson",
    service: "Electrical Wiring",
    category: "Electrical",
    amount: 200,
    status: "repair",
    date: "2024-01-18",
  },
  {
    id: "ORD003",
    customer: "Michael Brown",
    service: "Carpentry Work",
    category: "Carpentry",
    amount: 350,
    status: "picked",
    date: "2024-02-05",
  },
  {
    id: "ORD004",
    customer: "Emily Davis",
    service: "Painting",
    category: "Painting",
    amount: 280,
    status: "booked",
    date: "2024-02-10",
  },
  {
    id: "ORD005",
    customer: "David Wilson",
    service: "Plumbing Repair",
    category: "Plumbing",
    amount: 175,
    status: "booked",
    date: "2024-02-15",
  },
  {
    id: "ORD006",
    customer: "Jessica Miller",
    service: "Electrical Installation",
    category: "Electrical",
    amount: 450,
    status: "delivered",
    date: "2024-02-12",
  },
  {
    id: "ORD007",
    customer: "James Taylor",
    service: "Cabinet Making",
    category: "Carpentry",
    amount: 550,
    status: "serviceCenter",
    date: "2024-02-08",
  },
  {
    id: "ORD008",
    customer: "Lisa Anderson",
    service: "Wall Painting",
    category: "Painting",
    amount: 320,
    status: "outForDelivery",
    date: "2024-02-14",
  },
]
