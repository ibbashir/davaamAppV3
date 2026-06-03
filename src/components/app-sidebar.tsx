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
import {
  ADMIN_SIDEBAR_ROUTES,
  FULFILL_SIDEBAR_ROUTES,
  MACHINES_SIDEBAR_ROUTES,
  OPS_SIDEBAR_ROUTES,
  SUPER_ADMIN_SIDEBAR_ROUTES,
  FINANCE_SIDEBAR_ROUTES,
} from "@/constants/Constant"
import { useIsMobile } from "@/hooks/use-mobile"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const isMobile = useIsMobile()
  const { state } = useAuth()
  const navigate = useNavigate()

  const role = state.role ?? ""

  const navMain = React.useMemo(() => {
    switch (role) {
      case "superadmin": return SUPER_ADMIN_SIDEBAR_ROUTES()
      case "admin":      return ADMIN_SIDEBAR_ROUTES()
      case "ops":        return OPS_SIDEBAR_ROUTES()
      case "fulfill":    return FULFILL_SIDEBAR_ROUTES()
      case "finance":    return FINANCE_SIDEBAR_ROUTES()
      case "company":    return MACHINES_SIDEBAR_ROUTES(state.user?.first_name ?? "User")
      default:           return []
    }
  }, [role, state.user?.first_name])

  const userData = {
    name: state.user?.first_name ?? "User",
    email: state.user?.email ?? "user@davaam.pk",
    avatar: "/avatars/shadcn.jpg",
  }

  return (
    <Sidebar collapsible={isMobile ? "offcanvas" : "icon"} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              {/* Use button instead of <a onClick> for proper semantics */}
              <button
                type="button"
                onClick={() => navigate(`/${role}/dashboard`)}
                aria-label="Go to dashboard"
              >
                <img src={DL} alt="Davaam Life" className="h-8 w-auto" />
              </button>
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
