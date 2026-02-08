"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Save,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  MapPin,
  Users,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Percent,
  LifeBuoy,
  Globe,
  Clock,
} from "lucide-react"
import { ImageUploadField } from "@/components/common/image-upload-field"
import { InputField } from "@/components/common/input-field"
import { TextareaField } from "@/components/common/textarea-field"
import { useGetWebSettingsQuery, useUpdateWebSettingsMutation } from "@/lib/store/api/webSettingsApi"
import { useEffect, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"


export default function WebSettingsPage() {
  const [settings, setSettings] = useState({
    businessName: "RepairOnGo",
    email: "info@repaongo.com",
    phone: "+1 (800) 123-4567",
    address: "123 Main St, New York, NY 10001",
    city: "New York",
    zipCode: "10001",
    facebook: "https://facebook.com/repaongo",
    twitter: "https://twitter.com/repaongo",
    instagram: "https://instagram.com/repaongo",
    linkedin: "https://linkedin.com/company/repaongo",
    logo: "",
    favicon: "",
    happyCustomers: "1,000+",
    successRate: "98%",
    supportAvailable: "24/7",
    serviceAreas: "NY, NJ, CT",
    supportHours: "Mon–Sat 9am–6pm",
  })
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data, isLoading } = useGetWebSettingsQuery()
  const [updateWebSettings, { isLoading: isSaving }] = useUpdateWebSettingsMutation()
  const { toast } = useToast()

  useEffect(() => {
    const fetched = data?.settings
    if (fetched) {
      setSettings((prev) => ({ ...prev, ...fetched }))
    }
  }, [data])

  function isValidEmail(email: string) {
    if (!email) return false
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  function isValidPhone(phone: string) {
    if (!phone) return false
    const digits = phone.replace(/\D/g, "")
    return digits.length >= 7
  }
  function isValidUrl(url: string) {
    if (!url) return true
    try {
      const u = new URL(url)
      return u.protocol === "http:" || u.protocol === "https:"
    } catch {
      return false
    }
  }

  const validationRules = useMemo(
    () => ({
      email: (v: string) => (isValidEmail(v) ? "" : "Invalid email address"),
      phone: (v: string) => (isValidPhone(v) ? "" : "Invalid phone number"),
      facebook: (v: string) => (isValidUrl(v) ? "" : "Must be a valid URL"),
      twitter: (v: string) => (isValidUrl(v) ? "" : "Must be a valid URL"),
      instagram: (v: string) => (isValidUrl(v) ? "" : "Must be a valid URL"),
      linkedin: (v: string) => (isValidUrl(v) ? "" : "Must be a valid URL"),
    }),
    []
  )

  const handleSave = async () => {
    const newErrors: Record<string, string> = {}
    Object.entries(validationRules).forEach(([key, fn]) => {
      const val = settings[key as keyof typeof settings] as string
      const err = fn(val || "")
      if (err) newErrors[key] = err
    })
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    const resp = await updateWebSettings({ settings }).unwrap().catch(() => null)
    if (resp && resp.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      toast({
        title: "Settings Saved",
        description: "Web settings updated successfully.",
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

 

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Web Settings</h1>
        <p className="text-muted-foreground">Configure your business information and social links</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InputField
              label="Business Name"
              name="businessName"
              value={settings.businessName}
              onChange={handleChange as any}
              icon={Building2}
            />
            <InputField
              label="Email"
              name="email"
              type="email"
              value={settings.email}
              onChange={handleChange as any}
              icon={Mail}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            <InputField
              label="Phone"
              name="phone"
              type="tel"
              value={settings.phone}
              onChange={handleChange as any}
              icon={Phone}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            <TextareaField
              label="Address"
              name="address"
              value={settings.address}
              onChange={handleChange as any}
              icon={MapPin}
              rows={3}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const socialIconComponents = {
                facebook: Facebook,
                twitter: Twitter,
                instagram: Instagram,
                linkedin: Linkedin,
              } as const
              return [
                { key: "facebook", label: "Facebook" },
                { key: "twitter", label: "Twitter" },
                { key: "instagram", label: "Instagram" },
                { key: "linkedin", label: "LinkedIn" },
              ].map(({ key, label }) => {
                const IconComp = socialIconComponents[key as keyof typeof socialIconComponents]
                return (
                  <InputField
                    key={key}
                    label={label}
                    name={key}
                    type="url"
                    value={settings[key as keyof typeof settings] as string}
                    onChange={handleChange as any}
                    icon={IconComp}
                  />
                )
              })
            })()}
            {(errors.facebook || errors.twitter || errors.instagram || errors.linkedin) && (
              <div className="space-y-1">
                {errors.facebook && <p className="text-xs text-destructive">Facebook: {errors.facebook}</p>}
                {errors.twitter && <p className="text-xs text-destructive">Twitter: {errors.twitter}</p>}
                {errors.instagram && <p className="text-xs text-destructive">Instagram: {errors.instagram}</p>}
                {errors.linkedin && <p className="text-xs text-destructive">LinkedIn: {errors.linkedin}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Metrics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Happy Customers"
              name="happyCustomers"
              value={settings.happyCustomers}
              onChange={handleChange as any}
              icon={Users}
            />
            <InputField
              label="Success Rate"
              name="successRate"
              value={settings.successRate}
              onChange={handleChange as any}
              icon={Percent}
            />
            <InputField
              label="Support Available"
              name="supportAvailable"
              value={settings.supportAvailable}
              onChange={handleChange as any}
              icon={LifeBuoy}
            />
            <InputField
              label="Service Areas"
              name="serviceAreas"
              value={settings.serviceAreas}
              onChange={handleChange as any}
              icon={Globe}
            />
            <InputField
              label="Support Hours"
              name="supportHours"
              value={settings.supportHours}
              onChange={handleChange as any}
              icon={Clock}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Logo & Favicon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex flex-row gap-4">
            <ImageUploadField
              label="Logo Upload"
              value={settings.logo}
              onSelect={(data) => setSettings((prev) => ({ ...prev, logo: data }))}
            />
            <ImageUploadField
              label="Favicon Upload"
              value={settings.favicon}
              onSelect={(data) => setSettings((prev) => ({ ...prev, favicon: data }))}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <Button size="lg" onClick={handleSave} disabled={isSaving || isLoading} className="cursor-pointer">
          <Save size={18} className="mr-2" /> Save Settings
        </Button>
        {/* {saved && (
          <div className="flex items-center gap-2 text-green-600">
            <AlertCircle size={18} />
            <p className="text-sm">Settings saved successfully!</p>
          </div>
        )} */}
      </div>
    </div>
  )
}
