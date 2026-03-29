"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Calendar, Phone, Mail } from "lucide-react"
import { StatusBadge } from "./status-badge"

interface PersonalInformationProps {
  customer: any
  formatMobileNumber: (number: string | undefined) => string
}

export function PersonalInformation({ customer, formatMobileNumber }: PersonalInformationProps) {
  return (
    <Card>
      <CardHeader className="">
        <CardTitle className="text-base flex items-center gap-2">
          <User size={16} />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
              <User size={12} />
            </div>
            First Name
          </div>
          <span className="text-sm font-semibold">{customer.firstName || "N/A"}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
              <User size={12} />
            </div>
            Last Name
          </div>
          <span className="text-sm font-semibold">{customer.lastName || "N/A"}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
              <Calendar size={12} />
            </div>
            Age
          </div>
          <span className="text-sm font-semibold">{customer.age || "N/A"}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
              <Phone size={12} />
            </div>
            Mobile Number
          </div>
          <span className="text-sm font-semibold">{formatMobileNumber(customer.mobileNumber || customer.phone)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
              <Mail size={12} />
            </div>
            Email Address
          </div>
          <span className="text-sm font-semibold truncate">{customer.email}</span>
        </div>
      </CardContent>
    </Card>
  )
}
