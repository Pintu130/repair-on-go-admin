"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, MapPinned, Building2, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AddressInformationProps {
  customer: any
}

export function AddressInformation({ customer }: AddressInformationProps) {
  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      })
    } catch (e) {
      return dateString
    }
  }

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
        {customer.location?.latitude != null && customer.location?.longitude != null && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                  <MapPin size={12} />
                </div>
                Location (Lat, Long)
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{customer.location.latitude}, {customer.location.longitude}</span>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-7 px-2"
                >
                  <a
                    href={`https://www.google.com/maps?q=${customer.location.latitude},${customer.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin size={12} className="mr-1" />
                    View
                  </a>
                </Button>
              </div>
            </div>
            {customer.location.updatedAt && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                    <Clock size={12} />
                  </div>
                  Location Updated At
                </div>
                <span className="text-sm font-semibold">{formatDateTime(customer.location.updatedAt)}</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
