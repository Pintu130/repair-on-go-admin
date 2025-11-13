"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { mockEmployees } from "@/data/employees"

export default function EmployeeDetailPage() {
  const params = useParams()
  const employee = mockEmployees.find((e) => e.id === params.id)

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p>Employee not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{employee.name}</h1>
          <p className="text-muted-foreground">{employee.role}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{employee.email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{employee.phone}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={employee.status === "active" ? "default" : "secondary"}>
              {employee.status === "active" ? "Active" : "Inactive"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tasks Assigned:</span>
              <span className="font-semibold">{employee.tasksAssigned}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tasks Completed:</span>
              <span className="font-semibold">{employee.tasksAssigned + 28}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completion Rate:</span>
              <span className="font-semibold">96%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Performance Score</span>
                <span className="font-semibold">{employee.performanceScore}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${employee.performanceScore}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Customer Rating</span>
                <span className="font-semibold">4.8/5.0</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "96%" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
