import {
  IconLocation,
  IconCircleArrowUpRight,
  IconBell,
  IconMessage2Exclamation,
  IconHome,
  IconUserPlus,
  IconShare3,
  IconChartBar,
  IconFileDescription,
  IconUser,
  IconHexagonPlus,
  IconHexagonMinus,
  IconMapPin,
  IconCashBanknote,
  IconReport,
  IconClipboardList,
  IconRobot,
  IconUsers,
  IconClockHour4,
  IconCalendarStats,
  IconCalendarEvent,
  IconBriefcase,
  IconChecklist,
  IconTargetArrow,
  IconSchool,
  IconReceipt,
  IconTicket,
  IconPlane,
  IconDoorExit,
  IconDeviceLaptop,
  IconUsersGroup,
  IconHammer,
  IconSettings,
  IconUserCircle,
} from "@tabler/icons-react";
import React from "react";
// Type-only import — erased at build time, so no runtime cycle with nav-main.
import type { NavItem } from "@/components/nav-main";

export const BASE_URL_TWO = "https://api.davaam.app/";
// export const BASE_URL_TWO = "http://localhost:4000/";
export const BASE_URL = "https://api.davaam.app/api/dashboard";
// export const BASE_URL = "http://localhost:4000/api/dashboard";
export const SOCKET_URL = "https://api.davaam.app";
export const BASE_URL_STOCK = "https://api.davaam.app/api/smsPortal/stockApp";
export const BASE_URL_STOCK_AUTH = "https://api.davaam.app/api/smsPortal/stockAuth";
export const CHATBOT_API_URL = "https://api.davaam.app/api/chatbot";

//PUBLIC PATHS
export const LOGIN = "/login";
export const FORGET_PASSWORD = "/forgetPassword";
export const RESET_PASSWORD = "/reset-password";
export const COMPANY_INFO = "/company-info";
export const PRIVACY_POLICY = "/privacypolicy";

// SUPERADMIN PATHS
export const SUPERADMIN_DASHBOARD = "/superadmin/dashboard";
export const SUPERADMIN_MACHINES = "/superadmin/machines";
export const SUPERADMIN_ROLES = "/superadmin/roles";
export const SUPERADMIN_POINTS = "/superadmin/pointshare";
export const SUPERADMIN_LOCATIONS = "/superadmin/locations";
export const SUPERADMIN_TOPUP = "/superadmin/topup";
export const SUPERADMIN_USERS = "/superadmin/users";
export const SUPERADMIN_NOTIFICATIONS = "/superadmin/notifications";
export const SUPERADMIN_FEEDBACK = "/superadmin/feedback";
export const SUPERADMIN_CORPORATE = "/superadmin/corporate";
export const SUPERADMIN_STATUS = "/superadmin/status";
export const SUPERADMIN_MACHINE_VISIT = "/superadmin/machine-details/:id";
export const SUPERADMIN_CORPORATE_TOPUP = "/superadmin/corporate-topup";
export const SUPERADMIN_MACHINE_MAP = "/superadmin/machine-map";
export const SUPERADMIN_CASH_COLLECTION = "/superadmin/cashCollection";
export const SUPERADMIN_KNOWLEDGE_BASE = "/superadmin/knowledge-base";
export const SUPERADMIN_RIDER_LOCATION = "/superadmin/riderLocation";
export const SUPERADMIN_ADD_EMPLOYEES = "/superadmin/add-employees";
export const SUPERADMIN_DELETE_EMPLOYEES = "/superadmin/delete-employees";
export const SUPERADMIN_USER_ANALYSIS = "/superadmin/userAnalysis";
export const SUPERADMIN_SURVEY_FORM = "/superadmin/survey-form";
export const SUPERADMIN_ALERT_SYSTEM = "/superadmin/alert-system";
export const SUPERADMIN_ALERT_MACHINE_DETAIL = "/superadmin/alert-system/machine/:machineCode";
export const SUPERADMIN_ASK_CHATBOT = "/superadmin/askChatbot";
export const SUPERADMIN_TEAM_MEMBERS = "/superadmin/team-members";

