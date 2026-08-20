import * as React from "react"
import { ResourceScreen, type Field, type RowAction } from "@/components/hr/ResourceScreen"
import { useHrOptions, enumOptions } from "@/components/hr/useHrOptions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { IconMessage } from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  hrAction,
  errorMessage,
  statusClass,
  humanise,
  formatDateTime,
} from "@/components/hr/hr-api"
import type { HrRow } from "@/Types/hr"

const CATEGORIES = [
  "payroll",
  "leave",
  "attendance",
  "it",
  "facilities",
  "policy",
  "grievance",
  "other",
]
const STATUSES = ["open", "in_progress", "on_hold", "resolved", "closed"]
const PRIORITIES = ["low", "medium", "high", "urgent"]

interface Comment {
  id: number
  body: string
  author_name: string | null
  is_internal: boolean
  created_at: string
}

const Helpdesk = () => {
  const { options } = useHrOptions(["employees"])
  const [refresh, setRefresh] = React.useState(0)
  const [active, setActive] = React.useState<HrRow | null>(null)
  const [comment, setComment] = React.useState("")
  const [posting, setPosting] = React.useState(false)

  const postComment = async () => {
    if (!active || !comment.trim()) return
    setPosting(true)
    try {
      await hrAction(`/tickets/${active.id}/comments`, { body: comment.trim() })
      toast.success("Comment added")
      setComment("")
      setActive(null)
      setRefresh((r) => r + 1)
    } catch (err) {
      toast.error(errorMessage(err, "Could not add the comment"))
    } finally {
      setPosting(false)
    }
  }

  const fields: Field[] = [
    { name: "ticket_code", label: "Ticket", hideInForm: true },
    {
      name: "employee_id",
      label: "Raised By",
      type: "select",
      optionsKey: "employees",
      required: true,
      render: (row: HrRow) => {
        const e = row.employee as { first_name?: string; last_name?: string } | undefined
        return `${e?.first_name ?? ""} ${e?.last_name ?? ""}`.trim() || "—"
      },
    },
    { name: "subject", label: "Subject", required: true, wide: true },
    { name: "category", label: "Category", type: "select", options: enumOptions(CATEGORIES), defaultValue: "other" },
    {
      name: "priority",
      label: "Priority",
      type: "select",
      options: enumOptions(PRIORITIES),
      defaultValue: "medium",
      render: (row: HrRow) => (
        <Badge variant="outline" className={cn("font-medium", statusClass(row.priority))}>
          {humanise(row.priority)}
        </Badge>
      ),
    },
    { name: "status", label: "Status", type: "select", options: enumOptions(STATUSES), defaultValue: "open" },
    {
      name: "assigned_to",
      label: "Assigned To",
      type: "select",
      optionsKey: "employees",
      hideInTable: true,
    },
    {
      name: "comments",
      label: "Replies",
      hideInForm: true,
      render: (row: HrRow) => {
        const list = (row.comments as Comment[]) ?? []
        return list.length ? String(list.length) : "—"
      },
    },
    { name: "description", label: "Description", type: "textarea", hideInTable: true },
    { name: "resolution", label: "Resolution", type: "textarea", hideInTable: true },
  ]

  const actions: RowAction[] = [
    {
      label: "Reply",
      icon: IconMessage,
      onClick: (row) => {
        setActive(row)
        setComment("")
      },
    },
  ]

  const activeComments = ((active?.comments as Comment[]) ?? []).slice().reverse()

  return (
    <>
      <ResourceScreen
        title="HR Help Desk"
        singular="Ticket"
        endpoint="/tickets"
        description="Employees raise tickets from Self Service. Setting a ticket to Resolved or Closed stamps the resolution time."
        fields={fields}
        optionSources={options}
        rowActions={actions}
        refreshToken={refresh}
        filters={[
          { name: "status", label: "Status", options: enumOptions(STATUSES) },
          { name: "priority", label: "Priority", options: enumOptions(PRIORITIES) },
          { name: "category", label: "Categories", options: enumOptions(CATEGORIES) },
        ]}
        searchPlaceholder="Search tickets…"
      />

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{String(active?.subject ?? "Ticket")}</DialogTitle>
            <DialogDescription>
              {active?.ticket_code ? `${active.ticket_code} · ` : ""}
              {humanise(active?.status)}
            </DialogDescription>
          </DialogHeader>

          {active?.description ? (
            <p className="rounded-md bg-muted p-3 text-sm">{String(active.description)}</p>
          ) : null}

          {activeComments.length > 0 && (
            <div className="max-h-56 space-y-2 overflow-y-auto">
              {activeComments.map((c) => (
                <div key={c.id} className="rounded-md border p-2.5 text-sm">
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{c.author_name ?? "HR"}</span>
                    <span>{formatDateTime(c.created_at)}</span>
                  </div>
                  <p className="mt-1">{c.body}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="ticket-reply">Add a reply</Label>
            <Textarea
              id="ticket-reply"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Type your response…"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>
              Close
            </Button>
            <Button
              onClick={postComment}
              disabled={posting || !comment.trim()}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Post reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default Helpdesk
