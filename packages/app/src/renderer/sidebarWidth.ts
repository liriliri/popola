/** Chat sidebar width (px). Matches paseo's usable range, scaled to popola's denser rail. */
export const SIDEBAR_WIDTH_DEFAULT = 260
export const SIDEBAR_WIDTH_MIN = 200
export const SIDEBAR_WIDTH_MAX = 420

const STORAGE_KEY = "popola.sidebarWidth"
const SIDEBAR_WIDTH_VAR = "--app-sidebar-width"

export function clampSidebarWidth(width: number): number {
  return Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, Math.round(width)))
}

export function readSidebarWidth(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw == null) return SIDEBAR_WIDTH_DEFAULT
    const value = Number(raw)
    return Number.isFinite(value) ? clampSidebarWidth(value) : SIDEBAR_WIDTH_DEFAULT
  } catch {
    return SIDEBAR_WIDTH_DEFAULT
  }
}

export function writeSidebarWidth(width: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(clampSidebarWidth(width)))
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function applySidebarWidth(width: number): void {
  document.documentElement.style.setProperty(SIDEBAR_WIDTH_VAR, `${clampSidebarWidth(width)}px`)
}