// ADMIN PATHS
export const ADMIN_DASHBOARD = "/admin/dashboard";
export const ADMIN_MACHINES = "/admin/machines";
export const ADMIN_POINTS = "/admin/pointshare";
export const ADMIN_LOCATIONS = "/admin/locations";
export const ADMIN_TOPUP = "/admin/topup";
export const ADMIN_USERS = "/admin/users";
export const ADMIN_NOTIFICATIONS = "/admin/notifications";
export const ADMIN_FEEDBACK = "/admin/feedback";
export const ADMIN_CORPORATE = "/admin/corporate";
export const ADMIN_MACHINE_VISIT = "/admin/machine-details/:id";
export const ADMIN_CORPORATE_TOPUP = "/admin/corporate-topup";
export const ADMIN_MACHINE_MAP = "/admin/machine-map";
export const ADMIN_CASH_COLLECTION = "/admin/cashCollection";
export const ADMIN_RIDER_LOCATION = "/admin/riderLocation";
export const ADMIN_BUTTERFLY_PRODUCTS="/admin/butterflyProducts"
export const ADMIN_ALERT_SYSTEM = "/admin/alert-system";
export const ADMIN_ALERT_MACHINE_DETAIL = "/admin/alert-system/machine/:machineCode";
export const ADMIN_USER_ANALYSIS = "/superadmin/userAnalysis";

//OPS PATHS
export const OPS_DASHBOARD = "/ops/dashboard";
export const OPS_MACHINES = "/ops/machines";
export const OPS_POINTS = "/ops/pointshare";
export const OPS_LOCATIONS = "/ops/locations";
export const OPS_TOPUP = "/ops/topup";
export const OPS_USERS = "/ops/users";
export const OPS_FEEDBACK = "/ops/feedback";
export const OPS_CORPORATE = "/ops/corporate";
export const OPS_MACHINE_VISIT = "/ops/machine-details/:id";
export const OPS_MACHINE_MAP = "/ops/machine-map";
export const OPS_CASH_COLLECTION = "/ops/cashCollection";
export const OPS_RIDER_LOCATION = "/ops/riderLocation";
export const OPS_ALERT_SYSTEM = "/ops/alert-system";
export const OPS_ALERT_MACHINE_DETAIL = "/ops/alert-system/machine/:machineCode";

// Fulfillment PATH
export const FULFill_DASHBOARD = "/fulfill/dashboard";
export const FULFill_MACHINES = "/fulfill/machines";
export const FULFill_LOCATIONS = "/fulfill/locations";
export const FULFill_TOPUP = "/fulfill/topup";
export const FULLFiLL_MAINTAINCE = "/fulfill/maintaince";
export const FULFill_MACHINE_VISIT = "/fulfill/machine-details/:id";
export const MAINTAINCE_REQUESTS = "/fulfill/maintaince-requests";
export const CASH_COLLECTIONS = "/fulfill/cashCollection";
export const FULFill_MACHINE_MAP = "/fulfill/machine-map";
export const Fulfill_RIDER_LOCATION = "/fulfill/riderLocation";

// Finance Path
export const FINANCE_DASHBOARD = "/finance/dashboard";
export const FINANCE_USER_WALLET_ACTIVITY = "/finance/userWalletActivity";
export const FINANCE_MACHINES = "/finance/machines";
export const FINANCE_LOCATIONS = "/finance/locations";
export const FINANCE_TOPUP = "/finance/topup";
export const FINANCE_MAINTAINCE = "/finance/maintaince";
export const FINANCE_MACHINE_VISIT = "/finance/machine-details/:id";
export const FINANCE_CASH_COLLECTIONS = "/finance/cashCollection";
export const FINANCE_MACHINE_MAP = "/finance/machine-map";
export const FINANCE_REPORT = "/finance/finance-report";
export const FINANCE_MACHINE_STOCKS = "/finance/machine-stocks";

