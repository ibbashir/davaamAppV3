import { useLocation } from "react-router-dom";

/**
 * The Alert System screens are shared by superadmin, admin and ops.
 * Derives the role from the current URL so the same components hit the
 * matching backend namespace and link within the role's own routes.
 */
export function useAlertBase() {
  const { pathname } = useLocation();
  const role = pathname.startsWith("/admin/")
    ? "admin"
    : pathname.startsWith("/ops/")
      ? "ops"
      : "superadmin";
  return {
    role,
    apiBase: `/${role}/machine-alerts`,
    routeBase: `/${role}/alert-system`,
  };
}
