import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  TYPE_STYLE, PRIORITY_STYLE, STATUS_STYLE, STATUS_LABEL, initials, userName, isOverdue,
} from "./tracker-api"
import type { Issue, IssueStatus, IssuePriority, IssueType, TrackerUser } from "@/Types/tracker"

export const TypeBadge = ({ type }: { type: IssueType }) => (
  <Badge variant="outline" className={cn("font-medium", TYPE_STYLE[type].className)}>
    {TYPE_STYLE[type].label}
  </Badge>
)

export const PriorityBadge = ({ priority }: { priority: IssuePriority }) => (
  <Badge variant="outline" className={cn("font-medium", PRIORITY_STYLE[priority].className)}>
    {PRIORITY_STYLE[priority].label}
  </Badge>
)

export const StatusBadge = ({ status }: { status: IssueStatus }) => (
  <Badge variant="outline" className={cn("font-medium", STATUS_STYLE[status])}>
    {STATUS_LABEL[status]}
  </Badge>
)

/** Initials chip. `title` carries the full name, so the chip needs no label. */
export const Avatar = ({ user }: { user?: TrackerUser | null }) => (
  <span
    title={userName(user)}
    className={cn(
      "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
      user ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-400",
    )}
  >
    {initials(user)}
  </span>
)

/** The issue key, styled as the identifier people quote in chat. */
export const IssueKey = ({ issue }: { issue: Pick<Issue, "issue_key"> }) => (
  <span className="font-mono text-xs font-semibold text-muted-foreground">{issue.issue_key}</span>
)

export const DueDate = ({ issue }: { issue: Pick<Issue, "due_date" | "status"> }) => {
  if (!issue.due_date) return null
  const overdue = isOverdue(issue as Issue)
  return (
    <span className={cn("text-xs", overdue ? "font-medium text-red-600" : "text-muted-foreground")}>
      {new Date(issue.due_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
      {overdue && " · overdue"}
    </span>
  )
}

export const Points = ({ points }: { points: number | null }) =>
  points === null || points === undefined ? null : (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-600">
      {points}
    </span>
  )

export const Empty = ({ message }: { message: string }) => (
  <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
    {message}
  </div>
)
