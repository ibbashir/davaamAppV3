import { BASE_URL } from "@/constants/Constant";
import { getRequest, postRequest, putRequest, deleteRequest, patchRequest } from "@/Apis/Api";
import { qs } from "@/components/hr/hr-api";
import type {
  Board, BoardColumn, Issue, IssueStatus, IssuePriority, IssueType, Sprint, TrackerProject,
  TrackerUser, TrackerResponse, SummaryData, BoardData, BacklogData,
  DevelopmentData, TimelineData,
} from "@/Types/tracker";

export const TRACKER = `${BASE_URL}/tracker`;

const get = <T>(path: string, params?: Record<string, unknown>) =>
  getRequest<TrackerResponse<T>>(`${TRACKER}${path}${qs(params)}`);

// ─── Tab views ───────────────────────────────────────────────────────────────
export const fetchSummary = (p?: Record<string, unknown>) => get<SummaryData>("/summary", p);
export const fetchBoard = (p?: Record<string, unknown>) => get<BoardData>("/board", p);
export const fetchBacklog = (p?: Record<string, unknown>) => get<BacklogData>("/backlog", p);
export const fetchDevelopment = (p?: Record<string, unknown>) => get<DevelopmentData>("/development", p);
export const fetchTimeline = (p?: Record<string, unknown>) => get<TimelineData>("/timeline", p);

// ─── Projects, sprints, users ────────────────────────────────────────────────
export const fetchProjects = () => get<TrackerProject[]>("/projects");
export const createProject = (body: object) =>
  postRequest<TrackerResponse<TrackerProject>>(`${TRACKER}/projects`, body);

// ─── Boards (saved views) ────────────────────────────────────────────────────
// ─── Columns (workflow states) ───────────────────────────────────────────────
export const fetchColumns = (p?: Record<string, unknown>) => get<BoardColumn[]>("/columns", p);
export const createColumn = (body: object) =>
  postRequest<TrackerResponse<BoardColumn>>(`${TRACKER}/columns`, body);
export const updateColumn = (id: number, body: object) =>
  putRequest<TrackerResponse<BoardColumn>>(`${TRACKER}/columns/${id}`, body);
export const reorderColumns = (order: number[], projectId?: number) =>
  putRequest<TrackerResponse<BoardColumn[]>>(`${TRACKER}/columns/reorder`, { order, project_id: projectId });
/** `moveTo` is required when the column still holds issues. */
export const deleteColumn = (id: number, moveTo?: number) =>
  deleteRequest<TrackerResponse<{ issue_count: number; options: Array<{ id: number; name: string }> }>>(
    `${TRACKER}/columns/${id}${moveTo ? `?move_to=${moveTo}` : ""}`,
  );

export const fetchBoards = (p?: Record<string, unknown>) => get<Board[]>("/boards", p);
export const createBoard = (body: object) =>
  postRequest<TrackerResponse<Board>>(`${TRACKER}/boards`, body);
export const updateBoard = (id: number, body: object) =>
  putRequest<TrackerResponse<Board>>(`${TRACKER}/boards/${id}`, body);
export const deleteBoard = (id: number) =>
  deleteRequest<TrackerResponse<null>>(`${TRACKER}/boards/${id}`);

export const fetchSprints = (p?: Record<string, unknown>) => get<Sprint[]>("/sprints", p);
export const createSprint = (body: object) =>
  postRequest<TrackerResponse<Sprint>>(`${TRACKER}/sprints`, body);
export const updateSprint = (id: number, body: object) =>
  putRequest<TrackerResponse<Sprint>>(`${TRACKER}/sprints/${id}`, body);
export const deleteSprint = (id: number) =>
  deleteRequest<TrackerResponse<null>>(`${TRACKER}/sprints/${id}`);

export const fetchUsers = () => get<TrackerUser[]>("/users");

// ─── Issues ──────────────────────────────────────────────────────────────────
export const fetchIssues = (p?: Record<string, unknown>) => get<Issue[]>("/issues", p);
export const fetchIssue = (id: number) => get<Issue>(`/issues/${id}`);
export const createIssue = (body: object) =>
  postRequest<TrackerResponse<Issue>>(`${TRACKER}/issues`, body);
export const updateIssue = (id: number, body: object) =>
  putRequest<TrackerResponse<Issue>>(`${TRACKER}/issues/${id}`, body);
export const deleteIssue = (id: number) =>
  deleteRequest<TrackerResponse<null>>(`${TRACKER}/issues/${id}`);
export const addComment = (id: number, body: string) =>
  postRequest<TrackerResponse<Comment>>(`${TRACKER}/issues/${id}/comments`, { body });

/** Column + slot move in one call — they always change together. */
export const moveIssue = (id: number, body: { status?: IssueStatus; position?: number; sprint_id?: number | null }) =>
  patchRequest<TrackerResponse<Issue>>(`${TRACKER}/issues/${id}/move`, body);

// ─── Display helpers ─────────────────────────────────────────────────────────

/** Fallback only — the real list comes from the project's columns. */
export const STATUSES: IssueStatus[] = ["todo", "in_progress", "in_review", "done"];
export const TYPES: IssueType[] = ["task", "bug", "story", "epic"];
export const PRIORITIES: IssuePriority[] = ["low", "medium", "high", "urgent"];

const FALLBACK_LABEL: Record<string, string> = {
  todo: "To Do", in_progress: "In Progress", in_review: "In Review", done: "Done",
};