// HR MANAGEMENT PATHS (HCM / HRM)
export const HR_DASHBOARD = "/hr/dashboard";
export const HR_EMPLOYEES = "/hr/employees";
export const HR_ATTENDANCE = "/hr/attendance";
export const HR_LEAVE = "/hr/leave";
export const HR_HOLIDAYS = "/hr/holidays";
export const HR_PAYROLL = "/hr/payroll";
export const HR_RECRUITMENT = "/hr/recruitment";
export const HR_ONBOARDING = "/hr/onboarding";
export const HR_PERFORMANCE = "/hr/performance";
export const HR_TRAINING = "/hr/training";
export const HR_EXPENSES = "/hr/expenses";
export const HR_HELPDESK = "/hr/helpdesk";
export const HR_TRAVEL = "/hr/travel";
export const HR_SEPARATION = "/hr/separation";
export const HR_LETTERS = "/hr/letters";
export const HR_ALERTS = "/hr/scheduled-alerts";
export const HR_REPORTS = "/hr/scheduled-reports";
export const HR_ASSETS = "/hr/assets";
export const HR_MANPOWER = "/hr/manpower";
export const HR_PIECE_WORK = "/hr/piece-work";
export const HR_ANALYTICS = "/hr/analytics";
export const HR_ORG_SETUP = "/hr/org-setup";

// SELF SERVICE PATHS (ESS + MSS) — available to every dashboard role
export const ESS_HUB = "/self-service";
export const ESS_ATTENDANCE = "/self-service/attendance";
export const ESS_LEAVE = "/self-service/leave";
export const ESS_EXPENSES = "/self-service/expenses";
export const ESS_PAYSLIPS = "/self-service/payslips";
export const ESS_PROFILE = "/self-service/profile";
export const ESS_REQUESTS = "/self-service/requests";
export const MSS_TEAM = "/self-service/team";

/**
 * Employees on the "others" role have no admin area of their own, but login and
 * the sidebar logo both navigate to `/<role>/dashboard` — so this path exists
 * purely to bounce them into self-service.
 */
export const OTHERS_DASHBOARD = "/others/dashboard";

//MACHINE PATH
export const MACHINE_DASHBOARD = "/company/dashboard";
export const MACHINE_MACHINES = "/company/machines";
export const COMPANY_MACHINE_VISIT = "/company/machine-details/:id";
export const REPORT = "/company/report";
export const ADD_EMPLOYEES = "/company/add-employees";
export const DELETE_EMPLOYEES = "/company/delete-employees";
export const USERS = "/company/users";
export const CORPORATE_CASH_COLLECTION = "/company/cashCollection";
export const COMPANY_USER_ANALYSIS="/company/userAnalysis"

// ─── Live rider badge helper ──────────────────────────────────────────────────
// Renders a teal pulsing pill showing the active rider count.
// Returns null when count is 0 so no badge appears for inactive state.
const LiveRiderBadge = (count: number): React.ReactNode => {
  if (count <= 0) return null;
  return React.createElement(
    "span",
    {
      className:
        "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-500 text-white shadow-sm",
    },
    React.createElement(
      "span",
      { className: "relative flex h-1.5 w-1.5" },
      React.createElement("span", {
        className:
          "animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60",
      }),
      React.createElement("span", {
        className: "relative inline-flex rounded-full h-1.5 w-1.5 bg-white",
      })
    ),
    String(count)
  );
};

// navigation const

/**
 * Pass `activeRiderCount` (from a polling hook in AppSidebar) to show a live
 * pulsing badge on the "Rider Locations" entry. Defaults to 0 (no badge).
 */
