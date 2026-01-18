import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Smartphone, Banknote, CreditCard } from "lucide-react"
import { type Order } from "@/data/orders"

interface AdditionalInformationProps {
  order: Order
  statusLabels: Record<string, string>
}

export function AdditionalInformation({ order, statusLabels }: AdditionalInformationProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold">Additional Information</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Complete order details</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mobile Number</span>
            <span className="text-base font-semibold">{order.mobileNumber || "N/A"}</span>
          </div>
          <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment Method</span>
            <div className="flex items-center gap-2">
              {order.paymentMethod === "UPI" && <Smartphone size={16} className="text-blue-500" />}
              {order.paymentMethod === "Cash" && <Banknote size={16} className="text-green-500" />}
              {order.paymentMethod === "Card" && <CreditCard size={16} className="text-purple-500" />}
              <span className="text-base font-semibold">{order.paymentMethod || "N/A"}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment Status</span>
            <Badge
              className={`w-fit ${
                order.paymentStatus === "paid"
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : order.paymentStatus === "pending"
                  ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                  : order.paymentStatus === "cash"
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-gray-500 hover:bg-gray-600 text-white"
              }`}
            >
              {order.paymentStatus
                ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)
                : "Pending"}
            </Badge>
          </div>
          <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Order Date</span>
            <span className="text-base font-semibold">
              {order.date
                ? new Date(order.date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "N/A"}
            </span>
          </div>
          <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Order Status</span>
            <Badge className="w-fit bg-primary text-primary-foreground">
              {statusLabels[order.status as keyof typeof statusLabels] || order.status}
            </Badge>
          </div>
          <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Service</span>
            <span className="text-base font-semibold">{order.service || "N/A"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
