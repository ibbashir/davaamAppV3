import * as React from "react"
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
import DL from "../assets/DL.png"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useAuth()
  const navigate = useNavigate()

  const role = state.user?.user_role?.toLowerCase().replace(/\s/g, "") || ""

  const navMain = [
    { title: "Dashboard", url: `/${role}/dashboard`, icon: IconHome },
    ...(role === "superadmin"
      ? [
        { title: "Create Roles", url: `/${role}/roles`, icon: IconUserPlus },
        { title: "Corporate Clients", url: `/${role}/corporate`, icon: IconUserStar },
      ]
      : []),
    ...(role === "superadmin" || role === "admin"
      ? [
        { title: "Users", url: `/${role}/users`, icon: IconUsers },
        { title: "Send Notifications", url: `/${role}/notifications`, icon: IconBell },
      ]
      : []),
    { title: "Machines", url: `/${role}/machines`, icon: IconChartBar },
    { title: "Points Share", url: `/${role}/pointshare`, icon: IconShare3 },
    { title: "Locations", url: `/${role}/locations`, icon: IconLocation },
    { title: "Topup", url: `/${role}/topup`, icon: IconCircleArrowUpRight },
    { title: "App Feedback", url: `/${role}/feedback`, icon: IconMessage2Exclamation },
  ]

  const userData = {
    name: `${state.user?.first_name || "User"}`,
    email: state.user?.email || "user@davaam.pk",
    avatar: "/avatars/shadcn.jpg",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a onClick={() => navigate(`/${role}/dashboard`)}>
                <img src={DL} alt="DL Logo" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