export const SUPER_ADMIN_SIDEBAR_ROUTES = (activeRiderCount = 0) => {
  return [
    { title: "Dashboard", url: SUPERADMIN_DASHBOARD, icon: IconHome },
    { title: "Create Roles", url: SUPERADMIN_ROLES, icon: IconUserPlus },
    // { title: "Corporate Clients", url: SUPERADMIN_CORPORATE, icon: IconUserStar },
    { title: "Send Notifications", url: SUPERADMIN_NOTIFICATIONS, icon: IconBell },
    { title: "Machines", url: SUPERADMIN_MACHINES, icon: IconChartBar },
    { title: "Points Share", url: SUPERADMIN_POINTS, icon: IconShare3 },
    { title: "Locations", url: SUPERADMIN_LOCATIONS, icon: IconLocation },
    { title: "Topup", url: SUPERADMIN_TOPUP, icon: IconCircleArrowUpRight },
    { title: "App Feedback", url: SUPERADMIN_FEEDBACK, icon: IconMessage2Exclamation },
    { title: "Corporate Topup", url: SUPERADMIN_CORPORATE_TOPUP, icon: IconCashBanknote },
    { title: "Map Machines", url: SUPERADMIN_MACHINE_MAP, icon: IconMapPin },
    { title: "Cash Collection", url: SUPERADMIN_CASH_COLLECTION, icon: IconCashBanknote },
    { title: "User Analysis Report", url: SUPERADMIN_USER_ANALYSIS, icon: IconReport },
    {
      title: "Rider Locations",
      url: SUPERADMIN_RIDER_LOCATION,
      icon: IconHexagonPlus,
      badge: LiveRiderBadge(activeRiderCount), // ← pulsing pill when riders are live
    },
    { title: "Survey Forms", url: SUPERADMIN_SURVEY_FORM, icon: IconClipboardList },
    { title: "Alert System", url: SUPERADMIN_ALERT_SYSTEM, icon: IconClipboardList },
    { title: "Ask Chatbot", url: SUPERADMIN_ASK_CHATBOT, icon: IconRobot },
    { title: "Team Members", url: SUPERADMIN_TEAM_MEMBERS, icon: IconUsers },
    // The HR attendance module, roster tab only. Named in full so it is not
    // mistaken for "My Attendance" under Self Service, which is this user's own.
    { title: "Attendance Management", url: HR_ATTENDANCE, icon: IconClockHour4 },

    // { title: "Delete Corporate Employees", url: SUPERADMIN_DELETE_EMPLOYEES, icon: IconHexagonMinus },
  ];
};

export const ADMIN_SIDEBAR_ROUTES = () => {
  return [
    { title: "Dashboard", url: ADMIN_DASHBOARD, icon: IconHome },
    { title: "Send Notifications", url: ADMIN_NOTIFICATIONS, icon: IconBell },
    { title: "Machines", url: ADMIN_MACHINES, icon: IconChartBar },
    { title: "Points Share", url: ADMIN_POINTS, icon: IconShare3 },
    { title: "Locations", url: ADMIN_LOCATIONS, icon: IconLocation },
    { title: "Topup", url: ADMIN_TOPUP, icon: IconCircleArrowUpRight },
    { title: "App Feedback", url: ADMIN_FEEDBACK, icon: IconMessage2Exclamation },
    { title: "Corporate Topup", url: ADMIN_CORPORATE_TOPUP, icon: IconCircleArrowUpRight },
    { title: "Map Machines", url: ADMIN_MACHINE_MAP, icon: IconMapPin },
    { title: "Rider Locations", url: ADMIN_RIDER_LOCATION, icon: IconHexagonPlus },
    { title: "Cash Collection", url: ADMIN_CASH_COLLECTION, icon: IconCashBanknote },
    { title: "User Analysis Report", url: ADMIN_USER_ANALYSIS, icon: IconReport },
    { title: "Butterfly Products", url: ADMIN_BUTTERFLY_PRODUCTS, icon: IconShare3 },
    { title: "Alert System", url: ADMIN_ALERT_SYSTEM, icon: IconClipboardList },
  ];
};

