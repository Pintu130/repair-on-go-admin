/**
 * Theme colour tokens for the RepairOnGo landing site.
 *
 * Stored flat on the `websettings/default` Firestore document as `theme*` fields.
 * `defaultValue` mirrors the exact value authored in the landing site's
 * `app/globals.css` `:root` block so an untouched theme renders pixel-identical
 * to today. `defaultHex` is the hex form used by the admin colour picker.
 *
 * Keep in sync with `lib/theme.ts` in repair-on-go-landing.
 */

export type ThemeTokenGroup =
  | "Surfaces"
  | "Brand"
  | "Secondary & Accent"
  | "Muted"
  | "Feedback"
  | "Controls"
  | "Announcement"
  | "Sidebar"

export interface ThemeToken {
  /** Firestore field name on the `websettings/default` document. */
  key: string
  /** CSS custom property on the landing site. */
  cssVar: string
  label: string
  group: ThemeTokenGroup
  /** Exact value as authored in the landing `globals.css` `:root` block. */
  defaultValue: string
  /** Hex form of `defaultValue`, used for the colour picker and comparisons. */
  defaultHex: string
  /** Announcement tokens are consumed as raw hex, not as HSL triplets. */
  raw?: boolean
}

export const THEME_TOKENS: ThemeToken[] = [
  // Surfaces
  { key: "themeBackground", cssVar: "--background", label: "Background", group: "Surfaces", defaultValue: "0 0% 100%", defaultHex: "#FFFFFF" },
  { key: "themeForeground", cssVar: "--foreground", label: "Foreground", group: "Surfaces", defaultValue: "215 25% 27%", defaultHex: "#344256" },
  { key: "themeCard", cssVar: "--card", label: "Card", group: "Surfaces", defaultValue: "0 0% 100%", defaultHex: "#FFFFFF" },
  { key: "themeCardForeground", cssVar: "--card-foreground", label: "Card Foreground", group: "Surfaces", defaultValue: "215 25% 27%", defaultHex: "#344256" },
  { key: "themePopover", cssVar: "--popover", label: "Popover", group: "Surfaces", defaultValue: "0 0% 100%", defaultHex: "#FFFFFF" },
  { key: "themePopoverForeground", cssVar: "--popover-foreground", label: "Popover Foreground", group: "Surfaces", defaultValue: "215 25% 27%", defaultHex: "#344256" },

  // Brand
  { key: "themePrimary", cssVar: "--primary", label: "Primary", group: "Brand", defaultValue: "0 84% 55%", defaultHex: "#ED2C2C" },
  { key: "themePrimaryForeground", cssVar: "--primary-foreground", label: "Primary Foreground", group: "Brand", defaultValue: "0 0% 100%", defaultHex: "#FFFFFF" },
  { key: "themePrimaryLight", cssVar: "--primary-light", label: "Primary Light", group: "Brand", defaultValue: "0 84% 95%", defaultHex: "#FDE8E8" },
  { key: "themePrimaryDark", cssVar: "--primary-dark", label: "Primary Dark", group: "Brand", defaultValue: "0 84% 40%", defaultHex: "#BC1010" },

  // Secondary & Accent
  { key: "themeSecondary", cssVar: "--secondary", label: "Secondary", group: "Secondary & Accent", defaultValue: "210 20% 97%", defaultHex: "#F6F7F9" },
  { key: "themeSecondaryForeground", cssVar: "--secondary-foreground", label: "Secondary Foreground", group: "Secondary & Accent", defaultValue: "210 20% 27%", defaultHex: "#374553" },
  { key: "themeAccent", cssVar: "--accent", label: "Accent", group: "Secondary & Accent", defaultValue: "180 95% 45%", defaultHex: "#06E0E0" },
  { key: "themeAccentForeground", cssVar: "--accent-foreground", label: "Accent Foreground", group: "Secondary & Accent", defaultValue: "0 0% 100%", defaultHex: "#FFFFFF" },
  { key: "themeAccentLight", cssVar: "--accent-light", label: "Accent Light", group: "Secondary & Accent", defaultValue: "180 95% 95%", defaultHex: "#E6FEFE" },

  // Muted
  { key: "themeMuted", cssVar: "--muted", label: "Muted", group: "Muted", defaultValue: "210 20% 97%", defaultHex: "#F6F7F9" },
  { key: "themeMutedForeground", cssVar: "--muted-foreground", label: "Muted Foreground", group: "Muted", defaultValue: "210 15% 55%", defaultHex: "#7B8C9D" },

  // Feedback
  { key: "themeDestructive", cssVar: "--destructive", label: "Destructive", group: "Feedback", defaultValue: "0 84% 60%", defaultHex: "#EF4343" },
  { key: "themeDestructiveForeground", cssVar: "--destructive-foreground", label: "Destructive Foreground", group: "Feedback", defaultValue: "0 0% 100%", defaultHex: "#FFFFFF" },

  // Controls
  { key: "themeBorder", cssVar: "--border", label: "Border", group: "Controls", defaultValue: "210 20% 90%", defaultHex: "#E0E6EB" },
  { key: "themeInput", cssVar: "--input", label: "Input", group: "Controls", defaultValue: "210 20% 90%", defaultHex: "#E0E6EB" },
  { key: "themeRing", cssVar: "--ring", label: "Ring", group: "Controls", defaultValue: "0 84% 55%", defaultHex: "#ED2C2C" },

  // Announcement bar
  { key: "themeAnnouncement", cssVar: "--announcement", label: "Announcement Bar", group: "Announcement", defaultValue: "#FDE9E9", defaultHex: "#FDE9E9", raw: true },
  { key: "themeAnnouncementForeground", cssVar: "--announcement-foreground", label: "Announcement Text", group: "Announcement", defaultValue: "#b91c1c", defaultHex: "#B91C1C", raw: true },

  // Sidebar
  { key: "themeSidebarBackground", cssVar: "--sidebar-background", label: "Sidebar Background", group: "Sidebar", defaultValue: "0 0% 98%", defaultHex: "#FAFAFA" },
  { key: "themeSidebarForeground", cssVar: "--sidebar-foreground", label: "Sidebar Foreground", group: "Sidebar", defaultValue: "240 5.3% 26.1%", defaultHex: "#3F3F46" },
  { key: "themeSidebarPrimary", cssVar: "--sidebar-primary", label: "Sidebar Primary", group: "Sidebar", defaultValue: "240 5.9% 10%", defaultHex: "#18181B" },
  { key: "themeSidebarPrimaryForeground", cssVar: "--sidebar-primary-foreground", label: "Sidebar Primary Foreground", group: "Sidebar", defaultValue: "0 0% 98%", defaultHex: "#FAFAFA" },
  { key: "themeSidebarAccent", cssVar: "--sidebar-accent", label: "Sidebar Accent", group: "Sidebar", defaultValue: "240 4.8% 95.9%", defaultHex: "#F4F4F5" },
  { key: "themeSidebarAccentForeground", cssVar: "--sidebar-accent-foreground", label: "Sidebar Accent Foreground", group: "Sidebar", defaultValue: "240 5.9% 10%", defaultHex: "#18181B" },
  { key: "themeSidebarBorder", cssVar: "--sidebar-border", label: "Sidebar Border", group: "Sidebar", defaultValue: "220 13% 91%", defaultHex: "#E5E7EB" },
  { key: "themeSidebarRing", cssVar: "--sidebar-ring", label: "Sidebar Ring", group: "Sidebar", defaultValue: "217.2 91.2% 59.8%", defaultHex: "#3B82F6" },
]

