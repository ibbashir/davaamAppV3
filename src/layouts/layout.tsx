import React from 'react'
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
// import { ChatbotWidget } from '@/components/chatbot-widget'

export default function Layout() {
  const { state } = useAuth()
  const isSuperAdmin = state.user?.user_role.toLowerCase().replace(/\s/g, "") === "superadmin"

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
      {/* {isSuperAdmin && <ChatbotWidget />} */}
    </SidebarProvider>
  )
}