export const OPS_SIDEBAR_ROUTES = () => {
  return [
    { title: "Dashboard", url: OPS_DASHBOARD, icon: IconHome },
    { title: "Machines", url: OPS_MACHINES, icon: IconChartBar },
    { title: "Points Share", url: OPS_POINTS, icon: IconShare3 },
    { title: "Locations", url: OPS_LOCATIONS, icon: IconLocation },
    { title: "Topup", url: OPS_TOPUP, icon: IconCircleArrowUpRight },
    { title: "App Feedback", url: OPS_FEEDBACK, icon: IconMessage2Exclamation },
    { title: "Map Machines", url: OPS_MACHINE_MAP, icon: IconMapPin },
    { title: "Rider Locations", url: OPS_RIDER_LOCATION, icon: IconHexagonPlus },
    { title: "Cash Collection", url: OPS_CASH_COLLECTION, icon: IconCashBanknote },
    { title: "Alert System", url: OPS_ALERT_SYSTEM, icon: IconClipboardList },
  ];
};

export const FULFILL_SIDEBAR_ROUTES = () => {
  return [
    { title: "Dashboard", url: FULFill_DASHBOARD, icon: IconHome },
    { title: "Machines", url: FULFill_MACHINES, icon: IconChartBar },
    { title: "Locations", url: FULFill_LOCATIONS, icon: IconLocation },
    { title: "Topup", url: FULFill_TOPUP, icon: IconCircleArrowUpRight },
    { title: "Maintaince", url: FULLFiLL_MAINTAINCE, icon: IconCircleArrowUpRight },
    { title: "Maintaince Requests", url: MAINTAINCE_REQUESTS, icon: IconCircleArrowUpRight },
    { title: "Map Machines", url: FULFill_MACHINE_MAP, icon: IconMapPin },
    { title: "Rider Locations", url: Fulfill_RIDER_LOCATION, icon: IconHexagonPlus },
    { title: "Cash Collections", url: CASH_COLLECTIONS, icon: IconCashBanknote },
  ];
};

export const FINANCE_SIDEBAR_ROUTES = () => {
  return [
    { title: "Dashboard", url: FINANCE_DASHBOARD, icon: IconHome },
    { title: "Machines", url: FINANCE_MACHINES, icon: IconChartBar },
    { title: "Locations", url: FINANCE_LOCATIONS, icon: IconLocation },
    { title: "Topup", url: FINANCE_TOPUP, icon: IconCircleArrowUpRight },
    { title: "Cash Collections", url: FINANCE_CASH_COLLECTIONS, icon: IconCashBanknote },
    { title: "Map Machines", url: FINANCE_MACHINE_MAP, icon: IconMapPin },
    { title: "Finance Report", url: FINANCE_REPORT, icon: IconReport },
    { title: "Machine Stocks", url: FINANCE_MACHINE_STOCKS, icon: IconClipboardList },
    { title: "User Wallet Activity", url: FINANCE_USER_WALLET_ACTIVITY, icon: IconReport },
  ];
};

/**
 * HR Management sidebar — the HCM / HRM modules, ordered so the daily-use ones
 * (people, attendance, leave) sit at the top and configuration sits at the
 * bottom.
 *
 * Payroll is deliberately absent: salary is not HR's to see here, so the
 * Payroll screen and ESS "My Payslips" are unrouted. The screens and the whole
 * backend are still in the tree — putting the two rows back is all it takes.
 */
export const HR_SIDEBAR_ROUTES = () => {
  return [
    { title: "Dashboard", url: HR_DASHBOARD, icon: IconHome },
    { title: "Employees", url: HR_EMPLOYEES, icon: IconUsers },
    { title: "Attendance", url: HR_ATTENDANCE, icon: IconClockHour4 },
    { title: "Leave", url: HR_LEAVE, icon: IconCalendarStats },
    { title: "Holidays", url: HR_HOLIDAYS, icon: IconCalendarEvent },
    { title: "Recruitment", url: HR_RECRUITMENT, icon: IconBriefcase },
    { title: "Onboarding", url: HR_ONBOARDING, icon: IconChecklist },
    { title: "Performance", url: HR_PERFORMANCE, icon: IconTargetArrow },
    { title: "Training", url: HR_TRAINING, icon: IconSchool },
    { title: "Expenses", url: HR_EXPENSES, icon: IconReceipt },
    { title: "Help Desk", url: HR_HELPDESK, icon: IconTicket },
    { title: "Travel", url: HR_TRAVEL, icon: IconPlane },
    { title: "Separation", url: HR_SEPARATION, icon: IconDoorExit },
    { title: "HR Letters", url: HR_LETTERS, icon: IconFileDescription },
    { title: "Assets", url: HR_ASSETS, icon: IconDeviceLaptop },
    { title: "Manpower", url: HR_MANPOWER, icon: IconUsersGroup },
    { title: "Piece Work", url: HR_PIECE_WORK, icon: IconHammer },
    { title: "Scheduled Alerts", url: HR_ALERTS, icon: IconBell },
    { title: "Scheduled Reports", url: HR_REPORTS, icon: IconReport },
    { title: "Analytics", url: HR_ANALYTICS, icon: IconChartBar },
    { title: "Org Setup", url: HR_ORG_SETUP, icon: IconSettings },
  ];
};

