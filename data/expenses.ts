export interface Expense {
  id: string
  title: string
  amount: number
  date: string
  description: string
  // status: "paid" | "pending" | "cancelled"
  paymentMethod?: string
  attachment?: File
  attachmentUrl?: string
  attachmentPath?: string
  createdAt?: any
  updatedAt?: any
}

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Salary",
  "Utilities",
  "Office Supplies",
  "Marketing",
  "Travel",
  "Software",
  "Equipment",
  "Insurance",
  "Maintenance",
  "Other"
]

export const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Credit Card",
  "Debit Card",
  "UPI",
  "Cheque"
]

export const EXPENSE_STATUS = {
  paid: "Paid",
  pending: "Pending",
  cancelled: "Cancelled"
}

export const staticExpenses: Expense[] = []

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount)
}
