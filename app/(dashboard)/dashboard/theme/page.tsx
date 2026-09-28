"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Loader2, Palette, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PageHeader } from "@/components/common/page-header"

import { useGetWebSettingsQuery, useUpdateThemeColorsMutation } from "@/lib/store/api/webSettingsApi"
import { useToast } from "@/components/ui/use-toast"
import {
  THEME_GROUPS,
  THEME_TOKENS,
  isCustomized,
  normalizeHex,
  type ThemeColorKey,
  type ThemeColors,
  type ThemeToken,
} from "@/lib/theme-tokens"

const HEX_PATTERN = /^#?(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export default function ThemeColorsPage() {
  const { data, isLoading } = useGetWebSettingsQuery()
  const [updateThemeColors, { isLoading: isSaving }] = useUpdateThemeColorsMutation()
  const { toast } = useToast()

  const [draft, setDraft] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState(false)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)

  useEffect(() => {
    const saved = data?.settings
    if (!saved) return
    const next: Record<string, string> = {}
    for (const token of THEME_TOKENS) {
      const value = saved[token.key as ThemeColorKey]
      if (typeof value === "string" && HEX_PATTERN.test(value.trim())) {
        next[token.key] = value.trim().toUpperCase()
      }
    }
    setDraft(next)
    setDirty(false)
  }, [data])

  const resolved = useMemo(() => {
    const map: Record<string, string> = {}
    for (const token of THEME_TOKENS) {
      const hex = normalizeHex(draft[token.key] ?? "") ?? token.defaultHex
      map[token.key] = hex
    }
    return map
  }, [draft])

  const invalidKeys = useMemo(
    () => THEME_TOKENS.filter((token) => draft[token.key] !== undefined && !normalizeHex(draft[token.key] ?? "")).map((token) => token.key),
    [draft]
  )

  const customizedCount = useMemo(
    () => THEME_TOKENS.filter((token) => isCustomized(token, resolved[token.key])).length,
    [resolved]
  )

  function updateToken(token: ThemeToken, raw: string) {
    setDraft((prev) => {
      const next = { ...prev }
      if (!raw.trim()) {
        delete next[token.key]
      } else {
        next[token.key] = raw
      }
      return next
    })
    setDirty(true)
  }

  function revertToken(token: ThemeToken) {
    setDraft((prev) => {
      const next = { ...prev }
      delete next[token.key]
      return next
    })
    setDirty(true)
  }

  function handleReset() {
    setDraft({})
    setDirty(true)
    toast({ title: "Reset to defaults", description: "Review the changes, then click Save Theme to publish." })
  }

  async function handleSave() {
    if (invalidKeys.length > 0) {
      toast({
        title: "Invalid colour value",
        description: "Fix the highlighted hex values before saving.",
        variant: "destructive",
      })
      return
    }

    const colors: ThemeColors = {}
    for (const token of THEME_TOKENS) {
      const value = resolved[token.key]
      if (isCustomized(token, value)) {
        colors[token.key as ThemeColorKey] = value
      }
    }

    try {
      await updateThemeColors({ colors }).unwrap()
      setDirty(false)
      toast({
        title: "Theme saved",
        description:
          customizedCount > 0
            ? `${customizedCount} colour${customizedCount === 1 ? "" : "s"} applied to the live site.`
            : "Theme reset to the default palette.",
      })
    } catch (error: any) {
      toast({
        title: "Failed to save theme",
        description: error?.data || error?.message || "Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Theme Colors"
        subtitle="Customise every colour used across the live site. Changes go live once you click Save Theme."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setConfirmResetOpen(true)}
              disabled={isSaving || isLoading}
              className="cursor-pointer"
            >
              <RotateCcw className="mr-2 size-4" />
              Reset to defaults
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isLoading || !dirty || invalidKeys.length > 0} className="cursor-pointer">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 size-4" />
                  Save Theme
                </>
              )}
            </Button>
          </>
        }
      />

      <AlertDialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset theme to defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              Every colour returns to the palette currently shipped in the site&apos;s stylesheet. Click &ldquo;Save
              Theme&rdquo; to publish.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                handleReset()
                setConfirmResetOpen(false)
              }}
            >
              <RotateCcw className="mr-2 size-4" />
              Reset to defaults
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="size-5 text-muted-foreground" />
                Colour Palette
              </CardTitle>
              <CardDescription className="mt-2">
                Pick a colour or type a hex value. A dot marks a customised token. The dark mode palette stays as
                authored in the stylesheet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {THEME_GROUPS.map((group) => {
                  const groupTokens = THEME_TOKENS.filter((token) => token.group === group)
                  const groupDirty = groupTokens.some((token) => draft[token.key] !== undefined)
                  return (
                    <div key={group}>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
                        {groupDirty ? <span className="size-1.5 rounded-full bg-destructive" title="Unsaved changes in this group" /> : null}
                      </div>
                      <Separator className="mt-2 mb-4" />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {groupTokens.map((token) => (
                          <TokenField
                            key={token.key}
                            token={token}
                            value={resolved[token.key]}
                            rawValue={draft[token.key]}
                            dirty={draft[token.key] !== undefined}
                            invalid={draft[token.key] !== undefined && !normalizeHex(draft[token.key] ?? "")}
                            onChange={(raw) => updateToken(token, raw)}
                            onRevert={() => revertToken(token)}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4 lg:sticky lg:top-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>Updates as you pick. The live site changes only after you save.</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="overflow-hidden rounded-lg border"
                  style={{ backgroundColor: resolved.themeBackground, borderColor: resolved.themeBorder }}
                >
                  <div
                    className="flex items-center justify-between px-3 py-1.5 text-[11px] font-medium"
                    style={{ backgroundColor: resolved.themeAnnouncement, color: resolved.themeAnnouncementForeground }}
                  >
                    <span>Free pickup &amp; diagnosis</span>
                    <span className="opacity-70">Announcement</span>
                  </div>
                  <div className="px-3 py-4" style={{ color: resolved.themeForeground }}>
                    <p className="text-sm font-semibold">Device repair, done right</p>
                    <p className="mt-1 text-xs opacity-70">
                      Trusted technicians with transparent pricing and a 90-day warranty.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className="rounded-md px-3 py-1.5 text-xs font-semibold"
                        style={{ backgroundColor: resolved.themePrimary, color: resolved.themePrimaryForeground }}
                      >
                        Book a repair
                      </span>
                      <span
                        className="rounded-md px-3 py-1.5 text-xs font-semibold"
                        style={{ backgroundColor: resolved.themeAccent, color: resolved.themeAccentForeground }}
                      >
                        See pricing
                      </span>
                    </div>
                    <div
                      className="mt-4 rounded-md border p-2.5"
                      style={{ backgroundColor: resolved.themeCard, borderColor: resolved.themeBorder, color: resolved.themeCardForeground }}
                    >
                      <p className="text-xs font-semibold">iPhone screen replacement</p>
                      <p className="mt-0.5 text-[11px] opacity-70">From ₹2,499 &middot; 60 min</p>
                    </div>
                    <div
                      className="mt-2 rounded-md p-2.5"
                      style={{ backgroundColor: resolved.themeMuted, color: resolved.themeMutedForeground }}
                    >
                      <p className="text-[11px]">Muted surface &amp; muted text</p>
                    </div>
                    <div
                      className="mt-2 rounded-md p-2.5"
                      style={{ backgroundColor: resolved.themeSecondary, color: resolved.themeSecondaryForeground }}
                    >
                      <p className="text-[11px]">Secondary surface</p>
                    </div>
                    <div
                      className="mt-2 rounded-md p-2.5 text-[11px]"
                      style={{ backgroundColor: resolved.themeDestructive, color: resolved.themeDestructiveForeground }}
                    >
                      Destructive alert
                    </div>
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="size-3 rounded-full" style={{ backgroundColor: resolved.themePrimary }} />
                      <span className="size-3 rounded-full" style={{ backgroundColor: resolved.themePrimaryLight }} />
                      <span className="size-3 rounded-full" style={{ backgroundColor: resolved.themePrimaryDark }} />
                      <span
                        className="ml-auto size-4 rounded-full border-2"
                        style={{ borderColor: resolved.themeRing, backgroundColor: "transparent" }}
                        title="Ring"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Status</p>
              <p className="mt-1">
                {invalidKeys.length > 0
                  ? `${invalidKeys.length} invalid hex value${invalidKeys.length === 1 ? "" : "s"} — fix before saving.`
                  : dirty
                    ? `${customizedCount} colour${customizedCount === 1 ? "" : "s"} changed and not saved yet.`
                    : "Saved theme is in sync with the live site."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface TokenFieldProps {
  token: ThemeToken
  value: string
  rawValue: string | undefined
  dirty: boolean
  invalid: boolean
  onChange: (raw: string) => void
  onRevert: () => void
}

function TokenField({ token, value, rawValue, dirty, invalid, onChange, onRevert }: TokenFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={token.key} className="text-xs">
          {token.label}
        </Label>
        {dirty ? (
          <button
            type="button"
            onClick={onRevert}
            title={`Reset ${token.label} to ${token.defaultHex}`}
            aria-label={`Reset ${token.label}`}
            className="inline-flex size-5 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="size-3" />
          </button>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <span
          className="size-8 shrink-0 cursor-pointer overflow-hidden rounded border"
          style={invalid ? { backgroundColor: "hsl(var(--muted))" } : { backgroundColor: value, borderColor: "hsl(var(--border))" }}
        >
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value.toUpperCase())}
            aria-label={`${token.label} colour picker`}
            className="size-full cursor-pointer border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-0"
          />
        </span>
        <Input
          id={token.key}
          value={rawValue ?? value}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
          maxLength={7}
          aria-invalid={invalid}
          className="h-8 flex-1 px-2 text-xs"
          placeholder={token.defaultHex}
        />
      </div>
      <p className={`text-[11px] ${invalid ? "text-destructive" : "text-muted-foreground"}`}>
        {invalid ? "Use a 3 or 6 digit hex value" : token.cssVar}
      </p>
    </div>
  )
}
