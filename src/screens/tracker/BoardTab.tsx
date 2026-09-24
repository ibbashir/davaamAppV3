import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconLoader2, IconPlus, IconPencil, IconLayoutColumns, IconColumns3 } from "@tabler/icons-react"
import { toast } from "sonner"
import { errorMessage } from "@/components/hr/hr-api"
import {
  fetchBoard, moveIssue, userName, boardFilterSummary, COLOR_ACCENT, isTrackerManager,
} from "@/components/tracker/tracker-api"
import { useAuth } from "@/contexts/AuthContext"
import { TypeBadge, PriorityBadge, IssueKey, DueDate, Points, AssigneeStack } from "@/components/tracker/IssueBits"
import { IssueDialog } from "@/components/tracker/IssueDialog"
import { BoardDialog } from "@/components/tracker/BoardDialog"
import { ColumnDialog } from "@/components/tracker/ColumnDialog"
import { cn } from "@/lib/utils"
import type { Board, BoardData, BoardColumn, Issue, IssueStatus, Sprint, TrackerUser } from "@/Types/tracker"

function IssueCard({ issue, onOpen, onDragStart }: {
  issue: Issue
  onOpen: () => void
  onDragStart: (e: React.DragEvent) => void
}) {
  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      className="cursor-pointer gap-0 space-y-2 p-3 transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <p className="text-sm font-medium leading-snug">{issue.title}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <TypeBadge type={issue.type} />
        <PriorityBadge priority={issue.priority} />
      </div>
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-2">
          <IssueKey issue={issue} />
          <Points points={issue.story_points} />
        </div>
        <div className="flex items-center gap-2">
          <DueDate issue={issue} />
          <AssigneeStack issue={issue} />
        </div>
      </div>
    </Card>
  )
}

