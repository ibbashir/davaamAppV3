import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatTile } from "@/components/hr/HrPage"
import { IconLoader2, IconGitBranch, IconGitPullRequest, IconAlertTriangle } from "@tabler/icons-react"
import { toast } from "sonner"
import { errorMessage } from "@/components/hr/hr-api"
import { fetchDevelopment, userName } from "@/components/tracker/tracker-api"
import {
  TypeBadge, StatusBadge, PriorityBadge, Avatar, IssueKey, Empty,
} from "@/components/tracker/IssueBits"
import { IssueDialog } from "@/components/tracker/IssueDialog"
import type { DevelopmentData, Issue, Sprint, TrackerUser } from "@/Types/tracker"

/** A PR link is only rendered as a link when it actually is one. */
const isUrl = (v: string) => /^https?:\/\//i.test(v)

function DevRow({ issue, onOpen }: { issue: Issue; onOpen: () => void }) {
  return (
    <div className="flex flex-wrap items-start gap-2 border-b px-3 py-2.5 last:border-0 hover:bg-muted/50">
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-1.5">
          <IssueKey issue={issue} />
          <TypeBadge type={issue.type} />
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
        </div>
        <p className="mt-1 truncate text-sm">{issue.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          {issue.branch && (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
              <IconGitBranch className="h-3.5 w-3.5" />
              {issue.branch}
            </span>
          )}
          {issue.pull_request && (
            isUrl(issue.pull_request) ? (
              <a
                href={issue.pull_request}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[11px] text-teal-600 underline-offset-2 hover:underline"
              >
                <IconGitPullRequest className="h-3.5 w-3.5" />
                View pull request
              </a>
            ) : (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                <IconGitPullRequest className="h-3.5 w-3.5" />
                {issue.pull_request}
              </span>
            )
          )}
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden text-xs text-muted-foreground sm:inline">{userName(issue.assignee)}</span>
        <Avatar user={issue.assignee} />
      </div>
    </div>
  )
}

export default function DevelopmentTab({
  projectId, sprints, users, refreshKey, onChanged,
}: {
  projectId?: number; sprints: Sprint[]; users: TrackerUser[]; refreshKey: number; onChanged: () => void
}) {
  const [data, setData] = React.useState<DevelopmentData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Issue | null>(null)

  const load = React.useCallback(() => {
    setLoading(true)
    fetchDevelopment({ project_id: projectId })
      .then((r) => setData(r.data))
      .catch((err) => toast.error(errorMessage(err, "Could not load development")))
      .finally(() => setLoading(false))
  }, [projectId])

  React.useEffect(() => { load() }, [load, refreshKey])

  if (loading && !data) {
    return <div className="flex h-56 items-center justify-center"><IconLoader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
  }

  const openIssue = (i: Issue) => { setEditing(i); setOpen(true) }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="With code" value={data?.linked.length ?? 0} icon={IconGitBranch} tone="teal" />
        <StatTile label="No code linked" value={data?.unlinked ?? 0} tone="default" />
        <StatTile
          label="In flight, no branch"
          value={data?.missing.length ?? 0}
          icon={IconAlertTriangle}
          tone={data?.missing.length ? "amber" : "default"}
        />
        <StatTile label="Total issues" value={data?.total ?? 0} />
      </div>

      {data?.missing.length ? (
        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <IconAlertTriangle className="h-4 w-4 text-amber-500" />
              In progress with nothing linked
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              These are being worked on but carry no branch or pull request, so there's no way to see the code.
            </p>
          </CardHeader>
          <CardContent className="px-0 pb-1">
            {data.missing.map((i) => <DevRow key={i.id} issue={i} onOpen={() => openIssue(i)} />)}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Linked work</CardTitle>
          <p className="text-xs text-muted-foreground">Issues carrying a branch or a pull request.</p>
        </CardHeader>
        <CardContent className="px-0 pb-1">
          {!data?.linked.length ? (
            <div className="px-6">
              <Empty message="No issue has a branch or pull request yet. Add one from the issue dialog." />
            </div>
          ) : (
            data.linked.map((i) => <DevRow key={i.id} issue={i} onOpen={() => openIssue(i)} />)
          )}
        </CardContent>
      </Card>

      <IssueDialog
        open={open} onOpenChange={setOpen} issue={editing}
        projectId={projectId} sprints={sprints} users={users}
        onSaved={() => { load(); onChanged() }}
      />
    </div>
  )
}
