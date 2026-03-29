export interface Employee {
  id: string
  uid: string
  name: string
  firstName?: string
  lastName?: string
  avatar?: string
  age?: string
  email: string
  phone: string
  mobileNumber?: string
  address: string
  aadharNumber?: string
  panCardNumber?: string
  employeeFile?: string
  status: "active" | "inactive"
  joinDate: string
  createdAt?: string
  updatedAt?: string
  tasksAssigned: number
  tasksCompleted?: number
  tasksPending?: number
  tasksCancelled?: number
  totalEarned?: number
  averageRating?: number
  lastOrderDate?: string
  performanceScore: number
  role?: string
}

export const mockEmployees: Employee[] = [
  {
    id: "E001",
    uid: "E001",
    name: "John Doe",
    firstName: "John",
    lastName: "Doe",
    email: "john@repaongo.com",
    phone: "555-0101",
    address: "123 Main St, City, State",
    status: "active",
    joinDate: "2023-09-12",
    tasksAssigned: 12,
    performanceScore: 92,
  },
  {
    id: "E002",
    uid: "E002",
    name: "Sarah Wilson",
    firstName: "Sarah",
    lastName: "Wilson",
    email: "sarah@repaongo.com",
    phone: "555-0102",
    address: "456 Oak Ave, City, State",
    status: "active",
    joinDate: "2023-10-05",
    tasksAssigned: 15,
    performanceScore: 95,
  },
  {
    id: "E003",
    uid: "E003",
    name: "Mike Johnson",
    firstName: "Mike",
    lastName: "Johnson",
    email: "mike@repaongo.com",
    phone: "555-0103",
    address: "789 Pine Rd, City, State",
    status: "active",
    joinDate: "2023-09-28",
    tasksAssigned: 8,
    performanceScore: 88,
  },
  {
    id: "E004",
    uid: "E004",
    name: "Emma Davis",
    firstName: "Emma",
    lastName: "Davis",
    email: "emma@repaongo.com",
    phone: "555-0104",
    address: "321 Elm St, City, State",
    status: "inactive",
    joinDate: "2023-11-14",
    tasksAssigned: 0,
    performanceScore: 80,
  },
  {
    id: "E005",
    uid: "E005",
    name: "David Brown",
    firstName: "David",
    lastName: "Brown",
    email: "david@repaongo.com",
    phone: "555-0105",
    address: "654 Maple Dr, City, State",
    status: "active",
    joinDate: "2023-12-02",
    tasksAssigned: 10,
    performanceScore: 90,
  },
]

// Format mobile number to Indian format: +91 XXXXX XXXXX
export const formatMobileNumber = (number: string | undefined) => {
  if (!number) return ""
  // Remove all non-digit characters
  const digits = number.replace(/\D/g, "")

  // Handle different formats
  let formattedDigits = digits

  // If starts with 91 and has 12 digits, remove the country code
  if (digits.startsWith("91") && digits.length === 12) {
    formattedDigits = digits.slice(2)
  }
  // If starts with 0 and has 11 digits, remove the leading 0
  else if (digits.startsWith("0") && digits.length === 11) {
    formattedDigits = digits.slice(1)
  }
  // If has exactly 10 digits, use as is
  else if (digits.length === 10) {
    formattedDigits = digits
  }
  // Otherwise, just use the last 10 digits
  else if (digits.length > 10) {
    formattedDigits = digits.slice(-10)
  }

  // Format as: +91 XXXXX XXXXX
  if (formattedDigits.length === 10) {
    return `+91 ${formattedDigits.slice(0, 5)} ${formattedDigits.slice(5)}`
  }

  return number // Return original if can't format
}
