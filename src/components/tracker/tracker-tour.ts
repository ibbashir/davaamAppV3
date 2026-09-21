import type { TourStep } from "./GuidedTour"

/**
 * Steps are ordered to follow the way the module is actually used: pick a
 * project, see where things stand, plan, then work the board.
 */
export const TRACKER_TOUR: TourStep[] = [
  {
    title: "Welcome to the Project Tracker",
    body:
      "This is where the team's own work is tracked. Everything lives under a project — pick one here, or create your first. The project's key prefixes every issue, so \"DAV\" gives you DAV-1, DAV-2 and so on.",
    target: '[data-tour="project-switcher"]',
  },
  {
    title: "Summary",
    body:
      "The numbers worth having before standup: what's open, what's overdue, what nobody has picked up, and who is carrying what.",
    target: '[data-tour="tab-summary"]',
    tab: "summary",
  },
  {
    title: "Backlog",
    body:
      "Anything without a sprint sits in the backlog. Create a sprint, then move work into it from the dropdown on each row. Deleting a sprint returns its issues here rather than deleting them.",
    target: '[data-tour="tab-backlog"]',
    tab: "backlog",
  },
  {
    title: "Board",
    body:
      "Your day-to-day view. Drag a card between columns to change its status — it moves immediately and rolls back if the save fails.",
    target: '[data-tour="tab-board"]',
    tab: "board",
  },
  {
    title: "Saved board views",
    body:
      "A board is a saved filter. \"Active sprint\" follows whichever sprint is running, and \"Assigned to me\" resolves per person — so one board works for the whole team. Deleting a board removes the view only; no issues are touched.",
    target: '[data-tour="board-selector"]',
    tab: "board",
  },
  {
    title: "Your own columns",
    body:
      "The four default columns are just a starting point. Add QA, Blocked, Ready to Deploy — rename, recolour and reorder them. Renaming is safe: issues track the column, not its label.",
    target: '[data-tour="columns-button"]',
    tab: "board",
  },
  {
    title: "Development",
    body:
      "Issues carrying a branch or pull request, plus a warning list of work that's in progress with no code linked to it yet.",
    target: '[data-tour="tab-development"]',
    tab: "development",
  },
  {
    title: "Timeline",
    body:
      "A gantt view of everything with dates, with sprint bands and a line marking today. Issues with no start or due date aren't plotted — the tab tells you how many.",
    target: '[data-tour="tab-timeline"]',
    tab: "timeline",
  },
  {
    title: "That's the tour",
    body:
      "Open it again whenever you like from this Tour button. Create a project to get started.",
    target: '[data-tour="replay-tour"]',
    tab: "summary",
  },
]