export const THEME_GROUPS: ThemeTokenGroup[] = [
  "Surfaces",
  "Brand",
  "Secondary & Accent",
  "Muted",
  "Feedback",
  "Controls",
  "Announcement",
  "Sidebar",
]

export type ThemeColorKey = (typeof THEME_TOKENS)[number]["key"]

export type ThemeColors = Partial<Record<ThemeColorKey, string>>

/** Default hex palette, used as the baseline for diffing and reset. */
export const THEME_DEFAULT_HEX: ThemeColors = THEME_TOKENS.reduce((acc, token) => {
  acc[token.key as ThemeColorKey] = token.defaultHex
  return acc
}, {} as ThemeColors)

/** Normalises `#abc` / `abc` / `#AABBCC` to `#AABBCC`, or null when invalid. */
export function normalizeHex(value: string): string | null {
  const trimmed = value.trim().replace(/^#/, "")
  if (!/^[0-9a-fA-F]+$/.test(trimmed)) return null
  if (trimmed.length === 3) {
    return `#${trimmed
      .split("")
      .map((char) => char + char)
      .join("")}`.toUpperCase()
  }
  if (trimmed.length === 6) return `#${trimmed}`.toUpperCase()
  return null
}

/** True when the token holds a non-default value and must be published. */
export function isCustomized(token: ThemeToken, value: string | undefined): boolean {
  if (!value) return false
  const hex = normalizeHex(value)
  if (!hex) return true
  return hex !== token.defaultHex
}
