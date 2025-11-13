export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  city: string
  totalOrders: number
  status: "active" | "inactive"
  joinDate: string
}

export const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john@example.com",
    phone: "555-0101",
    city: "New York",
    totalOrders: 12,
    status: "active",
    joinDate: "2023-01-15",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "555-0102",
    city: "Los Angeles",
    totalOrders: 8,
    status: "active",
    joinDate: "2023-02-20",
  },
  {
    id: "3",
    name: "Michael Brown",
    email: "michael@example.com",
    phone: "555-0103",
    city: "Chicago",
    totalOrders: 15,
    status: "active",
    joinDate: "2023-03-10",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily@example.com",
    phone: "555-0104",
    city: "Houston",
    totalOrders: 5,
    status: "inactive",
    joinDate: "2023-04-05",
  },
  {
    id: "5",
    name: "David Wilson",
    email: "david@example.com",
    phone: "555-0105",
    city: "Phoenix",
    totalOrders: 20,
    status: "active",
    joinDate: "2023-05-12",
  },
  {
    id: "6",
    name: "Jessica Miller",
    email: "jessica@example.com",
    phone: "555-0106",
    city: "Miami",
    totalOrders: 3,
    status: "active",
    joinDate: "2023-06-18",
  },
  {
    id: "7",
    name: "James Taylor",
    email: "james@example.com",
    phone: "555-0107",
    city: "Seattle",
    totalOrders: 11,
    status: "active",
    joinDate: "2023-07-22",
  },
  {
    id: "8",
    name: "Lisa Anderson",
    email: "lisa@example.com",
    phone: "555-0108",
    city: "Boston",
    totalOrders: 7,
    status: "active",
    joinDate: "2023-08-09",
  },
]
