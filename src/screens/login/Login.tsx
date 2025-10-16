import React from 'react'
import { GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from '@/components/login-form'
import DLLogo from "../../assets/DL.png"
import sec2 from "../../assets/secimg.jpeg"
import gif from "../../assets/gif.mp4" // Your animation file

const Login = () => {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left Section: Form */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex items-center justify-center rounded-md">
              <img src={DLLogo} alt="DL Logo" className="w-20" />
            </div>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>

      {/* Right Section: Background with GIF */}
      <div className="bg-muted relative hidden lg:block">
        {/* Optional: If you want to overlay the GIF on top of an image */}
        <img
          src={sec2}
          alt="demoImg"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
        <video
          src={gif}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  )
}

export default Login
