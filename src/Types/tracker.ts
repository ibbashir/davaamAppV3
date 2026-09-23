export type IssueType = "task" | "bug" | "story" | "epic";
/**
 * A column's `key`. Columns are user-defined per project, so this is a plain
 * string rather than a union — the valid set is whatever BoardColumn rows the
 * project has, and is only known at runtime.
 */
export type IssueStatus = string;
export type IssuePriority = "low" | "medium" | "high" | "urgent";
export type SprintStatus = "planned" | "active" | "completed";

export interface TrackerUser {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role_code: string;
}

export interface TrackerProject {
  id: number;
  key: string;
  name: string;
  description: string | null;
  lead_id: number | null;
  /** "all" = everyone with tracker access; "team" = `members` only. */
  visibility: ProjectVisibility;
  is_active: boolean;
  lead?: TrackerUser | null;
  /** Only meaningful while `visibility` is "team". */
  members?: TrackerUser[];
}

export type ProjectVisibility = "all" | "team";

export interface Sprint {
  id: number;
  project_id: number;
  name: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  status: SprintStatus;
}

export interface SprintWithIssues extends Sprint {
  issues: Issue[];
  points: number;
  done: number;
}

/**
 * A saved view over a project's issues. "active" and "me" are resolved when the
 * board is opened, not when it is saved, so a board tracks the running sprint
 * and the viewer rather than a snapshot of them.
 */
/** One column of a project's board — its workflow states, in order. */
export interface BoardColumn {
  id: number;
  project_id: number;
  /** Stored in Issue.status. Immutable once issues reference it. */
  key: string;
  name: string;
  position: number;
  /** Reaching this column marks the issue complete. */
  is_done: boolean;
  color: string;
  wip_limit: number | null;
}

export interface Board {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  /** "all" | "backlog" | "active" | "<sprint_id>" */
  filter_sprint: string;
  /** "all" | "me" | "<admin_id>" */
  filter_assignee: string;
  /** IssueType or "all" */
  filter_type: string;
  /** IssuePriority or "all" */
  filter_priority: string;
  is_default: boolean;
  position: number;
}

export interface IssueComment {
  id: number;
  issue_id: number;
  author_id: number | null;
  body: string;
  created_at: string;
  author?: TrackerUser | null;
}

export interface Issue {
  id: number;
  project_id: number;
  issue_key: string;
  title: string;
  description: string | null;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  assignee_id: number | null;
  reporter_id: number | null;
  sprint_id: number | null;
  parent_id: number | null;
  story_points: number | null;
  start_date: string | null;
  due_date: string | null;
  branch: string | null;
  pull_request: string | null;
  position: number;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  /** The first of `assignees`. Kept for the board filters and the summary. */
  assignee?: TrackerUser | null;
  /** Everyone the task is assigned to; a task can be shared. */
  assignees?: TrackerUser[];
  reporter?: TrackerUser | null;
  sprint?: Pick<Sprint, "id" | "name" | "status"> | null;
  project?: Pick<TrackerProject, "id" | "key" | "name"> | null;
  comments?: IssueComment[];
  parent?: Pick<Issue, "id" | "issue_key" | "title"> | null;
}

/** A Timeline row carries the resolved span, so one-sided dates still draw. */
export interface TimelineRow extends Issue {
  span_start: string;
  span_end: string;
}

export interface SummaryData {
  project: TrackerProject;
  totals: {
    total: number;
    done: number;
    open: number;
    overdue: number;
    unassigned: number;
    completion: number;
  };
  by_status: Array<{ key: IssueStatus; count: number }>;
  columns: BoardColumn[];
  by_priority: Array<{ key: IssuePriority; count: number }>;
  by_assignee: Array<{ name: string; total: number; done: number }>;
  recent: Issue[];
}

export interface BoardData {
  project: TrackerProject;
  columns: Array<BoardColumn & { status: IssueStatus; issues: Issue[] }>;
  total: number;
  boards: Board[];
  /** Issues whose status matches no column; shown in the first column. */
  orphans: number;
  /** null when the project has no boards yet — the view then shows everything. */
  board: Board | null;
}

export interface BacklogData {
  project: TrackerProject;
  columns: BoardColumn[];
  backlog: Issue[];
  sprints: SprintWithIssues[];
}

export interface DevelopmentData {
  project: TrackerProject;
  linked: Issue[];
  missing: Issue[];
  unlinked: number;
  total: number;
}

export interface TimelineData {
  project: TrackerProject;
  rows: TimelineRow[];
  undated: number;
  range: { from: string; to: string } | null;
  sprints: Sprint[];
}

export interface TrackerResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}
