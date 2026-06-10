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
  SUPER_ADMIN_SIDEBAR_ROUTES,
  ADMIN_SIDEBAR_ROUTES,
  FULFILL_SIDEBAR_ROUTES,
  MACHINES_SIDEBAR_ROUTES,
  OPS_SIDEBAR_ROUTES,
  FINANCE_SIDEBAR_ROUTES,
  BASE_URL,
} from "@/constants/Constant"
import { getRequest } from "@/Apis/Api"
import type { RiderLocation } from "@/Types/SuperAdmin/rider"
import { useIsMobile } from "@/hooks/use-mobile"

const POLL_MS = 10_000 // lighter than the map's 5s; sidebar badge is non-critical

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const isMobile = useIsMobile()
  const { state } = useAuth()
  const navigate = useNavigate()

  const role = state.role ?? ""

  // Poll active rider count only when the logged-in user is superadmin
  const [activeRiderCount, setActiveRiderCount] = React.useState(0)

  React.useEffect(() => {
    if (role !== "superadmin") return

    const poll = async () => {
      try {
        const data = await getRequest<RiderLocation[]>(
          `${BASE_URL}/superadmin/getliveLocationTrack/dashboard`
        )
        setActiveRiderCount(data.filter((r) => r.active).length)
      } catch {
        // badge is non-critical — silently ignore errors
      }
    }

    poll()
    const id = setInterval(poll, POLL_MS)
    return () => clearInterval(id)
  }, [role])

  const navMain = React.useMemo(() => {
    switch (role) {
      case "superadmin": return SUPER_ADMIN_SIDEBAR_ROUTES(activeRiderCount) // ← count passed here
      case "admin":      return ADMIN_SIDEBAR_ROUTES()
      case "ops":        return OPS_SIDEBAR_ROUTES()
      case "fulfill":    return FULFILL_SIDEBAR_ROUTES()
      case "finance":    return FINANCE_SIDEBAR_ROUTES()
      case "company":    return MACHINES_SIDEBAR_ROUTES(state.user?.first_name ?? "User")
      default:           return []
    }
  }, [role, state.user?.first_name, activeRiderCount])

  const userData = {
    name:   state.user?.first_name ?? "User",
    email:  state.user?.email ?? "user@davaam.pk",
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