export default function BoardTab({
  projectId, sprints, users, refreshKey, onChanged,
}: {
  projectId?: number
  sprints: Sprint[]
  users: TrackerUser[]
  refreshKey: number
  onChanged: () => void
}) {
  const [data, setData] = React.useState<BoardData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [sprintFilter, setSprintFilter] = React.useState("all")
  const [assigneeFilter, setAssigneeFilter] = React.useState("all")
  // Creating tasks is limited to the project leads; the API enforces it too.
  const { state } = useAuth()
  const canCreate = isTrackerManager(state?.user?.email)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Issue | null>(null)
  const [createIn, setCreateIn] = React.useState<IssueStatus>("todo")
  const [columnDialog, setColumnDialog] = React.useState(false)
  const [dragOver, setDragOver] = React.useState<IssueStatus | null>(null)
  const [boardId, setBoardId] = React.useState<number | undefined>()
  const [boardDialog, setBoardDialog] = React.useState(false)
  const [editingBoard, setEditingBoard] = React.useState<Board | null>(null)
  const dragged = React.useRef<Issue | null>(null)

  const load = React.useCallback(() => {
    setLoading(true)
    fetchBoard({
      project_id: projectId, board_id: boardId,
      sprint_id: sprintFilter, assignee_id: assigneeFilter,
    })
      .then((r) => {
        setData(r.data)
        // The server picks the default board when none was named; adopt its
        // choice so the selector and the data on screen never disagree.
        if (!boardId && r.data.board) setBoardId(r.data.board.id)
      })
      .catch((err) => toast.error(errorMessage(err, "Could not load the board")))
      .finally(() => setLoading(false))
  }, [projectId, boardId, sprintFilter, assigneeFilter])

  React.useEffect(() => { load() }, [load, refreshKey])

  /**
   * Optimistic move: the card jumps columns immediately, then the request goes
   * out. A board that waits on the network before redrawing feels broken.
   */
  const drop = async (status: IssueStatus) => {
    const issue = dragged.current
    dragged.current = null
    setDragOver(null)
    if (!issue || issue.status === status) return

    setData((prev) => prev && {
      ...prev,
      columns: prev.columns.map((c) => ({
        ...c,
        issues: c.status === status
          ? [{ ...issue, status }, ...c.issues.filter((i) => i.id !== issue.id)]
          : c.issues.filter((i) => i.id !== issue.id),
      })),
    })

    try {
      await moveIssue(issue.id, { status })
      onChanged()
    } catch (err) {
      toast.error(errorMessage(err, "Could not move the issue"))
      load()
    }
  }

  if (loading && !data) {
    return <div className="flex h-56 items-center justify-center"><IconLoader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {(data?.boards?.length ?? 0) > 0 && (
          <Select value={boardId ? String(boardId) : ""} onValueChange={(v) => setBoardId(Number(v))}>
            <SelectTrigger className="w-60" data-tour="board-selector">
              <IconLayoutColumns className="mr-1.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Board" />
            </SelectTrigger>
            <SelectContent>
              {data?.boards.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.name}
                  {b.is_default ? " (default)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {data?.board && (
          <Button
            variant="ghost" size="sm"
            onClick={() => { setEditingBoard(data.board); setBoardDialog(true) }}
            title="Edit or delete this board"
          >
            <IconPencil className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="outline" size="sm"
          onClick={() => { setEditingBoard(null); setBoardDialog(true) }}
        >
          <IconPlus className="mr-1 h-4 w-4" /> New board
        </Button>
        <Button
          variant="outline" size="sm"
          data-tour="columns-button"
          onClick={() => setColumnDialog(true)}
        >
          <IconColumns3 className="mr-1 h-4 w-4" /> Columns
        </Button>

        <span className="mx-1 hidden h-5 w-px bg-border sm:block" />

        <Select value={sprintFilter} onValueChange={setSprintFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Sprint" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All work</SelectItem>
            <SelectItem value="backlog">Backlog only</SelectItem>
            {sprints.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Assignee" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everyone</SelectItem>
            {users.map((u) => <SelectItem key={u.id} value={String(u.id)}>{userName(u)}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="ml-auto text-sm text-muted-foreground">{data?.total ?? 0} issue(s)</span>
      </div>

      {data?.board && (
        <p className="-mt-2 text-xs text-muted-foreground">
          <span className="font-medium">{data.board.name}</span>
          {" · "}
          {boardFilterSummary(data.board, sprints, users)}
          {data.board.description ? ` · ${data.board.description}` : ""}
          {(sprintFilter !== "all" || assigneeFilter !== "all") && (
            <span className="text-amber-600"> · quick filter active, narrowing this board</span>
          )}
        </p>
      )}

      {/* Columns are user-defined and unbounded, so the board scrolls sideways
          rather than reflowing — a fixed grid would squeeze 8 columns into
          unreadable slivers. Each column keeps a stable width. */}
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-3">
        {(data?.columns ?? []).map((col) => {
          const over = col.wip_limit ? col.issues.length > col.wip_limit : false
          return (
            <div
              key={col.id ?? col.status}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.status) }}
              onDragLeave={() => setDragOver((s) => (s === col.status ? null : s))}
              onDrop={(e) => { e.preventDefault(); drop(col.status) }}
              className={cn(
                "flex w-[280px] shrink-0 flex-col rounded-xl border-t-4 bg-muted/40 p-2.5 transition-colors",
                COLOR_ACCENT[col.color] ?? "border-t-slate-300",
                dragOver === col.status && "bg-teal-50 ring-2 ring-teal-300",
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <h3 className="truncate text-sm font-semibold">{col.name ?? col.status}</h3>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    over ? "bg-red-100 text-red-700" : "bg-background text-muted-foreground",
                  )}
                  title={col.wip_limit ? `WIP limit ${col.wip_limit}` : undefined}
                >
                  {col.issues.length}{col.wip_limit ? ` / ${col.wip_limit}` : ""}
                </span>
              </div>

              <div className="flex min-h-[80px] flex-col gap-2">
                {col.issues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    onOpen={() => { setEditing(issue); setDialogOpen(true) }}
                    onDragStart={() => { dragged.current = issue }}
                  />
                ))}
              </div>

              {canCreate && (
                <Button
                  variant="ghost" size="sm"
                  className="mt-2 w-full justify-start text-muted-foreground"
                  onClick={() => { setEditing(null); setCreateIn(col.status); setDialogOpen(true) }}
                >
                  <IconPlus className="mr-1 h-4 w-4" /> Add issue
                </Button>
              )}
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => setColumnDialog(true)}
          className="flex h-[120px] w-[180px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-sm text-muted-foreground transition-colors hover:border-teal-300 hover:text-teal-600"
        >
          <IconPlus className="h-5 w-5" />
          Add column
        </button>
      </div>

      {(data?.orphans ?? 0) > 0 && (
        <p className="text-xs text-amber-600">
          {data?.orphans} issue(s) sit in a column that no longer exists and are shown in the first
          column. Move them, or recreate the column, to file them properly.
        </p>
      )}

      <IssueDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        issue={editing}
        projectId={projectId}
        sprints={sprints}
        users={users}
        defaults={{
          status: createIn,
          sprint_id: sprintFilter !== "all" && sprintFilter !== "backlog" ? sprintFilter : "backlog",
        }}
        onSaved={() => { load(); onChanged() }}
      />

      <BoardDialog
        open={boardDialog}
        onOpenChange={setBoardDialog}
        board={editingBoard}
        projectId={projectId}
        sprints={sprints}
        users={users}
        onSaved={(b) => { setBoardId(b.id); load(); onChanged() }}
        onDeleted={() => { setBoardId(undefined); load(); onChanged() }}
      />

      <ColumnDialog
        open={columnDialog}
        onOpenChange={setColumnDialog}
        columns={(data?.columns ?? []) as BoardColumn[]}
        projectId={projectId}
        onChanged={() => { load(); onChanged() }}
      />
    </div>
  )
}
