/**
 * Device identity for attendance integrity.
 *
 * Sent with every punch so HR can see when one machine clocks in two different
 * people — the pattern that gives away shared credentials. None of it is
 * treated as proof of identity, and nothing here is secret: a determined person
 * can edit any of it. It raises the effort and leaves a trail, which is what
 * makes casual sharing visible.
 *
 * Nothing personal is collected — no contacts, no files, no browsing history.
 * Only the coarse traits a web server already sees in every request, plus a
 * random id this app generated for itself.
 */

const DEVICE_KEY = "davaam.device.id"

export interface DeviceInfo {
  device_id: string
  platform: string
  screen: string
  color_depth: number | null
  pixel_ratio: number | null
  timezone: string
  language: string
  hardware_concurrency: number | null
  device_memory: number | null
}

/**
 * A random id, minted once per browser profile and kept in localStorage.
 *
 * Deliberately random rather than derived from hardware: a fleet of identical
 * company laptops produces identical hardware traits, so a derived id would
 * make every employee look like they shared one machine. The cost is that
 * clearing site data or opening a private window mints a new id — which is why
 * the server treats an unseen id as "worth a look", never as proof of anything.
 */
function deviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_KEY)
    if (existing) return existing

    const minted =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`

    localStorage.setItem(DEVICE_KEY, minted)
    return minted
  } catch {
    // Private mode and locked-down browsers can refuse storage outright. An
    // empty id is honest — the server records "no device info" and scores it
    // as unverified rather than silently trusting the punch.
    return ""
  }
}

/** Collects the traits that stay stable across sessions on one machine. */
export function collectDeviceInfo(): DeviceInfo {
  const nav = navigator as Navigator & {
    deviceMemory?: number
    userAgentData?: { platform?: string }
  }

  return {
    device_id: deviceId(),
    // userAgentData is the non-deprecated source where Chromium offers it.
    platform: nav.userAgentData?.platform ?? nav.platform ?? "",
    screen: typeof screen !== "undefined" ? `${screen.width}x${screen.height}` : "",
    color_depth: typeof screen !== "undefined" ? screen.colorDepth : null,
    // Rounded: a zoomed window reports a fractional ratio, and the raw value
    // would make one machine look like a different one after a Ctrl+scroll.
    pixel_ratio: typeof window !== "undefined" ? Math.round(window.devicePixelRatio) : null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
    language: navigator.language ?? "",
    hardware_concurrency: nav.hardwareConcurrency ?? null,
    device_memory: nav.deviceMemory ?? null,
  }
}
