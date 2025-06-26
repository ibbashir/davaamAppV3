import * as React from "react"
import {
  IconChartBar,
  IconFolder,
  IconListDetails,
  IconLocation,
  IconCircleArrowUpRight,
  IconUsers,
  IconUserStar,
  IconBell,
  IconMessage2Exclamation,
  IconHome,
  IconUserPlus
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

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/Dashboard",
      icon: IconHome,
    },
    {
      title: "Create Roles",
      url: "/roles",
      icon: IconUserPlus,
    },
    {
      title: "Machines",
      url: "#",
      icon: IconChartBar,
    },
    {
      title: "Points Share",
      url: "#",
      icon: IconFolder,
    },
    {
      title: "Locations",
      url: "#",
      icon: IconLocation,
    },
    {
      title: "Topup",
      url: "#",
      icon: IconCircleArrowUpRight,
    },
    {
      title: "Users",
      url: "#",
      icon: IconUsers,
    },
    {
      title: "Corporate Clients",
      url: "#",
      icon: IconUserStar,
    },
    {
      title: "Send Notifications",
      url: "#",
      icon: IconBell,
    },
    {
      title: "App Feedback",
      url: "#",
      icon: IconMessage2Exclamation,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const Navigate = useNavigate();
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a onClick={() => { Navigate("/dashboard") }} href="#">
                <img src={DL} alt="DL Logo" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
