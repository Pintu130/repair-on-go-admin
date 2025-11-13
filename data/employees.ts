export interface Employee {
  id: string
  name: string
  role: string
  email: string
  phone: string
  status: "active" | "inactive"
  tasksAssigned: number
  performanceScore: number
}

export const mockEmployees: Employee[] = [
  {
    id: "E001",
    name: "John Doe",
    role: "Plumber",
    email: "john@repaongo.com",
    phone: "555-0101",
    status: "active",
    tasksAssigned: 12,
    performanceScore: 92,
  },
  {
    id: "E002",
    name: "Sarah Wilson",
    role: "Electrician",
    email: "sarah@repaongo.com",
    phone: "555-0102",
    status: "active",
    tasksAssigned: 15,
    performanceScore: 95,
  },
  {
    id: "E003",
    name: "Mike Johnson",
    role: "Carpenter",
    email: "mike@repaongo.com",
    phone: "555-0103",
    status: "active",
    tasksAssigned: 8,
    performanceScore: 88,
  },
  {
    id: "E004",
    name: "Emma Davis",
    role: "Painter",
    email: "emma@repaongo.com",
    phone: "555-0104",
    status: "inactive",
    tasksAssigned: 0,
    performanceScore: 80,
  },
  {
    id: "E005",
    name: "David Brown",
    role: "Plumber",
    email: "david@repaongo.com",
    phone: "555-0105",
    status: "active",
    tasksAssigned: 10,
    performanceScore: 90,
  },
]
