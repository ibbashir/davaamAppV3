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

const data = {
  user: {
    name: "Hackerman",
    email: "hacker@parrot.com",
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
      url: "/machines",
      icon: IconChartBar,
    },
    {
      title: "Points Share",
      url: "/pointshare",
      icon: IconShare3,
    },
    {
      title: "Locations",
      url: "/locations",
      icon: IconLocation,
    },
    {
      title: "Topup",
      url: "/topup",
      icon: IconCircleArrowUpRight,
    },
    {
      title: "Users",
      url: "/users",
      icon: IconUsers,
    },
    {
      title: "Corporate Clients",
      url: "/corporate",
      icon: IconUserStar,
    },
    {
      title: "Send Notifications",
      url: "/notifications",
      icon: IconBell,
    },
    {
      title: "App Feedback",
      url: "/feedback",
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
