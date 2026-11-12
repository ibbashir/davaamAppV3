import { useAuth, type User } from "@/contexts/AuthContext";

/**
 * Company accounts that may view their data in the dashboard but not take it
 * out: no download or export buttons on any of their pages. Matched on the
 * account's first name, as the rest of the app does for company-specific pages.
 *
 * The backend refuses bulk exports for the same companies
 * (VIEW_ONLY_COMPANIES in backend/src/Constant.js); keep the two lists in step.
 */
export const VIEW_ONLY_COMPANIES = ["Butterfly"];

export const canExportData = (user: Pick<User, "role_code" | "first_name"> | null | undefined) =>
  !(user?.role_code === "3" && VIEW_ONLY_COMPANIES.includes(user.first_name ?? ""));

/** Whether the signed-in account may download or export data. */
export const useCanExport = () => canExportData(useAuth().state.user);
