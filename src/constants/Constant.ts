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
} from "@tabler/icons-react";

export const BASE_URL_TWO =
  "https://davaam-backend-nodejs-4199d6d4d449.herokuapp.com/";
export const BASE_URL =
  "https://davaam-backend-nodejs-4199d6d4d449.herokuapp.com/api/dashboard";


//  export const BASE_URL_TWO = "http://localhost:3009/";
//  export const BASE_URL = "http://localhost:3009/api/dashboard";

export const LOCAL_BASE_URL = "http://localhost:3009/api/dashboard";
export const CHATBOT_API_URL = "http://localhost:8000";
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
export const SUPERADMIN_RIDER_LOCATION = "/superadmin/riderLocation";
export const SUPERADMIN_ADD_EMPLOYEES = "/superadmin/add-employees";
export const SUPERADMIN_DELETE_EMPLOYEES = "/superadmin/delete-employees";

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
export const ADMIN_RIDER_LOCATION = "/superadmin/riderLocation";

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
export const OPS_RIDER_LOCATION = "/superadmin/riderLocation";

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

// Finance Path
export const FINANCE_DASHBOARD = "/finance/dashboard";
export const FINANCE_MACHINES = "/finance/machines";
export const FINANCE_LOCATIONS = "/finance/locations";
export const FINANCE_TOPUP = "/finance/topup";
export const FINANCE_MAINTAINCE = "/finance/maintaince";
export const FINANCE_MACHINE_VISIT = "/finance/machine-details/:id";
export const FINANCE_CASH_COLLECTIONS = "/finance/cashCollection";
export const FINANCE_MACHINE_MAP = "/finance/machine-map";

//MACHINE PATH
export const MACHINE_DASHBOARD = "/company/dashboard";
export const MACHINE_MACHINES = "/company/machines";
export const COMPANY_MACHINE_VISIT = "/company/machine-details/:id";
export const REPORT = "/company/report";
export const ADD_EMPLOYEES = "/company/add-employees";
export const DELETE_EMPLOYEES = "/company/delete-employees";
export const USERS = "/company/users";
export const CORPORATE_CASH_COLLECTION = "/company/cashCollection";


// navigation const
export const SUPER_ADMIN_SIDEBAR_ROUTES = () => {
  return [
    { title: "Dashboard", url: SUPERADMIN_DASHBOARD, icon: IconHome },
    { title: "Create Roles", url: SUPERADMIN_ROLES, icon: IconUserPlus },
    // {
    //   title: "Corporate Clients",
    //   url: SUPERADMIN_CORPORATE,
    //   icon: IconUserStar,
    // },
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
    {
      title: "Corporate Topup",
      url: SUPERADMIN_CORPORATE_TOPUP,
      icon: IconCashBanknote,
    },
    {
      title: "Map Machines",
      url: SUPERADMIN_MACHINE_MAP,
      icon: IconMapPin,
    },
    {
      title: "Cash Collection",
      url: SUPERADMIN_CASH_COLLECTION,
      icon: IconCashBanknote,
    },
    {
      title: "Rider Locations", url: SUPERADMIN_RIDER_LOCATION, icon: IconHexagonPlus
    },
    // {
    //   title: "Delete Corporate Employees", url: SUPERADMIN_DELETE_EMPLOYEES, icon: IconHexagonMinus
    // },
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
    {
      title: "App Feedback",
      url: ADMIN_FEEDBACK,
      icon: IconMessage2Exclamation,
    },
    {
      title: "Corporate Topup",
      url: ADMIN_CORPORATE_TOPUP,
      icon: IconMessage2Exclamation,
    },
    {
      title: "Map Machines",
      url: ADMIN_MACHINE_MAP,
      icon: IconMapPin,
    },
    {
      title: "Cash Collection",
      url: ADMIN_CASH_COLLECTION,
      icon: IconCashBanknote,
    }
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
    {
      title: "Map Machines",
      url: OPS_MACHINE_MAP,
      icon: IconMapPin,
    },
  ];
};

export const FULFILL_SIDEBAR_ROUTES = () => {
  return [
    { title: "Dashboard", url: FULFill_DASHBOARD, icon: IconHome },
    { title: "Machines", url: FULFill_MACHINES, icon: IconChartBar },
    { title: "Locations", url: FULFill_LOCATIONS, icon: IconLocation },
    { title: "Topup", url: FULFill_TOPUP, icon: IconCircleArrowUpRight },
    {
      title: "Maintaince",
      url: FULLFiLL_MAINTAINCE,
      icon: IconCircleArrowUpRight,
    },
    {
      title: "Maintaince Requests",
      url: MAINTAINCE_REQUESTS,
      icon: IconCircleArrowUpRight,
    },
    {
      title: "Cash Collections",
      url: CASH_COLLECTIONS,
      icon: IconCashBanknote,
    },
    {
      title: "Map Machines",
      url: FULFill_MACHINE_MAP,
      icon: IconMapPin,
    },
  ];
};
export const FINANCE_SIDEBAR_ROUTES = () => {
  return [
    { title: "Dashboard", url: FINANCE_DASHBOARD, icon: IconHome },
    { title: "Machines", url: FINANCE_MACHINES, icon: IconChartBar },
    { title: "Locations", url: FINANCE_LOCATIONS, icon: IconLocation },
    { title: "Topup", url: FINANCE_TOPUP, icon: IconCircleArrowUpRight },
    {
      title: "Cash Collections",
      url: FINANCE_CASH_COLLECTIONS,
      icon: IconCashBanknote,
    },
    {
      title: "Map Machines",
      url: FINANCE_MACHINE_MAP,
      icon: IconMapPin,
    },
  ];
};

export const MACHINES_SIDEBAR_ROUTES = (firstName: string) => {
  const routes = [
    { title: "Dashboard", url: MACHINE_DASHBOARD, icon: IconHome },
    { title: "Machines", url: MACHINE_MACHINES, icon: IconChartBar },
    { title: "Reports", url: REPORT, icon: IconFileDescription },
  ];
  // Show Test only to Mobilink
  if (firstName === "Mobilink") {
    routes.push(
      {
        title: "Users",
        url: USERS,
        icon: IconUser,
      },
      {
        title: "Add Bulk Employee",
        url: ADD_EMPLOYEES,
        icon: IconHexagonPlus,
      },
      {
        title: "Delete Bulk Employee",
        url: DELETE_EMPLOYEES,
        icon: IconHexagonMinus,
      },
    );
  }
  if (firstName === "Butterfly") {
    routes.push({
      title: "Cash Collection",
      url: CORPORATE_CASH_COLLECTION,
      icon: IconCashBanknote,
    });
  }
  return routes;
};

// TIME STAMP CONVERTER
export function unixTimestampToCustomString(
  unixTimestamp: number,
  format: string,
  timeZoneOffset: number,
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
    (match) => String(placeholders[match]) || match,
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
