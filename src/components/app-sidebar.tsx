import * as React from "react"
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
import { ADMIN_SIDEBAR_ROUTES, OPS_SIDEBAR_ROUTES, SUPER_ADMIN_SIDEBAR_ROUTES } from "@/constants/Constant"


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useAuth();
  const navigate = useNavigate();

  const role = state.user?.user_role?.toLowerCase().replace(/\s/g, "") || ""

  const navMain = [
    ...(role === "superadmin" ? SUPER_ADMIN_SIDEBAR_ROUTES() : []),
    ...(role === "admin" ? ADMIN_SIDEBAR_ROUTES() : []),
    ...(role === "ops" ? OPS_SIDEBAR_ROUTES() : []),
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
