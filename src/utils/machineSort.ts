/**
 * Column sorting for the Machines tables (superadmin, admin, ops, fulfill,
 * finance). The list is paginated on the server, so sorting is done there too
 * via `sortBy` / `sortOrder` on getAllMachineStockAndStatus. Sorting only the
 * rows on screen would give a different answer on every page.
 */

export type MachineSortField =
  | "machine_code"
  | "machine_name"
  | "variant"
  | "machine_type"
  | "women_access"
  | "currentStock"
  | "stockStatus"
  | "lastActive"
  | "status";

export type SortDirection = "asc" | "desc" | "none";

export type MachineSortConfig = {
  field: MachineSortField;
  direction: SortDirection;
};

export const DEFAULT_MACHINE_SORT: MachineSortConfig = {
  field: "machine_code",
  direction: "asc",
};

// Both stock columns order by total units left, which the server calls "stock".
const SERVER_SORT_KEY: Record<MachineSortField, string> = {
  machine_code: "machine_code",
  machine_name: "machine_name",
  variant: "variant",
  machine_type: "machine_type",
  women_access: "women_access",
  currentStock: "stock",
  stockStatus: "stock",
  lastActive: "lastActive",
  status: "status",
};

/** Query params for the current sort; none → the server's machine_code order. */
export function machineSortParams(
  sort: MachineSortConfig,
): Record<string, string> {
  if (sort.direction === "none") return {};
  return { sortBy: SERVER_SORT_KEY[sort.field], sortOrder: sort.direction };
}

/** Clicking a header cycles asc → desc → none; a new column starts at asc. */
export function nextMachineSort<F extends string = MachineSortField>(
  current: { field: F; direction: SortDirection },
  field: F,
): { field: F; direction: SortDirection } {
  if (current.field !== field) return { field, direction: "asc" };
  const direction: SortDirection =
    current.direction === "asc"
      ? "desc"
      : current.direction === "desc"
        ? "none"
        : "asc";
  return { field, direction };
}

/** Restores a sort saved in sessionStorage, ignoring anything malformed. */
export function restoreMachineSort(saved: unknown): MachineSortConfig {
  const s = saved as Partial<MachineSortConfig> | null | undefined;
  if (
    s &&
    typeof s.field === "string" &&
    s.field in SERVER_SORT_KEY &&
    (s.direction === "asc" || s.direction === "desc" || s.direction === "none")
  ) {
    return { field: s.field, direction: s.direction };
  }
  return DEFAULT_MACHINE_SORT;
}
