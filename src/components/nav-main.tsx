import * as React from "react"
import { type Icon } from "@tabler/icons-react"
import { IconChevronRight } from "@tabler/icons-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useNavigate, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

export interface NavItem {
  title: string
  url: string
  icon?: Icon
  badge?: React.ReactNode  // ← new: optional badge slot
  /**
   * Highlight only on an exact path match. Needed for section landing pages
   * whose URL is a prefix of their siblings' (e.g. "/self-service" vs
   * "/self-service/attendance"), which would otherwise stay lit on every child.
   */
  exact?: boolean
  /**
   * Nested pages. A parent with children collapses into a single sidebar row
   * that expands in place, so a whole section (e.g. Self Service) costs one
   * slot instead of one per page.
   */
  items?: NavItem[]
}

/** Strips a ":param" tail so a detail route still lights its list entry. */
const baseOf = (url: string) => url.split("/:")[0]

function matches(pathname: string, item: NavItem): boolean {
  const base = baseOf(item.url)
  if (pathname === base) return true
  // Require a "/" boundary so "/hr/leave" can't match "/hr/leaves-something"
  return !item.exact && base !== "/" && pathname.startsWith(`${base}/`)
}

/** True when the item itself or any of its children is the current page. */
function isBranchActive(pathname: string, item: NavItem): boolean {
  if (matches(pathname, item)) return true
  return (item.items ?? []).some((child) => matches(pathname, child))
}

export function NavMain({ items }: { items: NavItem[] }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { state, isMobile, setOpen } = useSidebar()

  // Which collapsible sections the user has opened by hand. A section
  // containing the current page is always shown expanded regardless.
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({})

  const toggle = (title: string) =>
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }))

  const iconOnly = state === "collapsed" && !isMobile

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-1">
        <SidebarMenu>
          {items.map((item) => {
            const hasChildren = !!item.items?.length
            const branchActive = isBranchActive(location.pathname, item)

            // ── Leaf entry ──────────────────────────────────────────────────
            if (!hasChildren) {
              const isActive = matches(location.pathname, item)
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
                    <span className="truncate flex-1">{item.title}</span>

                    {/* Badge — e.g. live rider count pill */}
                    {item.badge && (
                      <span className="ml-auto shrink-0">{item.badge}</span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }

            // ── Section with nested pages ───────────────────────────────────
            const expanded = openSections[item.title] ?? branchActive

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  aria-expanded={expanded}
                  onClick={() => {
                    // Collapsed to icons: there's nowhere to expand into, so
                    // reopen the sidebar and jump to the section landing page.
                    if (iconOnly) {
                      setOpen(true)
                      setOpenSections((prev) => ({ ...prev, [item.title]: true }))
                      navigate(item.url)
                      return
                    }
                    toggle(item.title)
                  }}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm font-medium",
                    branchActive && !expanded
                      ? "bg-teal-600 text-white hover:bg-teal-700"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  {item.icon && (
                    <item.icon
                      className={cn(
                        "size-[18px] shrink-0",
                        branchActive && !expanded ? "text-white" : "text-muted-foreground",
                      )}
                    />
                  )}
                  <span className="truncate flex-1">{item.title}</span>
                  <IconChevronRight
                    className={cn(
                      "ml-auto size-4 shrink-0 transition-transform duration-200",
                      expanded && "rotate-90",
                      branchActive && !expanded ? "text-white" : "text-muted-foreground",
                    )}
                  />
                </SidebarMenuButton>

                {expanded && (
                  <SidebarMenuSub>
                    {item.items!.map((child) => {
                      const childActive = matches(location.pathname, child)
                      return (
                        <SidebarMenuSubItem key={child.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={childActive}
                            className={cn(
                              "cursor-pointer",
                              childActive &&
                                "bg-teal-600 text-white hover:bg-teal-700 hover:text-white data-[active=true]:bg-teal-600 data-[active=true]:text-white",
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => navigate(child.url)}
                              aria-current={childActive ? "page" : undefined}
                            >
                              {child.icon && (
                                <child.icon
                                  className={cn(
                                    "size-4 shrink-0",
                                    childActive ? "text-white" : "text-muted-foreground",
                                  )}
                                />
                              )}
                              <span className="truncate">{child.title}</span>
                              {child.badge && (
                                <span className="ml-auto shrink-0">{child.badge}</span>
                              )}
                            </button>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
