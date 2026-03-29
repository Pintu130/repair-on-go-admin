"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Phone, MapPin, User, Calendar, DollarSign, Star, Clock, Package, TrendingUp, AlertCircle, Coins, Loader2, Building2, FileText } from "lucide-react"
import { useGetEmployeeByIdQuery } from "@/lib/store/api/employeesApi"
import { Loader } from "@/components/ui/loader"
import { StatusBadge } from "@/components/common/status-badge"
import { InfoCard } from "@/components/common/info-card"

export default function EmployeeDetailPage() {
  const params = useParams()
  const employeeId = params.id as string

  // Fetch employee details from Firebase
  const { data: employeeData, isLoading, isError } = useGetEmployeeByIdQuery(employeeId)
  const employee = employeeData?.employee

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="lg" />
      </div>
    )
  }

  // Error state
  if (isError || !employee) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-semibold text-destructive">Employee not found</p>
        <p className="text-sm text-muted-foreground mt-2">
          {isError ? "Failed to load employee data" : "Employee does not exist"}
        </p>
        <Link href="/employees">
          <Button variant="outline" className="mt-4 cursor-pointer">
            Back to Employees
          </Button>
        </Link>
      </div>
    )
  }

  // Format date with time
  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      })
    } catch (e) {
      return dateString
    }
  }

  // Performance metrics from actual employee data
  const performanceData = {
    totalOrders: employee.tasksAssigned || 0,
    completedOrders: employee.tasksCompleted || 0,
    pendingOrders: employee.tasksPending || 0,
    cancelledOrders: employee.tasksCancelled || 0,
    totalEarned: employee.totalEarned || 0,
    averageRating: employee.averageRating || 0,
    lastOrderDate: employee.lastOrderDate ? formatDateTime(employee.lastOrderDate) : "N/A",
    joinDate: formatDateTime(employee.joinDate)
  }

  // Calculate performance metrics
  const orderPerformance = performanceData.totalOrders > 0 
    ? Math.round((performanceData.completedOrders / performanceData.totalOrders) * 100) 
    : 0

  // Format employee name
  const getEmployeeName = () => {
    if (employee.firstName && employee.lastName) {
      return `${employee.firstName} ${employee.lastName}`
    }
    return employee.name || "Unknown Employee"
  }

  // Format mobile number
  const formatMobileNumber = (number: string | undefined) => {
    if (!number) return "N/A"
    const digits = number.replace(/\D/g, "")
    if (digits.length === 10) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
    }
    return number
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {employee.avatar ? (
              <img 
                src={employee.avatar} 
                alt={getEmployeeName()} 
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <User size={24} className="text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{getEmployeeName()}</h1>
            <p className="text-sm text-muted-foreground">Employee Performance Details</p>
          </div>
        </div>
        <Link href="/employees">
          <Button variant="outline" className="cursor-pointer">
            Back to Employees
          </Button>
        </Link>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <InfoCard
          icon={Coins}
          label="Total Earned"
          value={`₹${performanceData.totalEarned.toLocaleString()}`}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
        />
        <InfoCard
          icon={Package}
          label="Total Orders"
          value={performanceData.totalOrders.toString()}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
        />
        <InfoCard
          icon={TrendingUp}
          label="Success Rate"
          value={`${orderPerformance}%`}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-500/10"
        />
        <InfoCard
          icon={AlertCircle}
          label="Pending Orders"
          value={performanceData.pendingOrders.toString()}
          iconColor="text-yellow-500"
          iconBgColor="bg-yellow-500/10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User size={16} />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Full Name</span>
              <span className="text-sm font-medium">{getEmployeeName()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-muted-foreground" />
                <span className="text-sm font-medium">{employee.email}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Phone</span>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-muted-foreground" />
                <span className="text-sm font-medium">{formatMobileNumber(employee.phone)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Age</span>
              <span className="text-sm font-medium">{employee.age || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusBadge status={employee.status} />
            </div>
                      </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 size={16} />
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Employee ID</span>
              <span className="text-sm font-medium font-mono">{employee.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">UID</span>
              <span className="text-sm font-medium font-mono">{employee.uid}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Join Date</span>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-muted-foreground" />
                <span className="text-sm font-medium">{performanceData.joinDate}</span>
              </div>
            </div>
                      </CardContent>
        </Card>
      </div>

      {/* Order Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package size={16} />
            Order Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{performanceData.completedOrders}</div>
              <div className="text-sm text-green-600">Completed</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">{performanceData.pendingOrders}</div>
              <div className="text-sm text-yellow-600">Pending</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">{performanceData.cancelledOrders}</div>
              <div className="text-sm text-red-600">Cancelled</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{performanceData.totalOrders}</div>
              <div className="text-sm text-blue-600">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Address Information */}
        {employee.address && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin size={16} />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{employee.address}</p>
            </CardContent>
          </Card>
        )}

        {/* Documents Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText size={16} />
              Documents Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Aadhar Number</span>
              <span className="text-sm font-medium">{employee.aadharNumber || "Not Provided"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">PAN Card Number</span>
              <span className="text-sm font-medium">{employee.panCardNumber || "Not Provided"}</span>
            </div>
            {(employee as any).employeeFile && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Employee Document</span>
                <Button variant="outline" size="sm" asChild>
                  <a href={(employee as any).employeeFile} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                    <FileText size={14} className="mr-2" />
                    View Document
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
