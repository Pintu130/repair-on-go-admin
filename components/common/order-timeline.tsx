"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Wrench, Package, Home, X } from "lucide-react"

interface OrderTimelineProps {
  statusSteps: string[]
  statusLabels: Record<string, string>
  currentStatusIndex: number
  orderDate?: string
  isCancelled?: boolean
  cancelledAtStatus?: string
}

// Get icon for each status step
const getStatusIcon = (step: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    booked: <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />,
    confirmed: <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />,
    picked: <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />,
    serviceCenter: <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />,
    repair: <Wrench className="h-4 w-4 sm:h-5 sm:w-5" />,
    outForDelivery: <Package className="h-4 w-4 sm:h-5 sm:w-5" />,
    delivered: <Home className="h-4 w-4 sm:h-5 sm:w-5" />,
  }
  return iconMap[step] || <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
}

// Step descriptions based on status
const getStepDescription = (step: string): string => {
  const descriptions: Record<string, string> = {
    picked: "Repair request submitted and payment completed",
    serviceCenter: "Device collected and reached service center",
    repair: "Repair in progress - blades replacement and motor check",
  }
  return descriptions[step] || ""
}

// Get display status label
const getDisplayStatus = (step: string, statusLabels: Record<string, string>): string => {
  return statusLabels[step] || step
}

export function OrderTimeline({ statusSteps, statusLabels, currentStatusIndex, orderDate, isCancelled = false, cancelledAtStatus }: OrderTimelineProps) {
  // Calculate dates for each step
  const getStepDate = (index: number): string => {
    if (!orderDate) return ""
    const baseDate = new Date(orderDate)
    baseDate.setDate(baseDate.getDate() + index)
    return baseDate.toISOString().split("T")[0]
  }

  // If cancelled, find the last completed status index before cancellation
  // cancelledAtStatus tells us which status it was at when cancelled
  const cancelledStatusIndex = isCancelled && cancelledAtStatus
    ? statusSteps.indexOf(cancelledAtStatus)
    : -1
  const lastCompletedIndex = isCancelled && cancelledStatusIndex >= 0
    ? cancelledStatusIndex
    : currentStatusIndex

  // Prepare tracking steps data
  const trackingSteps = statusSteps.map((step, index) => {
    const isCompleted = index < lastCompletedIndex
    const isCurrent = !isCancelled && index === currentStatusIndex
    // Only the status where it was cancelled should be marked as cancelled
    const isStepCancelled = isCancelled && cancelledStatusIndex >= 0 && index === cancelledStatusIndex
    const showDetails = (isCompleted || isCurrent || isStepCancelled) && !(isCancelled && index > lastCompletedIndex)

    return {
      step,
      isCompleted,
      isCurrent,
      isCancelled: isStepCancelled,
      tracking: showDetails
        ? {
            date: getStepDate(index),
            description: getStepDescription(step),
          }
        : undefined,
    }
  })

  // Calculate progress for the line - stop at cancelled status (not including it)
  const completedCount = isCancelled && lastCompletedIndex >= 0 
    ? lastCompletedIndex  // Don't include the cancelled step in progress
    : lastCompletedIndex >= 0 
    ? lastCompletedIndex + 1 
    : 0
  const totalSteps = statusSteps.length
  const startPosition = 12.5 // First step center (approximately)
  const endPosition = 87.5 // Last step center (approximately)
  const lineWidth = endPosition - startPosition // 75%
  const progressPercent = completedCount > 0 ? ((completedCount - 1) / (totalSteps - 1)) * lineWidth : 0

  return (
    <Card>
      <CardContent className="">
        <h3 className="font-semibold text-base sm:text-lg mb-4 sm:mb-6">Tracking Timeline</h3>

        {/* Horizontal Timeline */}
        <div className="relative">
          {/* Progress Line - Only between first and last step centers */}
          <>
            {/* Background line - from first to last step center only */}
            <div
              className="absolute top-4 sm:top-5 h-0.5 bg-gray-200"
              style={{
                left: `${startPosition}%`,
                width: `${lineWidth}%`,
              }}
            ></div>
            {/* Progress line - from first step to current step (or last completed if cancelled) */}
            {progressPercent > 0 && (
              <div
                className={`absolute top-4 sm:top-5 h-0.5 transition-all duration-300 ${
                  isCancelled ? "bg-red-500" : "bg-green-500"
                }`}
                style={{
                  left: `${startPosition}%`,
                  width: `${progressPercent}%`,
                }}
              />
            )}
          </>

          {/* Steps */}
          <div className="relative flex items-start justify-between gap-1 sm:gap-2 overflow-x-auto pb-2">
            {trackingSteps.map((stepData, index) => {
              const { step, isCompleted, isCurrent, isCancelled: isStepCancelled, tracking } = stepData

              return (
                <div key={step} className="flex flex-col items-center flex-1 relative min-w-0">
                  {/* Icon Circle */}
                  <div
                    className={`relative z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 mb-2 ${
                      isStepCancelled
                        ? "bg-red-500 text-white border-2 border-red-600"
                        : isCurrent
                        ? "bg-red-500 text-white ring-2 sm:ring-4 ring-red-500/20"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {isStepCancelled ? (
                      <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : isCompleted && !isCurrent ? (
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <div className="scale-75 sm:scale-100">{getStatusIcon(step)}</div>
                    )}
                  </div>

                  {/* Step Details */}
                  <div className="text-center w-full px-0.5 sm:px-1">
                    <div className="flex flex-col items-center gap-0.5 sm:gap-1 mb-1">
                      <span
                        className={`text-xs sm:text-sm font-medium ${
                          isStepCancelled
                            ? "text-red-600"
                            : isCurrent
                            ? "text-red-600"
                            : isCompleted
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        <span className="hidden sm:inline">{getDisplayStatus(step, statusLabels)}</span>
                        <span className="sm:hidden">{getDisplayStatus(step, statusLabels).split(" ")[0]}</span>
                      </span>
                      {isStepCancelled && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs px-1 py-0 text-red-600 border-red-600">
                          Cancelled
                        </Badge>
                      )}
                      {isCurrent && !isStepCancelled && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs px-1 py-0">
                          Current
                        </Badge>
                      )}
                    </div>
                    {tracking && (
                      <>
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">{tracking.date}</p>
                        <p className="text-[10px] sm:text-xs text-gray-600 line-clamp-2 hidden sm:block">
                          {tracking.description}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

