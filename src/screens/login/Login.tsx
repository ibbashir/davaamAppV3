import { LoginForm } from "@/components/login-form"
import DLLogo from "../../assets/DL.png"
import sec2 from "../../assets/secimg.jpeg"
import gif from "../../assets/gif.mp4"

const Login = () => (
  <div className="grid min-h-svh lg:grid-cols-2">
    {/* Left — form panel */}
    <div className="flex flex-col gap-4 p-6 md:p-10">
      <div className="flex justify-center md:justify-start">
        <div className="flex items-center gap-2">
          <img src={DLLogo} alt="Davaam Life" className="w-20" />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-xs">
          <LoginForm />
        </div>
      </div>
    </div>

    {/* Right — brand visual (desktop only) */}
    <div className="bg-muted relative hidden lg:block overflow-hidden">
      <img
        src={sec2}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <video
        src={gif}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Subtle gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900/30 to-black/20" />
    </div>
  </div>
)

export default Login
