"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Package, Calendar, DollarSign, Star, Clock } from "lucide-react"
import { StatusBadge } from "./status-badge"

interface AccountStatisticsProps {
  customer: any
  totalOrders: number
  totalEarned: number
  averageRating: string
  lastOrderDate: string
  formatDateTime: (date: string) => string
}

export function AccountStatistics({ 
  customer, 
  totalOrders, 
  totalEarned, 
  averageRating, 
  lastOrderDate,
  formatDateTime 
}: AccountStatisticsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="">
          <CardTitle className="text-base flex items-center gap-2">
            <User size={16} />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                <User size={12} />
              </div>
              Status
            </div>
            <StatusBadge status={customer.status} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                <Package size={12} />
              </div>
              Total Orders
            </div>
            <span className="text-sm font-semibold">{totalOrders}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                <Calendar size={12} />
              </div>
              Join Date
            </div>
            <span className="text-sm font-semibold">{formatDateTime(customer.joinDate)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign size={16} />
            Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                <DollarSign size={12} />
              </div>
              Total Spent
            </div>
            <span className="text-sm font-semibold">₹{totalEarned.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                <Star size={12} />
              </div>
              Average Rating
            </div>
            <span className="text-sm font-semibold">{averageRating}/5.0</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                <Clock size={12} />
              </div>
              Last Order
            </div>
            <span className="text-sm font-semibold">{lastOrderDate}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
