
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
    IconChartBar
} from "@tabler/icons-react"

export const BASE_URL_TWO = "https://davaam-backend-nodejs-4199d6d4d449.herokuapp.com/";
export const BASE_URL = "https://davaam-backend-nodejs-4199d6d4d449.herokuapp.com/api/dashboard";


// SUPERADMIN PATHS
export const SUPERADMIN_DASHBOARD = "/superadmin/dashboard"
export const SUPERADMIN_MACHINES = "/superadmin/machines"
export const SUPERADMIN_ROLES = "/superadmin/roles"
export const SUPERADMIN_POINTS = "/superadmin/pointshare"
export const SUPERADMIN_LOCATIONS = "/superadmin/locations"
export const SUPERADMIN_TOPUP = "/superadmin/topup"
export const SUPERADMIN_USERS = "/superadmin/users"
export const SUPERADMIN_NOTIFICATIONS = "/superadmin/notifications"
export const SUPERADMIN_FEEDBACK = "/superadmin/feedback"
export const SUPERADMIN_CORPORATE = "/superadmin/corporate"

// ADMIN PATHS
export const ADMIN_DASHBOARD = "/admin/dashboard"
export const ADMIN_MACHINES = "/admin/machines"
export const ADMIN_POINTS = "/admin/pointshare"
export const ADMIN_LOCATIONS = "/admin/locations"
export const ADMIN_TOPUP = "/admin/topup"
export const ADMIN_USERS = "/admin/users"
export const ADMIN_NOTIFICATIONS = "/admin/notifications"
export const ADMIN_FEEDBACK = "/admin/feedback"
export const ADMIN_CORPORATE = "/admin/corporate"

//OPS PATHS
export const OPS_DASHBOARD = "/ops/dashboard"
export const OPS_MACHINES = "/ops/machines"
export const OPS_POINTS = "/ops/pointshare"
export const OPS_LOCATIONS = "/ops/locations"
export const OPS_TOPUP = "/ops/topup"
export const OPS_USERS = "/ops/users"
export const OPS_FEEDBACK = "/ops/feedback"
export const OPS_CORPORATE = "/ops/corporate"

//MACHINE PATH
export const MACHINE_DASHBOARD = "/company/dashboard"
export const MACHINE_MACHINES = "/company/machines"

// navigation const
export const SUPER_ADMIN_SIDEBAR_ROUTES = () => {
    return [
        { title: "Dashboard", url: SUPERADMIN_DASHBOARD, icon: IconHome },
        { title: "Create Roles", url: SUPERADMIN_ROLES, icon: IconUserPlus },
        { title: "Corporate Clients", url: SUPERADMIN_CORPORATE, icon: IconUserStar },
        { title: "Users", url: SUPERADMIN_USERS, icon: IconUsers },
        { title: "Send Notifications", url: SUPERADMIN_NOTIFICATIONS, icon: IconBell },
        { title: "Machines", url: SUPERADMIN_MACHINES, icon: IconChartBar },
        { title: "Points Share", url: SUPERADMIN_POINTS, icon: IconShare3 },
        { title: "Locations", url: SUPERADMIN_LOCATIONS, icon: IconLocation },
        { title: "Topup", url: SUPERADMIN_TOPUP, icon: IconCircleArrowUpRight },
        { title: "App Feedback", url: SUPERADMIN_FEEDBACK, icon: IconMessage2Exclamation },
    ]
}

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
        { title: "App Feedback", url: ADMIN_FEEDBACK, icon: IconMessage2Exclamation },
    ]
}

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
    ]
}

export const MACHINES_SIDEBAR_ROUTES = () => {
    return [
        { title: "Dashboard", url: MACHINE_DASHBOARD, icon: IconHome },
        { title: "Machines", url: MACHINE_MACHINES, icon: IconChartBar },
    ]
}