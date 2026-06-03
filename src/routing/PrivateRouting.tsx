import { useAuth } from "@/contexts/AuthContext"
import { Navigate, Outlet } from "react-router-dom"

interface Props {
  allowedRoles: string[]
}

/** Full-page skeleton shown while the session cookie is being validated. */
const AuthLoadingScreen = () => (
  <div
    className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background"
    aria-label="Loading"
    aria-busy="true"
  >
    <div className="flex flex-col items-center gap-3">
      {/* Animated teal ring */}
      <div className="h-10 w-10 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin" />
      <p className="text-sm text-muted-foreground">Verifying session…</p>
    </div>
  </div>
)

const PrivateRouting = ({ allowedRoles }: Props) => {
  const { state } = useAuth()
  const { user, loading, role } = state

  if (loading) return <AuthLoadingScreen />
  if (!user)   return <Navigate to="/login" replace />

  if (!allowedRoles.includes(role ?? "")) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet context={{ user }} />
}

export default PrivateRouting
