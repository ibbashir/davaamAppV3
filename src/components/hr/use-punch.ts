import * as React from "react"
import { toast } from "sonner"
import { essPost, errorMessage } from "@/components/hr/hr-api"

/**
 * Check-in / check-out is geofenced for every employee, whatever their role:
 * the punch only lands if the browser reports a position inside one of the
 * approved sites. The server owns that decision — everything here just collects
 * the coordinates and turns a refusal into a message worth reading.
 */
export interface GeofenceSite {
  id: string
  label: string
  lat: number
  lng: number
  radius_m: number
}

export interface Geofence {
  enabled: boolean
  sites: GeofenceSite[]
}

interface Fix {
  lat: number
  lng: number
  accuracy: number
}

/** Turns a GeolocationPositionError into something a user can act on. */
function reason(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Location access is blocked. Allow location for this site in your browser, then try again — check-in and check-out only work at the office."
    case err.POSITION_UNAVAILABLE:
      return "Your device could not work out where it is. Turn on location services and try again."
    case err.TIMEOUT:
      return "Timed out while getting your location. Move somewhere with a better signal and try again."
    default:
      return "Could not read your location, so your punch could not be verified."
  }
}

/** Promise wrapper over the callback-style geolocation API. */
function currentPosition(): Promise<Fix> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("This browser cannot share your location, so check-in cannot be verified."))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => reject(new Error(reason(err))),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  })
}

/**
 * Shared by My Hub and My Attendance so both punch buttons behave identically.
 *
 * A failed location read is now fatal to the punch: no role may check in or out
 * without coordinates, so there is nothing to gain by posting one that the
 * server is certain to refuse. The geolocation error is reported as-is, since
 * "location is blocked" is far more actionable than the server's generic
 * "location is required".
 */
export function usePunch(onDone: () => void) {
  const [punching, setPunching] = React.useState(false)

  const punch = React.useCallback(
    async (type: "in" | "out") => {
      setPunching(true)

      let fix: Fix
      try {
        fix = await currentPosition()
      } catch (err) {
        // Stop here rather than spending a round-trip to be told the same thing
        // in vaguer words.
        toast.error((err as Error).message)
        setPunching(false)
        return
      }

      try {
        const res = await essPost<{ message: string }>("/attendance/punch", {
          type,
          lat: fix.lat,
          lng: fix.lng,
          accuracy: fix.accuracy,
        })
        toast.success(res.message)
        onDone()
      } catch (err) {
        // A 403 here means the fix was good but the place was wrong — the
        // server's message names the nearest site and the distance to it.
        toast.error(errorMessage(err, "Could not record your punch"))
      } finally {
        setPunching(false)
      }
    },
    [onDone],
  )

  return { punch, punching }
}