/**
 * Self-service appended to EVERY role's sidebar — as ONE collapsible entry.
 *
 * ESS is deliberately role-independent: an ops, finance, admin or fulfillment
 * user marks their own attendance and applies for leave through these screens.
 * Nesting the pages under a single "Self Service" row keeps that from eating
 * seven slots in a sidebar that already belongs to the role's own work.
 *
 * "My Team" only appears for users who actually have direct reports.
 */
export const SELF_SERVICE_ROUTES = (isManager = false): NavItem[] => {
  const pages: NavItem[] = [
    // exact: "/self-service" prefixes every entry below it
    { title: "My Hub", url: ESS_HUB, icon: IconUserCircle, exact: true },
    { title: "My Attendance", url: ESS_ATTENDANCE, icon: IconClockHour4 },
    { title: "My Leave", url: ESS_LEAVE, icon: IconCalendarStats },
    { title: "My Requests", url: ESS_REQUESTS, icon: IconReceipt },
    { title: "My Profile", url: ESS_PROFILE, icon: IconUser },
  ];
  if (isManager) {
    pages.push({ title: "My Team", url: MSS_TEAM, icon: IconUsersGroup });
  }

  return [
    {
      title: "Self Service",
      url: ESS_HUB,
      icon: IconUserCircle,
      items: pages,
    },
  ];
};

export const MACHINES_SIDEBAR_ROUTES = (firstName: string) => {
  const routes = [
    { title: "Dashboard", url: MACHINE_DASHBOARD, icon: IconHome },
    { title: "Machines", url: MACHINE_MACHINES, icon: IconChartBar },
    { title: "Reports", url: REPORT, icon: IconFileDescription },
    { title: "Cash Collections", url: CORPORATE_CASH_COLLECTION, icon: IconFileDescription },
    { title: "User Analysis", url: COMPANY_USER_ANALYSIS, icon: IconFileDescription },
  ];
  if (firstName === "Mobilink") {
    routes.push(
      { title: "Users", url: USERS, icon: IconUser },
      { title: "Add Bulk Employee", url: ADD_EMPLOYEES, icon: IconHexagonPlus },
      { title: "Delete Bulk Employee", url: DELETE_EMPLOYEES, icon: IconHexagonMinus },
    );
  }
  return routes;
};

// TIME STAMP CONVERTERS
import { formatUnixTimestamp, formatDateTime as _formatDateTime } from "@/utils/formatters";

/** @deprecated Use formatUnixTimestamp from @/utils/formatters */
export function timeConverter(UNIX_timestamp: number): string {
  return formatUnixTimestamp(UNIX_timestamp);
}

/** @deprecated Use formatDateTime from @/utils/formatters */
export function unixTimestampToCustomString(
  unixTimestamp: number,
  _format?: string,
  _timeZoneOffset?: number,
): string {
  return formatUnixTimestamp(unixTimestamp);
}

export const categories = [
  { id: "butterfly", label: "Butterfly" },
  { id: "oil", label: "Refill Stations" },
  { id: "topup", label: "User Topup" },
  { id: "testing", label: "Testing" },
];

export const paymentTypes = [
  { id: "online", label: "Online payments" },
  { id: "cash", label: "Cash payments" },
];