import {
  IconLocation,
  IconCircleArrowUpRight,
  IconUsers,
  IconUserStar,
  IconBell,
  IconMessage2Exclamation,
  IconHome,
  IconUserPlus,
  IconShare3,
  IconChartBar,
} from "@tabler/icons-react";

export const BASE_URL_TWO =
  "https://davaam-backend-nodejs-4199d6d4d449.herokuapp.com/";
export const BASE_URL =
  "https://davaam-backend-nodejs-4199d6d4d449.herokuapp.com/api/dashboard";

export const LOCAL_BASE_URL="http://localhost:3009/api/dashboard";
//PUBLIC PATHS
export const LOGIN = "/login";
export const FORGET_PASSWORD = "/forgetPassword";
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
export const SUPERADMIN_MACHINE_VISIT =
  "/superadmin/machine-details";

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
export const ADMIN_MACHINE_VISIT = "/admin/machine-details";

//OPS PATHS
export const OPS_DASHBOARD = "/ops/dashboard";
export const OPS_MACHINES = "/ops/machines";
export const OPS_POINTS = "/ops/pointshare";
export const OPS_LOCATIONS = "/ops/locations";
export const OPS_TOPUP = "/ops/topup";
export const OPS_USERS = "/ops/users";
export const OPS_FEEDBACK = "/ops/feedback";
export const OPS_CORPORATE = "/ops/corporate";
export const OPS_MACHINE_VISIT = "/ops/machine-details";

//MACHINE PATH
export const MACHINE_DASHBOARD = "/company/dashboard";
export const MACHINE_MACHINES = "/company/machines";

// navigation const
export const SUPER_ADMIN_SIDEBAR_ROUTES = () => {
  return [
    { title: "Dashboard", url: SUPERADMIN_DASHBOARD, icon: IconHome },
    { title: "Create Roles", url: SUPERADMIN_ROLES, icon: IconUserPlus },
    {
      title: "Corporate Clients",
      url: SUPERADMIN_CORPORATE,
      icon: IconUserStar,
    },
    { title: "Users", url: SUPERADMIN_USERS, icon: IconUsers },
    {
      title: "Send Notifications",
      url: SUPERADMIN_NOTIFICATIONS,
      icon: IconBell,
    },
    { title: "Machines", url: SUPERADMIN_MACHINES, icon: IconChartBar },
    { title: "Points Share", url: SUPERADMIN_POINTS, icon: IconShare3 },
    { title: "Locations", url: SUPERADMIN_LOCATIONS, icon: IconLocation },
    { title: "Topup", url: SUPERADMIN_TOPUP, icon: IconCircleArrowUpRight },
    {
      title: "App Feedback",
      url: SUPERADMIN_FEEDBACK,
      icon: IconMessage2Exclamation,
    },
  ];
};

export const ADMIN_SIDEBAR_ROUTES = () => {
  return [
    { title: "Dashboard", url: ADMIN_DASHBOARD, icon: IconHome },
    { title: "Corporate Clients", url: ADMIN_CORPORATE, icon: IconUserStar },
    { title: "Users", url: ADMIN_USERS, icon: IconUsers },
    { title: "Send Notifications", url: ADMIN_NOTIFICATIONS, icon: IconBell },
    { title: "Machines", url: ADMIN_MACHINES, icon: IconChartBar },
    { title: "Points Share", url: ADMIN_POINTS, icon: IconShare3 },
    { title: "Locations", url: ADMIN_LOCATIONS, icon: IconLocation },
    { title: "Topup", url: ADMIN_TOPUP, icon: IconCircleArrowUpRight },
    {
      title: "App Feedback",
      url: ADMIN_FEEDBACK,
      icon: IconMessage2Exclamation,
    },
  ];
};

export const OPS_SIDEBAR_ROUTES = () => {
  return [
    { title: "Dashboard", url: OPS_DASHBOARD, icon: IconHome },
    { title: "Corporate Clients", url: OPS_CORPORATE, icon: IconUserStar },
    { title: "Users", url: OPS_USERS, icon: IconUsers },
    { title: "Machines", url: OPS_MACHINES, icon: IconChartBar },
    { title: "Points Share", url: OPS_POINTS, icon: IconShare3 },
    { title: "Locations", url: OPS_LOCATIONS, icon: IconLocation },
    { title: "Topup", url: OPS_TOPUP, icon: IconCircleArrowUpRight },
    { title: "App Feedback", url: OPS_FEEDBACK, icon: IconMessage2Exclamation },
  ];
};

export const MACHINES_SIDEBAR_ROUTES = () => {
    return [
        { title: "Dashboard", url: MACHINE_DASHBOARD, icon: IconHome },
        { title: "Machines", url: MACHINE_MACHINES, icon: IconChartBar },
    ]
}

// TIME STAMP CONVERTER
export function unixTimestampToCustomString(
  unixTimestamp: number,
  format: string,
  timeZoneOffset: number
): string {
  const date = new Date(unixTimestamp * 1000);

  const months: string[] = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const year: number = date.getFullYear();
  const month: string = months[date.getMonth()];
  const day: number = date.getDate();
  const hours: number = date.getHours();
  const minutes: number = date.getMinutes();
  const seconds: number = date.getSeconds();

  const offsetHours: number = Math.floor(Math.abs(timeZoneOffset / 60));
  const offsetMinutes: number = Math.abs(timeZoneOffset % 60);
  const offsetSign: string = timeZoneOffset >= 0 ? "+" : "-";

  // Define placeholders for various date and time components
  const placeholders: { [key: string]: string | number } = {
    YYYY: year,
    MM: (date.getMonth() + 1).toString().padStart(2, "0"),
    DD: day.toString().padStart(2, "0"),
    HH: hours.toString().padStart(2, "0"),
    mm: minutes.toString().padStart(2, "0"),
    ss: seconds.toString().padStart(2, "0"),
    MMM: month,
    TZHH: offsetSign + offsetHours.toString().padStart(2, "0"),
    TZmm: offsetMinutes.toString().padStart(2, "0"),
  };

  // Replace format placeholders with actual values
  const formattedDate: string = format.replace(
    /YYYY|MM|DD|HH|mm|ss|MMM|TZHH|TZmm/g,
    (match) => String(placeholders[match]) || match
  );

  return formattedDate;
}

export function timeConverter(UNIX_timestamp: number): string {
  const dateObj = new Date(UNIX_timestamp * 1000);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const year = dateObj.getFullYear();
  const month = months[dateObj.getMonth()];
  const date = dateObj.getDate().toString().padStart(2, "0");
  const hour = dateObj.getHours().toString().padStart(2, "0");
  const min = dateObj.getMinutes().toString().padStart(2, "0");
  const sec = dateObj.getSeconds().toString().padStart(2, "0");

  return `${date} ${month} ${year} ${hour}:${min}:${sec}`;
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
