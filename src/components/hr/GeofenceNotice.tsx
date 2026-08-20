import { IconMapPin } from "@tabler/icons-react"
import type { Geofence } from "@/components/hr/use-punch"

/**
 * Explains the rule before the user hits a refusal. Renders nothing when the
 * caller's role isn't fenced. With more than one approved site the list is
 * spelled out, so staff know which places will work rather than discovering it
 * by being turned away.
 */
export function GeofenceNotice({ geofence }: { geofence?: Geofence | null }) {
  const sites = geofence?.sites ?? []
  if (!geofence?.enabled || sites.length === 0) return null

  return (
    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
      <IconMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
      {sites.length === 1 ? (
        <span>
          Check in and check out are only allowed at {sites[0].label} (within {sites[0].radius_m}m).
          Your browser will ask for location each time.
        </span>
      ) : (
        <div>
          <p>Check in and check out are only allowed at these locations:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-left">
            {sites.map((site) => (
              <li key={site.id}>
                {site.label} <span className="text-muted-foreground/70">(within {site.radius_m}m)</span>
              </li>
            ))}
          </ul>
          <p className="mt-1">Your browser will ask for location each time.</p>
        </div>
      )}
    </div>
  )
}
