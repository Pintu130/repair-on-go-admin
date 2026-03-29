"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, MapPinned, Building2 } from "lucide-react"

interface AddressInformationProps {
  customer: any
}

export function AddressInformation({ customer }: AddressInformationProps) {
  return (
    <Card>
      <CardHeader className="">
        <CardTitle className="text-base flex items-center gap-2">
          <Home size={16} />
          Address Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
              <Building2 size={12} />
            </div>
            House No/Building
          </div>
          <span className="text-sm font-semibold">{customer.houseNo || "N/A"}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
              <MapPinned size={12} />
            </div>
            Road Name/Area
          </div>
          <span className="text-sm font-semibold">{customer.roadName || "N/A"}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
              <MapPinned size={12} />
            </div>
            Nearby Landmark
          </div>
          <span className="text-sm font-semibold">{customer.nearbyLandmark || "N/A"}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
              <MapPinned size={12} />
            </div>
            State
          </div>
          <span className="text-sm font-semibold">{customer.state || "N/A"}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
              <MapPinned size={12} />
            </div>
            City
          </div>
          <span className="text-sm font-semibold">{customer.city || "N/A"}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
              <MapPinned size={12} />
            </div>
            Pincode
          </div>
          <span className="text-sm font-semibold">{customer.pincode || "N/A"}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
              <Home size={12} />
            </div>
            Address Type
          </div>
          <span className="text-sm font-semibold">{customer.addressType || "N/A"}</span>
        </div>
      </CardContent>
    </Card>
  )
}
