"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, AlertCircle } from "lucide-react"

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
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
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
            <div>
              <label className="block text-sm font-medium mb-2">Business Name</label>
              <input
                type="text"
                name="businessName"
                value={settings.businessName}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={settings.email}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <textarea
                name="address"
                value={settings.address}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  value={settings.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Zip Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={settings.zipCode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "facebook", label: "Facebook" },
              { key: "twitter", label: "Twitter" },
              { key: "instagram", label: "Instagram" },
              { key: "linkedin", label: "LinkedIn" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-2">{label}</label>
                <input
                  type="url"
                  name={key}
                  value={settings[key as keyof typeof settings]}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logo & Favicon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Logo Upload</label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-muted/50">
              <p className="text-muted-foreground">Drag and drop your logo here or click to browse</p>
              <input type="file" className="hidden" accept="image/*" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Favicon Upload</label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-muted/50">
              <p className="text-muted-foreground">Drag and drop your favicon here or click to browse</p>
              <input type="file" className="hidden" accept="image/*" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button size="lg" onClick={handleSave}>
          <Save size={18} className="mr-2" /> Save Settings
        </Button>
        {saved && (
          <div className="flex items-center gap-2 text-green-600">
            <AlertCircle size={18} />
            <p className="text-sm">Settings saved successfully!</p>
          </div>
        )}
      </div>
    </div>
  )
}
