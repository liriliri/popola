/** Chat sidebar width (px). */
export const SIDEBAR_WIDTH_DEFAULT = 260
export const SIDEBAR_WIDTH_MIN = 200
export const SIDEBAR_WIDTH_MAX = 420

const WIDTH_KEY = "popola.sidebarWidth"
const COLLAPSED_KEY = "popola.sidebarCollapsed"
const SIDEBAR_WIDTH_VAR = "--app-sidebar-width"

export function clampSidebarWidth(width: number): number {
  return Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, Math.round(width)))
}

export function readSidebarWidth(): number {
  try {
    const raw = localStorage.getItem(WIDTH_KEY)
    if (raw == null) return SIDEBAR_WIDTH_DEFAULT
    const value = Number(raw)
    return Number.isFinite(value) ? clampSidebarWidth(value) : SIDEBAR_WIDTH_DEFAULT
  } catch {
    return SIDEBAR_WIDTH_DEFAULT
  }
}

export function writeSidebarWidth(width: number): void {
  try {
    localStorage.setItem(WIDTH_KEY, String(clampSidebarWidth(width)))
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function applySidebarWidth(width: number): void {
  document.documentElement.style.setProperty(SIDEBAR_WIDTH_VAR, `${clampSidebarWidth(width)}px`)
}

export function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1"
  } catch {
    return false
  }
}

export function writeSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0")
  } catch {
    // Ignore quota / private-mode failures.
  }
}
