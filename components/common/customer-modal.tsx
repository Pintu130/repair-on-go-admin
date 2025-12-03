"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, Upload, User } from "lucide-react"
import { FormField } from "@/components/common/form-field"
import { MobileNumberField } from "@/components/common/mobile-number-field"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"

interface CustomerModalProps {
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

export function CustomerModal({
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
}: CustomerModalProps) {
  const [activeTab, setActiveTab] = useState(0)
  const { toast } = useToast()

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setActiveTab(0)
    }
    onOpenChange(isOpen)
  }

  const handleNext = () => {
    if (activeTab < 1) {
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
      <DialogContent className="w-[60vw] max-w-5xl h-[90vh] max-h-[70vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab.toString()}
          onValueChange={(value) => setActiveTab(Number(value))}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="shrink-0 w-full justify-start mb-4">
            <TabsTrigger value="0" className="cursor-pointer">Personal Information</TabsTrigger>
            <TabsTrigger value="1" className="cursor-pointer">Address Information</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pr-2 px-2.5">
            <TabsContent value="0" className="mt-0">
              {/* Avatar Upload Section */}
              <div className="flex flex-col items-center gap-3 mb-6 pb-6 border-b border-border">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={formData.image || formData.avatar || ""} alt="Customer Avatar" />
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
                    min: 1,
                    max: 120,
                  }}
                  value={formData.age}
                  onChange={(value) => onFormDataChange("age", value)}
                />
                <MobileNumberField
                  id="mobileNumber"
                  label="Mobile Number"
                  value={formData.mobileNumber}
                  onChange={(value) => onFormDataChange("mobileNumber", value)}
                  placeholder="Enter mobile number"
                  required={true}
                  colSpan={1}
                />
                <FormField
                  field={{
                    id: "emailAddress",
                    label: "Email Address",
                    type: "email",
                    placeholder: "Enter email address",
                    required: true,
                    colSpan: 1,
                    disabled: isEditing, // Disable email in edit mode
                  }}
                  value={formData.emailAddress}
                  onChange={(value) => onFormDataChange("emailAddress", value)}
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

            <TabsContent value="1" className="mt-0">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  field={{
                    id: "houseNo",
                    label: "House No, Building Name",
                    type: "text",
                    placeholder: "Enter house no/building name",
                    colSpan: 1,
                  }}
                  value={formData.houseNo}
                  onChange={(value) => onFormDataChange("houseNo", value)}
                />
                <FormField
                  field={{
                    id: "roadName",
                    label: "Road Name, Area, Colony",
                    type: "text",
                    placeholder: "Enter road name/area/colony",
                    colSpan: 1,
                  }}
                  value={formData.roadName}
                  onChange={(value) => onFormDataChange("roadName", value)}
                />
                <FormField
                  field={{
                    id: "nearbyLandmark",
                    label: "Nearby Famous Shop/Mall/Landmark",
                    type: "text",
                    placeholder: "Enter nearby landmark",
                    colSpan: 2,
                  }}
                  value={formData.nearbyLandmark}
                  onChange={(value) => onFormDataChange("nearbyLandmark", value)}
                />
                <FormField
                  field={{
                    id: "state",
                    label: "State",
                    type: "select",
                    colSpan: 1,
                    options: [
                      { value: "gujarat", label: "Gujarat" },
                      { value: "maharashtra", label: "Maharashtra" },
                      { value: "rajasthan", label: "Rajasthan" },
                      { value: "delhi", label: "Delhi" },
                      { value: "karnataka", label: "Karnataka" },
                      { value: "tamil-nadu", label: "Tamil Nadu" },
                      { value: "west-bengal", label: "West Bengal" },
                      { value: "uttar-pradesh", label: "Uttar Pradesh" },
                    ],
                  }}
                  value={formData.state}
                  onChange={(value) => onFormDataChange("state", value)}
                />
                <FormField
                  field={{
                    id: "city",
                    label: "City",
                    type: "text",
                    placeholder: "Enter city",
                    colSpan: 1,
                  }}
                  value={formData.city}
                  onChange={(value) => onFormDataChange("city", value)}
                />
                <FormField
                  field={{
                    id: "pincode",
                    label: "Pincode",
                    type: "text",
                    placeholder: "Enter pincode",
                    colSpan: 1,
                    maxLength: 6,
                  }}
                  value={formData.pincode}
                  onChange={(value) => onFormDataChange("pincode", value)}
                />
                <FormField
                  field={{
                    id: "addressType",
                    label: "Address Type",
                    type: "select",
                    colSpan: 1,
                    options: [
                      { value: "home", label: "Home" },
                      { value: "work", label: "Work" },
                      { value: "other", label: "Other" },
                    ],
                  }}
                  value={formData.addressType}
                  onChange={(value) => onFormDataChange("addressType", value)}
                />
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
                <Button onClick={handleNext} disabled={isLoading} className="cursor-pointer">
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

