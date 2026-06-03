import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useEffect, useState } from "react"
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm({ className }: React.ComponentProps<"form">) {
  const { state, login } = useAuth()
  const { user, loading } = state
  const navigate = useNavigate()
  const [loginError, setLoginError] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      const role = user.user_role.toLowerCase().replace(/\s/g, "")
      navigate(`/${role}/dashboard`, { replace: true })
    }
  }, [loading, user, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    setLoginError("")
    try {
      const role = await login(data.email, data.password)
      navigate(`/${role}/dashboard`, { replace: true })
    } catch {
      setLoginError("Invalid email or password. Please try again.")
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      {/* Heading */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Sign in to your Davaam dashboard
        </p>
      </div>

      <div className="grid gap-5">
        {/* Email */}
        <div className="grid gap-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="flex items-center gap-1 text-red-500 text-xs font-medium" role="alert">
              <AlertCircle className="size-3 shrink-0" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={() => navigate("/forgetPassword")}
              className="text-xs text-teal-600 hover:text-teal-700 underline-offset-4 hover:underline transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="pr-10"
              aria-describedby={errors.password ? "password-error" : undefined}
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="flex items-center gap-1 text-red-500 text-xs font-medium" role="alert">
              <AlertCircle className="size-3 shrink-0" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Server error */}
        {loginError && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2.5" role="alert">
            <AlertCircle className="size-4 shrink-0 text-red-500" />
            <p className="text-red-600 text-sm font-medium">{loginError}</p>
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium h-10"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </div>

      {/* Footer links */}
      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground pt-2">
        <span>© 2026 Davaam Life</span>
        <span>·</span>
        <button
          type="button"
          onClick={() => navigate("/privacypolicy")}
          className="text-teal-600 hover:text-teal-700 hover:underline underline-offset-4 transition-colors"
        >
          Privacy Policy
        </button>
        <span>·</span>
        <button
          type="button"
          onClick={() => navigate("/company-info")}
          className="text-teal-600 hover:text-teal-700 hover:underline underline-offset-4 transition-colors"
        >
          Company Info
        </button>
      </div>
    </form>
  )
}
