import { type Icon } from "@tabler/icons-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useNavigate, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  url: string
  icon?: Icon
}

export function NavMain({ items }: { items: NavItem[] }) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-1">
        <SidebarMenu>
          {items.map((item) => {
            // Exact match OR child path match (e.g. machine-details/:id under /superadmin/machines)
            const isActive =
              location.pathname === item.url ||
              (item.url !== "/" &&
                location.pathname.startsWith(item.url.split("/:")[0]))

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  onClick={() => navigate(item.url)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm font-medium",
                    isActive
                      ? "bg-teal-600 text-white hover:bg-teal-700"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  {item.icon && (
                    <item.icon
                      className={cn(
                        "size-[18px] shrink-0",
                        isActive ? "text-white" : "text-muted-foreground",
                      )}
                    />
                  )}
                  <span className="truncate">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
