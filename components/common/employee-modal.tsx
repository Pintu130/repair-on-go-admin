"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, Upload, User, FileText } from "lucide-react"
import { FormField } from "@/components/common/form-field"
import { MobileNumberField } from "@/components/common/mobile-number-field"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"

interface EmployeeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  formData: Record<string, any>
  onFormDataChange: (fieldId: string, value: any) => void
  onSave: () => void
  saveLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  isEditing?: boolean
}

export function EmployeeModal({
  open,
  onOpenChange,
  title,
  formData,
  onFormDataChange,
  onSave,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  isLoading = false,
  isEditing = false,
}: EmployeeModalProps) {
  const [activeTab, setActiveTab] = useState(0)
  const { toast } = useToast()

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setActiveTab(0)
    }
    onOpenChange(isOpen)
  }

  // Reset to first tab whenever modal opens
  useEffect(() => {
    if (open) {
      setActiveTab(0)
    }
  }, [open])

  // Validation for required fields on first tab
  const isFirstTabValid = () => {
    const hasFirstName = formData.firstName?.trim()
    const hasLastName = formData.lastName?.trim()
    const hasPhone = formData.phone?.trim()
    const hasEmail = formData.email?.trim()
    const hasPassword = isEditing || formData.password?.trim()

    return hasFirstName && hasLastName && hasPhone && hasEmail && hasPassword
  }

  const handleNext = () => {
    if (activeTab < 1 && isFirstTabValid()) {
      setActiveTab(activeTab + 1)
    }
  }

  const handlePrevious = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1)
    }
  }

  const isFirstTab = activeTab === 0
  const isLastTab = activeTab === 1

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[70vw] max-w-6xl h-[90vh] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab.toString()}
          onValueChange={(value) => setActiveTab(Number(value))}
          className="flex-1 flex flex-col overflow-hidden"
        >

          <div className="flex-1 overflow-y-auto pr-2 px-2.5">
            <TabsContent value="0" className="mt-5">
              {/* Avatar Upload Section */}
              <div className="flex flex-col items-center gap-3 mb-6 pb-6 border-b border-border">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={formData.avatar || ""} alt="Employee Avatar" />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      <User size={32} />
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 cursor-pointer"
                    onClick={() => {
                      const input = document.createElement("input")
                      input.type = "file"
                      input.accept = "image/*"
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) {
                          // Validate image file
                          if (!file.type.startsWith("image/")) {
                            toast({
                              title: "Invalid File Type",
                              description: "Please upload a valid image file",
                              variant: "destructive",
                            })
                            return
                          }

                          // Check file size (max 5MB)
                          if (file.size > 5 * 1024 * 1024) {
                            toast({
                              title: "File Too Large",
                              description: "Image size should be less than 5MB",
                              variant: "destructive",
                            })
                            return
                          }

                          const reader = new FileReader()
                          reader.onloadend = () => {
                            const imageData = reader.result as string
                            // Store image in "image" key as per requirement
                            onFormDataChange("image", imageData)
                            // Also keep avatar for backward compatibility
                            onFormDataChange("avatar", imageData)
                          }
                          reader.readAsDataURL(file)
                        }
                      }
                      input.click()
                    }}
                  >
                    <Upload size={14} />
                  </Button>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Profile Picture</p>
                  <p className="text-xs text-muted-foreground">Click to upload or change</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  field={{
                    id: "firstName",
                    label: "First Name",
                    type: "text",
                    placeholder: "Enter first name",
                    required: true,
                    colSpan: 1,
                  }}
                  value={formData.firstName}
                  onChange={(value) => onFormDataChange("firstName", value)}
                />
                <FormField
                  field={{
                    id: "lastName",
                    label: "Last Name",
                    type: "text",
                    placeholder: "Enter last name",
                    required: true,
                    colSpan: 1,
                  }}
                  value={formData.lastName}
                  onChange={(value) => onFormDataChange("lastName", value)}
                />
                <FormField
                  field={{
                    id: "age",
                    label: "Age",
                    type: "number",
                    placeholder: "Enter age",
                    colSpan: 1,
                    min: 18,
                    max: 65,
                  }}
                  value={formData.age}
                  onChange={(value) => onFormDataChange("age", value)}
                />
                <MobileNumberField
                  id="phone"
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(value) => onFormDataChange("phone", value)}
                  placeholder="Enter phone number"
                  required={true}
                  colSpan={1}
                />
                <FormField
                  field={{
                    id: "email",
                    label: "Email Address",
                    type: "email",
                    placeholder: "Enter email address",
                    required: true,
                    colSpan: 1,
                    disabled: isEditing, // Disable email in edit mode
                  }}
                  value={formData.email}
                  onChange={(value) => onFormDataChange("email", value)}
                />
                {!isEditing && (
                  <FormField
                    field={{
                      id: "password",
                      label: "Password",
                      type: "password",
                      placeholder: "Enter password",
                      required: true,
                      colSpan: 1,
                    }}
                    value={formData.password || ""}
                    onChange={(value) => onFormDataChange("password", value)}
                  />
                )}
                <FormField
                  field={{
                    id: "status",
                    label: "Status",
                    type: "select",
                    colSpan: 1,
                    options: [
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ],
                  }}
                  value={formData.status || "active"}
                  onChange={(value) => onFormDataChange("status", value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="1" className="mt-5">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  field={{
                    id: "address",
                    label: "Complete Address",
                    type: "textarea",
                    placeholder: "Enter complete address",
                    colSpan: 2,
                  }}
                  value={formData.address}
                  onChange={(value) => onFormDataChange("address", value)}
                />
                <FormField
                  field={{
                    id: "aadharNumber",
                    label: "Aadhar Number",
                    type: "text",
                    placeholder: "Enter 12-digit Aadhar number",
                    colSpan: 1,
                    maxLength: 12,
                  }}
                  value={formData.aadharNumber}
                  onChange={(value) => {
                    // Only allow numbers
                    const numericValue = value.replace(/[^0-9]/g, "")
                    onFormDataChange("aadharNumber", numericValue)
                  }}
                />
                <FormField
                  field={{
                    id: "panCardNumber",
                    label: "PAN Card Number",
                    type: "text",
                    placeholder: "Enter PAN card number (e.g., ABCDE1234F)",
                    colSpan: 1,
                    maxLength: 10,
                  }}
                  value={formData.panCardNumber}
                  onChange={(value) => {
                    // Convert to uppercase and format
                    const formattedValue = value.toUpperCase()
                    onFormDataChange("panCardNumber", formattedValue)
                  }}
                />
                
                {/* Employee Document Upload Section */}
                <div className="col-span-2 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText size={18} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Employee Document</p>
                      <p className="text-xs text-muted-foreground">Upload any relevant documents (PDF, JPG, PNG)</p>
                    </div>
                  </div>
                  
                  {formData.employeeFile && formData.employeeFile.trim() !== "" ? (
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText size={16} className="text-primary" />
                          <span className="text-sm font-medium">Document uploaded</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log("Removing file...")
                            onFormDataChange("employeeFile", "")
                          }}
                          className="cursor-pointer"
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        File uploaded successfully. Click "Remove" to delete and upload a new file.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          console.log("Opening file picker...")
                          const input = document.createElement("input")
                          input.type = "file"
                          input.accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            console.log("File selected:", file?.name)
                            if (file) {
                              // Check file size (max 10MB)
                              if (file.size > 10 * 1024 * 1024) {
                                toast({
                                  title: "File Too Large",
                                  description: "File size should be less than 10MB",
                                  variant: "destructive",
                                })
                                return
                              }

                              const reader = new FileReader()
                              reader.onloadend = () => {
                                const fileData = reader.result as string
                                console.log("File read complete, updating form data...")
                                onFormDataChange("employeeFile", fileData)
                                toast({
                                  title: "File Uploaded",
                                  description: "Document uploaded successfully",
                                })
                              }
                              reader.onerror = () => {
                                console.error("File read error")
                                toast({
                                  title: "Upload Error",
                                  description: "Failed to read file. Please try again.",
                                  variant: "destructive",
                                })
                              }
                              reader.readAsDataURL(file)
                            }
                          }
                          input.click()
                        }}
                        className="cursor-pointer"
                      >
                        <Upload size={14} className="mr-2" />
                        Upload Document
                      </Button>
                      <div className="text-xs text-muted-foreground">
                        Supported formats: PDF, JPG, PNG, DOC, DOCX (Max: 10MB)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

                      </div>
        </Tabs>

        <DialogFooter className="shrink-0 border-t border-border pt-4 mt-4">
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading} className="cursor-pointer">
              {cancelLabel}
            </Button>
            <div className="flex gap-2">
              {!isFirstTab && (
                <Button variant="outline" onClick={handlePrevious} disabled={isLoading} className="cursor-pointer">
                  <ChevronLeft size={16} className="mr-1" />
                  Previous
                </Button>
              )}
              {!isLastTab ? (
                <Button onClick={handleNext} disabled={isLoading || !isFirstTabValid()} className="cursor-pointer">
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              ) : (
                <Button onClick={onSave} disabled={isLoading} className="cursor-pointer">
                  {isLoading ? "Saving..." : saveLabel}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
