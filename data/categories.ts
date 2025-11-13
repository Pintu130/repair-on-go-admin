export interface Category {
  id: string
  name: string
  description: string
  icon: string
  count: number
}

export const mockCategories: Category[] = [
  { id: "1", name: "Plumbing", description: "Plumbing repair and installation services", icon: "🚿", count: 245 },
  { id: "2", name: "Electrical", description: "Electrical repair and installation services", icon: "⚡", count: 189 },
  { id: "3", name: "Carpentry", description: "Woodwork and carpentry services", icon: "🪓", count: 156 },
  { id: "4", name: "Painting", description: "Interior and exterior painting services", icon: "🎨", count: 203 },
  { id: "5", name: "HVAC", description: "Heating, ventilation, and air conditioning", icon: "❄️", count: 98 },
]
