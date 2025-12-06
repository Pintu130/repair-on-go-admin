export interface Customer {
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
  city: string
  totalOrders: number
  status: "active" | "inactive"
  joinDate: string
  // Address Information
  houseNo?: string
  roadName?: string
  nearbyLandmark?: string
  state?: string
  pincode?: string
  addressType?: string
}

export const mockCustomers: Customer[] = [
  {
    id: "9",
    uid: "9",
    name: "Amit Patel",
    email: "amit.patel@example.com",
    phone: "98795 21001",
    city: "Bharuch",
    totalOrders: 9,
    status: "active",
    joinDate: "2023-09-12",
  },
  {
    id: "10",
    uid: "10",
    name: "Neha Sharma",
    email: "neha.sharma@example.com",
    phone: "98250 33421",
    city: "Surat",
    totalOrders: 14,
    status: "inactive",
    joinDate: "2023-10-05",
  },
  {
    id: "11",
    uid: "11",
    name: "Rohit Mehta",
    email: "rohit.mehta@example.com",
    phone: "98798 75643",
    city: "Vadodara",
    totalOrders: 6,
    status: "active",
    joinDate: "2023-09-28",
  },
  {
    id: "12",
    uid: "12",
    name: "Priya Desai",
    email: "priya.desai@example.com",
    phone: "98982 15009",
    city: "Ahmedabad",
    totalOrders: 18,
    status: "active",
    joinDate: "2023-11-14",
  },
  {
    id: "13",
    uid: "13",
    name: "Kunal Joshi",
    email: "kunal.joshi@example.com",
    phone: "97245 64012",
    city: "Rajkot",
    totalOrders: 11,
    status: "inactive",
    joinDate: "2023-12-02",
  },
  {
    id: "14",
    uid: "14",
    name: "Pooja Parmar",
    email: "pooja.parmar@example.com",
    phone: "82389 22104",
    city: "Bharuch",
    totalOrders: 4,
    status: "active",
    joinDate: "2024-01-19",
  },
  {
    id: "15",
    uid: "15",
    name: "Harsh Shah",
    email: "harsh.shah@example.com",
    phone: "79905 44721",
    city: "Surat",
    totalOrders: 12,
    status: "active",
    joinDate: "2024-02-11",
  },
  {
    id: "16",
    uid: "16",
    name: "Sneha Patel",
    email: "sneha.patel@example.com",
    phone: "90990 11223",
    city: "Ankleshwar",
    totalOrders: 7,
    status: "active",
    joinDate: "2024-02-22",
  },
  {
    id: "17",
    uid: "17",
    name: "Jaydeep Rana",
    email: "jaydeep.rana@example.com",
    phone: "90169 55478",
    city: "Navsari",
    totalOrders: 15,
    status: "inactive",
    joinDate: "2023-08-17",
  },
  {
    id: "18",
    uid: "18",
    name: "Komal Trivedi",
    email: "komal.trivedi@example.com",
    phone: "90995 87412",
    city: "Valsad",
    totalOrders: 10,
    status: "active",
    joinDate: "2023-10-29",
  },
  {
    id: "19",
    uid: "19",
    name: "Dhruv Pandya",
    email: "dhruv.pandya@example.com",
    phone: "98253 40921",
    city: "Ahmedabad",
    totalOrders: 22,
    status: "active",
    joinDate: "2024-03-05",
  },
  {
    id: "20",
    uid: "20",
    name: "Riya Goswami",
    email: "riya.goswami@example.com",
    phone: "98790 11457",
    city: "Surat",
    totalOrders: 3,
    status: "inactive",
    joinDate: "2024-04-01",
  }
];

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