/**
 * Human label for a status key. Columns carry their own names, so this is the
 * fallback for the screens that render a status without the column list to
 * hand — an unknown key is humanised rather than shown raw.
 */
export const STATUS_LABEL = new Proxy({} as Record<string, string>, {
  get: (_t, key: string) =>
    FALLBACK_LABEL[key] ?? String(key).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
});

/** Label from the project's columns when available, else the fallback. */
export const statusLabel = (key: string, columns: BoardColumn[] = []) =>
  columns.find((c) => c.key === key)?.name ?? STATUS_LABEL[key];

export const userName = (u?: { first_name?: string | null; last_name?: string | null; email?: string } | null) =>
  u ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email || "—" : "Unassigned";

/** Two letters for the assignee avatar chip. */
export const initials = (u?: { first_name?: string | null; last_name?: string | null; email?: string } | null) => {
  if (!u) return "?";
  const a = (u.first_name ?? "").trim();
  const b = (u.last_name ?? "").trim();
  if (a || b) return `${a.charAt(0)}${b.charAt(0)}`.toUpperCase() || "?";
  return (u.email ?? "?").charAt(0).toUpperCase();
};

export const TYPE_STYLE: Record<IssueType, { label: string; className: string }> = {
  task:  { label: "Task",  className: "bg-sky-100 text-sky-700 border-sky-200" },
  bug:   { label: "Bug",   className: "bg-red-100 text-red-700 border-red-200" },
  story: { label: "Story", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  epic:  { label: "Epic",  className: "bg-violet-100 text-violet-700 border-violet-200" },
};

export const PRIORITY_STYLE: Record<IssuePriority, { label: string; className: string }> = {
  low:    { label: "Low",    className: "bg-slate-100 text-slate-600 border-slate-200" },
  medium: { label: "Medium", className: "bg-blue-100 text-blue-700 border-blue-200" },
  high:   { label: "High",   className: "bg-amber-100 text-amber-700 border-amber-200" },
  urgent: { label: "Urgent", className: "bg-red-100 text-red-700 border-red-200" },
};

/** Badge classes per accent colour — the palette a column may choose from. */
export const COLOR_BADGE: Record<string, string> = {
  slate:   "bg-slate-100 text-slate-600 border-slate-200",
  blue:    "bg-blue-100 text-blue-700 border-blue-200",
  amber:   "bg-amber-100 text-amber-700 border-amber-200",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  violet:  "bg-violet-100 text-violet-700 border-violet-200",
  rose:    "bg-rose-100 text-rose-700 border-rose-200",
  teal:    "bg-teal-100 text-teal-700 border-teal-200",
  sky:     "bg-sky-100 text-sky-700 border-sky-200",
};

/** Top-border accent for a board column. */
export const COLOR_ACCENT: Record<string, string> = {
  slate: "border-t-slate-300", blue: "border-t-blue-400", amber: "border-t-amber-400",
  emerald: "border-t-emerald-400", violet: "border-t-violet-400", rose: "border-t-rose-400",
  teal: "border-t-teal-400", sky: "border-t-sky-400",
};

/** Solid fill, for timeline bars and proportion bars. */
export const COLOR_FILL: Record<string, string> = {
  slate: "bg-slate-400", blue: "bg-blue-500", amber: "bg-amber-500",
  emerald: "bg-emerald-500", violet: "bg-violet-500", rose: "bg-rose-500",
  teal: "bg-teal-500", sky: "bg-sky-500",
};

export const COLUMN_COLORS = Object.keys(COLOR_BADGE);

const FALLBACK_COLOR: Record<string, string> = {
  todo: "slate", in_progress: "blue", in_review: "amber", done: "emerald",
};

/** The accent a status should render in, taken from its column when known. */
export const statusColor = (key: string, columns: BoardColumn[] = []) =>
  columns.find((c) => c.key === key)?.color ?? FALLBACK_COLOR[key] ?? "slate";

export const STATUS_STYLE = new Proxy({} as Record<string, string>, {
  get: (_t, key: string) => COLOR_BADGE[FALLBACK_COLOR[key] ?? "slate"],
});

/** Overdue = has a due date in the past and isn't finished. */
export const isOverdue = (issue: { due_date: string | null; status: IssueStatus }) =>
  Boolean(issue.due_date) && issue.status !== "done" && new Date(issue.due_date as string) < new Date();

/** One-line description of what a board is showing, for the selector subtitle. */
export function boardFilterSummary(
  board: Pick<Board, "filter_sprint" | "filter_assignee" | "filter_type" | "filter_priority">,
  sprints: Sprint[] = [],
  users: TrackerUser[] = [],
): string {
  const bits: string[] = [];
  const s = board.filter_sprint;
  if (s === "backlog") bits.push("Backlog");
  else if (s === "active") bits.push("Active sprint");
  else if (/^\d+$/.test(s)) bits.push(sprints.find((x) => x.id === Number(s))?.name ?? `Sprint ${s}`);

  const a = board.filter_assignee;
  if (a === "me") bits.push("Assigned to me");
  else if (/^\d+$/.test(a)) bits.push(userName(users.find((u) => u.id === Number(a))));

  if (board.filter_type !== "all") bits.push(TYPE_STYLE[board.filter_type as IssueType]?.label ?? board.filter_type);
  if (board.filter_priority !== "all") {
    bits.push(`${PRIORITY_STYLE[board.filter_priority as IssuePriority]?.label ?? board.filter_priority} priority`);
  }
  return bits.length ? bits.join(" · ") : "All issues";
}
