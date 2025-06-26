"use client"
import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useNavigate } from 'react-router-dom';

const ForgetPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error" | null; text: string }>({ type: null, text: "" })
    const [emailError, setEmailError] = useState("")

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setEmailError("")
        setMessage({ type: null, text: "" })

        if (!email) {
            setEmailError("Email address is required")
            return
        }

        if (!validateEmail(email)) {
            setEmailError("Please enter a valid email address")
            return
        }

        setIsLoading(true)

        // Simulate API call
        try {
            await new Promise((resolve) => setTimeout(resolve, 2000))
            setMessage({
                type: "success",
                text: "Password reset link has been sent to your email address. Please check your inbox and spam folder.",
            })
            setEmail("")
        } catch (error) {
            setMessage({
                type: "error",
                text: "Failed to send reset email. Please try again later.",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleBackToLogin = () => {
        navigate('/');
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-4">
            <div className="w-full max-w-md">
                <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="space-y-1 pb-8">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full">
                            <Mail className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-teal-900 to-teal-600 bg-clip-text text-transparent">
                            Forgot your password?
                        </CardTitle>
                        <CardDescription className="text-center text-gray-600 leading-relaxed">
                            No worries! Enter your email address and we'll send you a secure link to reset your password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {message.type && (
                            <Alert
                                className={`border-l-4 ${message.type === "success"
                                    ? "border-green-500 bg-green-50 text-green-800"
                                    : "border-red-500 bg-red-50 text-red-800"
                                    }`}
                            >
                                {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                <AlertDescription className="font-medium">{message.text}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                    Email address
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email address"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value)
                                            if (emailError) setEmailError("")
                                        }}
                                        className={`pl-10 h-12 transition-all duration-200 ${emailError
                                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                            : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                                            }`}
                                        disabled={isLoading}
                                    />
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                </div>
                                {emailError && (
                                    <p className="text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {emailError}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-700 hover:to-teal-700 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending reset link...
                                    </>
                                ) : (
                                    "Send reset link"
                                )}
                            </Button>
                        </form>

                        <div className="pt-4 border-t border-gray-200">
                            <Button
                                variant="ghost"
                                onClick={handleBackToLogin}
                                className="w-full text-gray-600 hover:text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to login
                            </Button>
                        </div>

                        <div className="text-center">
                            <p className="text-xs text-gray-500">
                                Didn't receive the email? Check your spam folder or{" "}
                                <button
                                    type="button"
                                    className="text-teal-600 hover:text-teal-800 underline font-medium"
                                    onClick={() => handleSubmit(new Event("submit") as any)}
                                    disabled={isLoading}
                                >
                                    try again
                                </button>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default ForgetPassword
