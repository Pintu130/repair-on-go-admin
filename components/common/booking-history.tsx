"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"
import { ServiceDetailsModal } from "./service-details-modal"

interface BookingHistoryProps {
  bookings: any[]
  getStatusColor: (status: string) => string
  formatStatus: (status: string) => string
}

export function BookingHistory({ 
  bookings, 
  getStatusColor, 
  formatStatus 
}: BookingHistoryProps) {
  const [viewingService, setViewingService] = useState<any>(null)

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package size={16} />
            Booking History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <Package size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No bookings found for this customer</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-2 px-3 font-semibold text-xs">Order ID</th>
                    <th className="text-left py-2 px-3 font-semibold text-xs">Service</th>
                    <th className="text-left py-2 px-3 font-semibold text-xs">Date</th>
                    <th className="text-left py-2 px-3 font-semibold text-xs">Status</th>
                    <th className="text-left py-2 px-3 font-semibold text-xs">Amount</th>
                    <th className="text-left py-2 px-3 font-semibold text-xs">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-2.5 px-3 font-mono text-xs">{booking.bookingId || booking.id}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingService(booking)}
                            className="cursor-pointer shrink-0 h-7 px-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground"
                          >
                            Show
                          </Button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">{new Date(booking.date).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}</td>
                      <td className="py-2.5 px-3">
                        <Badge 
                          variant="default"
                          className={getStatusColor(booking.status)}
                        >
                          {formatStatus(booking.status)}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-semibold">₹{parseFloat(booking.amount?.toString() || "0").toLocaleString()}</td>
                      <td className="py-2.5 px-3">
                        <Link href={`/orders/${booking.id}`}>
                          <Button variant="outline" size="sm" className="cursor-pointer">
                            View Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Details Modal */}
      <ServiceDetailsModal
        open={!!viewingService}
        onOpenChange={(open) => !open && setViewingService(null)}
        service={viewingService}
        getStatusColor={getStatusColor}
        formatStatus={formatStatus}
      />
    </>
  )
}
