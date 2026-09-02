import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { IconLoader2, IconMapPin, IconSend, IconClockPause } from "@tabler/icons-react"
import { essPost, errorMessage, formatTime } from "@/components/hr/hr-api"
import { currentPosition, type Fix } from "@/components/hr/use-punch"
import type { CheckoutRequest } from "@/Types/hr"

/**
 * "I'm out on company work and I can't check out."
 *
 * The geofence refuses a punch away from the office, and that stays true — this
 * does not punch anybody out. It sends HR the employee's coordinates and their
 * reason, and HR decides. Anything else would make the fence optional, which is
 * the same as not having one.
 *
 * The location is read here, in the same breath as the request, so what HR
 * approves is where the employee was when they asked rather than wherever their
 * phone happens to be when the request is finally opened.
 */
export function RemoteCheckoutButton({
  pending,
  onDone,
  className,
}: {
  /** Today's request, when one is already waiting on HR. */
  pending?: CheckoutRequest | null
  onDone: () => void
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [reason, setReason] = React.useState("")
  const [fix, setFix] = React.useState<Fix | null>(null)
  const [locating, setLocating] = React.useState(false)
  const [locationError, setLocationError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  const readLocation = React.useCallback(async () => {
    setLocating(true)
    setLocationError(null)
    try {
      setFix(await currentPosition())
    } catch (err) {
      setFix(null)
      setLocationError((err as Error).message)
    } finally {
      setLocating(false)
    }
  }, [])

  // Asked for as the dialog opens: the fix takes a few seconds, and starting it
  // while the reason is being typed means it is usually ready by "Send".
  React.useEffect(() => {
    if (open) readLocation()
  }, [open, readLocation])

  const submit = async () => {
    if (reason.trim().length < 5) {
      toast.error("Tell HR where you are and why — a few words is enough")
      return
    }
    if (!fix) {
      toast.error(locationError ?? "Your location hasn't been read yet")
      return
    }
    setSaving(true)
    try {
      const res = await essPost<{ message: string }>("/attendance/checkout-requests", {
        reason: reason.trim(),
        lat: fix.lat,
        lng: fix.lng,
        accuracy: fix.accuracy,
      })
      toast.success(res.message)
      setOpen(false)
      setReason("")
      onDone()
    } catch (err) {
      toast.error(errorMessage(err, "Could not send your request"))
    } finally {
      setSaving(false)
    }
  }

  const cancel = async () => {
    if (!pending) return
    setSaving(true)
    try {
      await essPost(`/attendance/checkout-requests/${pending.id}/cancel`)
      toast.success("Request withdrawn")
      onDone()
    } catch (err) {
      toast.error(errorMessage(err, "Could not withdraw the request"))
    } finally {
      setSaving(false)
    }
  }

  // Waiting on HR: the button would only produce a second identical request, so
  // it is replaced by where the first one stands.
  if (pending) {
    return (
      <div className={className}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1.5 border-amber-200 bg-amber-100 font-medium text-amber-700"
          >
            <IconClockPause className="h-3.5 w-3.5" />
            Check-out with HR — asked at {formatTime(pending.requested_at)}
          </Badge>
          <Button variant="ghost" size="sm" onClick={cancel} disabled={saving}>
            Withdraw
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <IconMapPin className="h-4 w-4" />
        Can't check out? Ask HR
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ask HR to check you out</DialogTitle>
            <DialogDescription>
              For when you finish the day away from the office — a client visit, a site job, a
              delivery. HR sees where you are and decides. You are checked out at the time you
              send this, not when they read it.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm font-medium" htmlFor="remote-checkout-reason">
                Where are you, and why can't you check out at the office?
              </label>
              <Textarea
                id="remote-checkout-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="mt-1.5"
                placeholder="e.g. At the client's office in Clifton since 2pm — heading home from here."
              />
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              {locating ? (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  Reading your location…
                </span>
              ) : fix ? (
                <div className="flex items-start gap-2">
                  <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                  <div>
                    <p className="font-medium">Location attached</p>
                    <p className="text-xs text-muted-foreground">
                      {fix.lat.toFixed(5)}, {fix.lng.toFixed(5)} · accurate to about{" "}
                      {Math.round(fix.accuracy)}m. HR sees this on a map.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <p className="text-amber-700">
                    {locationError ?? "Your location hasn't been read yet."}
                  </p>
                  <Button variant="outline" size="sm" onClick={readLocation}>
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={saving || locating || !fix}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {saving ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                <IconSend className="h-4 w-4" />
              )}
              Send to HR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
