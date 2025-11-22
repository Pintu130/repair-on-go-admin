"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { FormField as FormFieldComponent } from "./form-field"

export type FieldType = "text" | "number" | "email" | "tel" | "password" | "select" | "textarea"

export interface SelectOption {
  value: string
  label: string
}

export interface FormField {
  id: string
  label: string
  type: FieldType
  placeholder?: string
  required?: boolean
  colSpan?: number // For grid layout (1-2, default: 1)
  options?: SelectOption[] // For select type
  min?: number | string
  max?: number | string
  maxLength?: number
  disabled?: boolean
}

export interface FormSection {
  title: string
  fields: FormField[]
  gridCols?: number // Default: 2
}

interface FormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  sections: FormSection[]
  formData: Record<string, any>
  onFormDataChange: (fieldId: string, value: any) => void
  onSave: () => void
  onCancel?: () => void
  saveLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  maxWidth?: string
}

export function FormModal({
  open,
  onOpenChange,
  title,
  sections,
  formData,
  onFormDataChange,
  onSave,
  onCancel,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  isLoading = false,
  maxWidth = "max-w-4xl",
}: FormModalProps) {
  const [activeTab, setActiveTab] = useState(0)

  // Reset to first tab when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setActiveTab(0)
    }
    onOpenChange(isOpen)
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      handleOpenChange(false)
    }
  }

  const handleNext = () => {
    if (activeTab < sections.length - 1) {
      setActiveTab(activeTab + 1)
    }
  }

  const handlePrevious = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1)
    }
  }

  const isFirstTab = activeTab === 0
  const isLastTab = activeTab === sections.length - 1

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={`${maxWidth} max-h-[90vh] overflow-hidden flex flex-col`}>
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab.toString()} onValueChange={(value) => setActiveTab(Number(value))} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="shrink-0 w-full justify-start mb-4">
            {sections.map((section, index) => (
              <TabsTrigger key={index} value={index.toString()}>
                {section.title}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 overflow-y-auto pr-2">
            {sections.map((section, sectionIndex) => (
              <TabsContent key={sectionIndex} value={sectionIndex.toString()} className="mt-0">
                <div
                  className="grid gap-4"
                  style={{ gridTemplateColumns: `repeat(${section.gridCols || 2}, minmax(0, 1fr))` }}
                >
                  {section.fields.map((field) => (
                    <FormFieldComponent
                      key={field.id}
                      field={field}
                      value={formData[field.id]}
                      onChange={(value) => onFormDataChange(field.id, value)}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>

        <DialogFooter className="shrink-0 border-t border-border pt-4 mt-4">
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              {cancelLabel}
            </Button>
            <div className="flex gap-2">
              {!isFirstTab && (
                <Button variant="outline" onClick={handlePrevious} disabled={isLoading}>
                  <ChevronLeft size={16} className="mr-1" />
                  Previous
                </Button>
              )}
              {!isLastTab ? (
                <Button onClick={handleNext} disabled={isLoading}>
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              ) : (
                <Button onClick={onSave} disabled={isLoading}>
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

