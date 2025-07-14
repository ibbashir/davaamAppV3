import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import type { SubmitHandler } from "react-hook-form"
import loader from "../assets/infinite-spinner.svg"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"

type Inputs = {
  email: string,
  password: string,
};

export function LoginForm({

  className,
}: React.ComponentProps<"form">) {

  const { login, state } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState<string>("")


  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<Inputs>()

  useEffect(() => {
    reset();
  }, [isSubmitSuccessful])

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      const role = await login(data.email, data.password);
      navigate(`/${role}/dashboard`)
    } catch (err: any) {
      setLoginError("Invalid email or password")
    }
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email below to login to your account
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input type="email" placeholder="example@domain.com" {...register("email", { required: true })} />
          {errors.email && <span className="text-red-500 text-xs font-semibold">Email is Required</span>}
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a onClick={() => { navigate("/forgetPassword") }}
              className="ml-auto text-xs underline-offset-4 cursor-default text-teal-600 hover:text-teal-700"
            >
              Forgot your password?
            </a>
          </div>
          <Input type="password" placeholder="Password" {...register("password", { required: true })} />
          {errors.password && <span className="text-red-500 text-xs font-semibold">Password is Required</span>}
        </div>
        {loginError && (
          <p className="text-center text-red-500 text-sm font-semibold">
            {loginError}
          </p>
        )}
        <Button disabled={isSubmitting} type="submit" className="w-full cursor-pointer">
          {isSubmitting ? <img src={loader} alt="" className="w-7" /> : "Log In"}
        </Button>
        <div className="flex items-center justify-center pt-4">
          <div className="h-px bg-gray-200 flex-1"></div>
          <button
            type="button"
            onClick={() => navigate("/privacypolicy")}
            className="px-4 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            Privacy Policy
          </button>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>
      </div>

      <div className="text-center pt-2 border-gray-100">
        <p className="text-sm text-gray-500">
          ©2023 Davaam Life. All Rights Reserved.{" "}
          <button
            type="button"
            onClick={() => navigate("/company-info")}
            className="text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            Company Info
          </button>
        </p>
      </div>
    </form>
  )
}
