import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

const NotFound = () => {
  const navigate = useNavigate()
  const { state } = useAuth()
  const role = state.role

  const handleBack = () => {
    if (role) {
      navigate(`/${role}/dashboard`, { replace: true })
    } else {
      navigate("/login", { replace: true })
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      {/* Large number */}
      <p className="text-[10rem] font-black leading-none text-teal-600/10 select-none">
        404
      </p>

      <div className="-mt-10 flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 border border-teal-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-8 text-teal-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
          Check the URL or go back to your dashboard.
        </p>

        <Button
          onClick={handleBack}
          className="mt-2 bg-teal-600 hover:bg-teal-700 text-white"
        >
          {role ? "Back to Dashboard" : "Back to Login"}
        </Button>
      </div>
    </div>
  )
}

export default NotFound
