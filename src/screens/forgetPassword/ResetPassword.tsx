"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Eye, EyeOff, Lock, User } from "lucide-react"
import loader from "../../assets/infinite-spinner.svg"
import { useNavigate, useSearchParams } from 'react-router-dom'
import { putRequest } from "@/Apis/Api"

// JWT payload interface
interface JwtPayload {
  userId: number
  email: string
  type: string
  iat?: number
  exp?: number
}

const ResetPassword = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error" | null; text: string }>({ type: null, text: "" })
    const [decodedToken, setDecodedToken] = useState<JwtPayload | null>(null)
    const [tokenError, setTokenError] = useState("")
    
    // State for password reset phase
    const [passwords, setPasswords] = useState({
        password: "",
        confirmPassword: ""
    })
    const [passwordErrors, setPasswordErrors] = useState({
        password: "",
        confirmPassword: ""
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // Decode JWT token on component mount
    useEffect(() => {
        if (token) {
            decodeJwtToken(token)
        }
    }, [token])

    // Function to decode JWT token without verification (frontend only)
    const decodeJwtToken = (token: string) => {
        try {
            // JWT token has 3 parts: header.payload.signature
            const base64Url = token.split('.')[1]
            if (!base64Url) {
                throw new Error("Invalid token format")
            }

            // Convert base64url to base64
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            
            // Decode base64 string
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            )

            const payload: JwtPayload = JSON.parse(jsonPayload)
            
            // Check if token is expired
            if (payload.exp && Date.now() >= payload.exp * 1000) {
                setTokenError("Reset link has expired. Please request a new one.")
                return
            }

            // Check if it's a password reset token
            if (payload.type !== 'password_reset') {
                setTokenError("Invalid reset token type")
                return
            }

            setDecodedToken(payload)
        } catch (error) {
            console.error("Token decoding error:", error)
            setTokenError("Invalid reset token. Please request a new password reset link.")
        }
    }

    const validatePassword = (password: string) => {
        if (password.length < 8) {
            return "Password must be at least 8 characters long"
        }
        if (!/(?=.*[a-z])/.test(password)) {
            return "Password must contain at least one lowercase letter"
        }
        if (!/(?=.*[A-Z])/.test(password)) {
            return "Password must contain at least one uppercase letter"
        }
        if (!/(?=.*\d)/.test(password)) {
            return "Password must contain at least one number"
        }
        if (!/(?=.*[@$!%*?&])/.test(password)) {
            return "Password must contain at least one special character (@$!%*?&)"
        }
        return ""
    }

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setPasswordErrors({ password: "", confirmPassword: "" })
        setMessage({ type: null, text: "" })

        const passwordError = validatePassword(passwords.password)
        let confirmPasswordError = ""

        if (!passwords.confirmPassword) {
            confirmPasswordError = "Please confirm your password"
        } else if (passwords.password !== passwords.confirmPassword) {
            confirmPasswordError = "Passwords do not match"
        }

        if (passwordError || confirmPasswordError) {
            setPasswordErrors({
                password: passwordError,
                confirmPassword: confirmPasswordError
            })
            return
        }

        setIsLoading(true)
        try {
            await resetPassword(passwords.password)
        } catch (error) {
            // Error is already handled in resetPassword function
            console.error("Password reset error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleBackToLogin = () => {
        navigate('/')
    }

    const handlePasswordChange = (field: keyof typeof passwords, value: string) => {
        setPasswords(prev => ({
            ...prev,
            [field]: value
        }))
        // Clear error when user starts typing
        if (passwordErrors[field as keyof typeof passwordErrors]) {
            setPasswordErrors(prev => ({
                ...prev,
                [field]: ""
            }))
        }
    }

    const resetPassword = async (newPassword: string) => {
        try {
            // Send the raw token to the backend so it can verify the JWT
            // signature server-side. Never trust client-side-only validation.
            await putRequest('/auth/reset', {
                token,
                password: newPassword,
            })
            
            setMessage({
                type: "success",
                text: "Your password has been reset successfully! Redirecting to login...",
            })
            
            setTimeout(() => {
                navigate('/')
            }, 2000)
        } catch (error: any) {
            const errorMessage = error.message || "Failed to reset password. The link may have expired. Please request a new one."
            setMessage({
                type: "error",
                text: errorMessage,
            })
            throw error
        }
    }

    // Show loading while decoding token
    if (token && !decodedToken && !tokenError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-4">
                <div className="w-full max-w-md text-center">
                    <img src={loader} alt="Loading..." className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-gray-600">Verifying reset link...</p>
                </div>
            </div>
        )
    }

    // Show error if token is invalid
    if (tokenError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-4">
                <div className="w-full max-w-md">
                    <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                        <CardHeader className="space-y-1 pb-8">
                            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full">
                                <AlertCircle className="w-8 h-8 text-white" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-red-900 to-red-600 bg-clip-text text-transparent">
                                Invalid Reset Link
                            </CardTitle>
                            <CardDescription className="text-center text-gray-600 leading-relaxed">
                                {tokenError}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Alert className="border-l-4 border-red-500 bg-red-50 text-red-800">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="font-medium">
                                    Please request a new password reset link.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-4">
                                <Button
                                    onClick={() => navigate('/forgot-password')}
                                    className="w-full h-12 bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-700 hover:to-teal-700 text-white font-medium transition-all duration-200"
                                >
                                    <Mail className="mr-2 h-4 w-4" />
                                    Request New Reset Link
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={handleBackToLogin}
                                    className="w-full text-gray-600 hover:text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to login
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Show password reset form if token is valid
    if (decodedToken) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-4">
                <div className="w-full max-w-md">
                    <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                        <CardHeader className="space-y-1 pb-8">
                            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full">
                                <Lock className="w-8 h-8 text-white" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-teal-900 to-teal-600 bg-clip-text text-transparent">
                                Set New Password
                            </CardTitle>
                            <CardDescription className="text-center text-gray-600 leading-relaxed">
                                Create a strong, new password for your account.
                            </CardDescription>
                            
                            {/* User information from decoded token */}
                            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mt-4">
                                <div className="flex items-center justify-center space-x-2 text-sm text-teal-800">
                                    <User className="h-4 w-4" />
                                    <span>Reset password for: <strong>{decodedToken.email}</strong></span>
                                </div>
                            </div>
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

                            <form onSubmit={handlePasswordReset} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                        New Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your new password"
                                            value={passwords.password}
                                            onChange={(e) => handlePasswordChange('password', e.target.value)}
                                            className={`pl-10 pr-10 h-12 transition-all duration-200 ${passwordErrors.password
                                                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                                : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                                                }`}
                                            disabled={isLoading}
                                        />
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            disabled={isLoading}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {passwordErrors.password && (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {passwordErrors.password}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                                        Confirm New Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm your new password"
                                            value={passwords.confirmPassword}
                                            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                            className={`pl-10 pr-10 h-12 transition-all duration-200 ${passwordErrors.confirmPassword
                                                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                                : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                                                }`}
                                            disabled={isLoading}
                                        />
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            disabled={isLoading}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {passwordErrors.confirmPassword && (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {passwordErrors.confirmPassword}
                                        </p>
                                    )}
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</h4>
                                    <ul className="text-xs text-blue-700 space-y-1">
                                        <li>• At least 8 characters long</li>
                                        <li>• One uppercase letter</li>
                                        <li>• One lowercase letter</li>
                                        <li>• One number</li>
                                        <li>• One special character (@$!%*?&)</li>
                                    </ul>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-700 hover:to-teal-700 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <img src={loader} alt="Loading..." className="w-7" />
                                            Resetting password...
                                        </>
                                    ) : (
                                        "Reset Password"
                                    )}
                                </Button>
                            </form>

                            <div className="pt-4 border-t border-gray-200">
                                <Button
                                    variant="ghost"
                                    onClick={handleBackToLogin}
                                    className="w-full text-gray-600 hover:text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                                    disabled={isLoading}
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to login
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-4">
            <div className="w-full max-w-md">
                <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="space-y-1 pb-8">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full">
                            <AlertCircle className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-red-900 to-red-600 bg-clip-text text-transparent">
                            Invalid Reset Link
                        </CardTitle>
                        <CardDescription className="text-center text-gray-600 leading-relaxed">
                            This password reset link is invalid or has expired.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Alert className="border-l-4 border-red-500 bg-red-50 text-red-800">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="font-medium">
                                Please request a new password reset link from the login page.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-4">
                            <Button
                                onClick={() => navigate('/forgot-password')}
                                className="w-full h-12 bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-700 hover:to-teal-700 text-white font-medium transition-all duration-200"
                            >
                                <Mail className="mr-2 h-4 w-4" />
                                Request New Reset Link
                            </Button>

                            <Button
                                variant="ghost"
                                onClick={handleBackToLogin}
                                className="w-full text-gray-600 hover:text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to login
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default ResetPassword