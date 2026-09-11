import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { IconLoader2, IconSend, IconClockEdit } from "@tabler/icons-react"
import { essPost, errorMessage, todayISO } from "@/components/hr/hr-api"
import type { MissedPunchRequest } from "@/Types/hr"

/** How far back a forgotten punch can be claimed — matches the server's MAX_DAYS_BACK. */
const MAX_DAYS_BACK = 30

/** YYYY-MM-DD shifted by whole days, in pure calendar arithmetic (no timezone drift). */
const shiftISO = (iso: string, days: number) => {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/**
 * Where a request stands, in the employee's words.
 *
 * Both pending stages read as "In process" — the one thing the employee needs
 * to know is that it isn't done — with the desk it is sitting at, so they know
 * whom to chase.
 */
export function missedPunchProgress(row: MissedPunchRequest): { label: string; className: string } {
  const amber = "bg-amber-100 text-amber-700 border-amber-200"
  switch (row.status) {
    case "pending_hr":
      return { label: "In process · with HR", className: amber }
    case "pending_superadmin":
      return { label: "In process · awaiting final approval", className: amber }
    case "approved":
      return {
        label: "Approved · attendance marked",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      }
    case "rejected":
      return {
        label: row.rejected_stage === "superadmin" ? "Rejected by super admin" : "Rejected by HR",
        className: "bg-red-100 text-red-700 border-red-200",
      }
    default:
      return { label: "Withdrawn", className: "bg-slate-100 text-slate-600 border-slate-200" }
  }
}

/**
 * "I forgot to mark my attendance."
 *
 * Asks for a missed check-in, a missed check-out, or both, on a day up to 30
 * days back. Nothing is marked until HR and then the super admin both approve;
 * until then the request shows as in process on My Requests.
 */
export function MissedPunchButton({
  onDone,
  className,
}: {
  onDone?: () => void
  className?: string
}) {
  const today = todayISO()
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState(today)
  const [checkIn, setCheckIn] = React.useState("")
  const [checkOut, setCheckOut] = React.useState("")
  const [reason, setReason] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const reset = () => {
    setDate(todayISO())
    setCheckIn("")
    setCheckOut("")
    setReason("")
  }

  const submit = async () => {
    if (!checkIn && !checkOut) {
      toast.error("Say which you forgot — the check-in, the check-out, or both")
      return
    }
    if (checkIn && checkOut && checkOut <= checkIn) {
      toast.error("The check-out has to be after the check-in")
      return
    }
    if (reason.trim().length < 5) {
      toast.error("Tell HR why the punch was missed — a few words is enough")
      return
    }
    setSaving(true)
    try {
      const res = await essPost<{ message: string }>("/attendance/missed-punch-requests", {
        date,
        check_in: checkIn || undefined,
        check_out: checkOut || undefined,
        reason: reason.trim(),
      })
      toast.success(res.message)
      setOpen(false)
      reset()
      onDone?.()
    } catch (err) {
      toast.error(errorMessage(err, "Could not send your request"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={className}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <IconClockEdit className="h-4 w-4" />
        Forgot to mark attendance?
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request missed attendance</DialogTitle>
            <DialogDescription>
              For a check-in or check-out you forgot to mark. HR reviews it first, then the super
              admin gives the final approval — your attendance is marked only once both have
              approved. Until then it shows as in process on My Requests.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="missed-date">Day</Label>
              <Input
                id="missed-date"
                type="date"
                value={date}
                min={shiftISO(today, -MAX_DAYS_BACK)}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="missed-in">Check-in time</Label>
                <Input
                  id="missed-in"
                  type="time"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="missed-out">Check-out time</Label>
                <Input
                  id="missed-out"
                  type="time"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">
              Fill in only what you missed. Pakistan time. If that day already has a punch, it
              stays as it is — this can't replace a punch, only add a missing one.
            </p>

            <div>
              <Label htmlFor="missed-reason">Why was it missed?</Label>
              <Textarea
                id="missed-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="mt-1.5"
                placeholder="e.g. Came in at 9:20 but my phone was dead, so I couldn't check in."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
              {saving ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconSend className="h-4 w-4" />}
              Send to HR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
