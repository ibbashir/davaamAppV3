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
      console.log(role);
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
              className="ml-auto text-sm underline-offset-4 hover:underline cursor-pointer"
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
        <div className="text-right">
          <span onClick={() => { navigate("/privacypolicy") }} className="bg-background underline text-black cursor-pointer text-[10px] relative z-10 px-2">
            Privacy Policy
          </span>
        </div>
      </div>
      <div className=" text-sm">
        ©2023 Davaam Life. All Rights Reserved. {" "}
        <span onClick={() => { navigate("/company-info") }} className="underline text-[10px] text-black cursor-pointer">Company Info</span>
      </div>
    </form>
  )
}
