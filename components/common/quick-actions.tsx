import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings2, FileText, DollarSign, Save, Loader2 } from "lucide-react"
import { type Order } from "@/data/orders"

interface QuickActionsProps {
  order: Order
  statusSteps: string[]
  statusLabels: Record<string, string>
  onStatusUpdate: (newStatus: Order["status"]) => void
  onSave: () => void
  isSaving?: boolean
}

export function QuickActions({ order, statusSteps, statusLabels, onStatusUpdate, onSave, isSaving = false }: QuickActionsProps) {
  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">Manage order operations efficiently</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Update Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary"></div>
            <Label className="text-sm font-semibold text-foreground">Update Status</Label>
          </div>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="w-full lg:w-[280px]">
              <Select
                value={order.status}
                onValueChange={(value) => {
                  if (value !== order.status) {
                    onStatusUpdate(value as Order["status"])
                  }
                }}
              >
                <SelectTrigger className="w-full h-11">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {/* Show booked option only if current status is booked (for display), but make it non-selectable */}
                  {order.status === "booked" && (
                    <SelectItem 
                      key="booked" 
                      value="booked" 
                      disabled
                      className="cursor-not-allowed opacity-50"
                    >
                      {statusLabels["booked"]}
                    </SelectItem>
                  )}
                  {statusSteps
                    .filter((step) => step !== "booked")
                    .map((step) => (
                      <SelectItem key={step} value={step} className="cursor-pointer">
                        {statusLabels[step as keyof typeof statusLabels]}
                      </SelectItem>
                    ))}
                  <SelectItem value="cancelled" className="cursor-pointer text-destructive">
                    Cancel Order
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Service Center Info Display - Right Side */}
            {order.status === "serviceCenter" && order.serviceReason && (
              <div className="flex-1 w-full lg:w-auto p-4 rounded-lg bg-muted/50 border">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-primary" />
                      <Label className="text-xs font-semibold text-muted-foreground">Service Reason</Label>
                    </div>
                    <p className="text-sm font-medium">{order.serviceReason}</p>
                  </div>
                  {order.serviceAmount && (
                    <div className="lg:w-[180px] space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <Label className="text-xs font-semibold text-muted-foreground">Service Amount</Label>
                      </div>
                      <p className="text-sm font-semibold">₹{order.serviceAmount.toLocaleString("en-IN")}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              onClick={onSave}
              disabled={isSaving}
              className="min-w-[120px] cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
