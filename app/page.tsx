"use client"

import type React from "react"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email || !password) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    // Simple demo credentials
    if (email === "admin@repairon.go" && password === "password") {
      login(email, password)
    } else {
      setError("Invalid credentials. Try: admin@repairon.go / password")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="hidden md:flex items-center justify-center bg-muted/60 p-8">
            <div className="w-full max-w-sm">
              <Image
                src="/image/login-illustration.svg"
                alt="Login illustration"
                width={500}
                height={500}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
          <div className="p-6 md:p-8">
            <CardHeader className="px-0 pb-4 space-y-2">
              <CardTitle className="text-2xl">RepairOnGo Admin</CardTitle>
              <CardDescription>Sign in to your admin account</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@repairon.go"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 pr-10 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">{error}</div>
                )}

                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner className="text-background" />
                      <span>Signing in...</span>
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Secure access for authorized RepairOnGo administrators only.
                </p>
              </form>
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  )
}
