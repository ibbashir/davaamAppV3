"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconArrowLeft, IconQuote, IconBuilding, IconUsers, IconGlobe, IconTrendingUp } from "@tabler/icons-react"
import { useNavigate } from "react-router-dom"

const stats = [
    { label: "Founded", value: "2021", icon: IconBuilding, color: "text-blue-600" },
    { label: "Employees", value: "15", icon: IconUsers, color: "text-green-600" },
    { label: "Countries", value: "01", icon: IconGlobe, color: "text-purple-600" },
    { label: "Raised", value: "PKR 25M", icon: IconTrendingUp, color: "text-teal-600" },
]

export default function CompanyInfo() {
    const navigate = useNavigate();
    const handleBackToSignIn = () => {
        navigate("/login")
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12 lg:py-20">
                <div className="mx-auto grid max-w-2xl grid-cols-1 items-center gap-x-12 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-2">
                    {/* Left Side - Enhanced Testimonial Card */}
                    <div className="lg:pr-4">
                        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 border-0 shadow-2xl rounded-3xl max-w-lg mx-auto">
                            {/* Background Image with Overlay */}
                            <div className="absolute inset-0">
                                <img
                                    className="h-full w-full object-cover opacity-30"
                                    src="https://images.unsplash.com/photo-1630569267625-157f8f9d1a7e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2669&q=80"
                                    alt="Background"
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-teal-900/80" />
                            </div>

                            {/* Decorative Elements */}
                            <div className="absolute top-6 right-6">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                                    <IconQuote className="w-8 h-8 text-white/90" />
                                </div>
                            </div>

                            {/* Gradient Orb */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-teal-400/30 to-blue-500/30 rounded-full blur-2xl" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />

                            <CardContent className="relative p-8 lg:p-10 text-white min-h-[400px] flex flex-col justify-center">
                                <div className="space-y-8">
                                    <blockquote className="text-xl lg:text-2xl leading-relaxed font-medium text-white/95">
                                        "Amet amet eget scelerisque tellus sit neque faucibus non eleifend. Integer eu praesent at a. Ornare
                                        arcu gravida natoque erat et cursus tortor."
                                    </blockquote>

                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                                            <span className="text-white font-bold text-xl">JR</span>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-lg text-white">Judith Rogers</div>
                                            <div className="text-white/70">CEO at Workcation</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side - Content */}
                    <div className="space-y-8">
                        {/* Header Section */}
                        <div className="space-y-6">
                            <Button
                                variant="ghost"
                                onClick={handleBackToSignIn}
                                className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 p-0 h-auto font-semibold group transition-all duration-200"
                            >
                                <IconArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform duration-200" />
                                Sign in
                            </Button>

                            <div>
                                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
                                    DAVAAM PRIVACY POLICY
                                </h1>
                                <div className="mt-4">
                                    <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 px-3 py-1">
                                        Last updated: January 2024
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="space-y-6 text-slate-600 leading-relaxed max-w-2xl">
                            <Card className="border-l-4 border-l-teal-500 bg-gradient-to-r from-teal-50/80 to-transparent border-teal-100 shadow-sm">
                                <CardContent className="p-6">
                                    <p className="text-slate-700 font-medium">
                                        Davaam Pvt Ltd built the Davaam app as a Free app. This SERVICE is provided by Davaam Pvt Ltd at no
                                        cost and is intended for use as is.
                                    </p>
                                </CardContent>
                            </Card>

                            <div className="space-y-6 text-base lg:text-lg">
                                <p>
                                    This privacy policy outlines the information that our app collects, how it is used, and the steps we
                                    take to protect it. Our goal is to be transparent about the data we collect and to give you control
                                    over your personal information. If you choose to use our Service, then you agree to the collection and
                                    use of information in relation to this policy.
                                </p>

                                <p>
                                    The terms used in this Privacy Policy have the same meanings as in our Terms and Conditions, which are
                                    accessible at Davaam unless otherwise defined in this Privacy Policy.
                                </p>
                            </div>
                        </div>

                        {/* Stats Section */}
                        <div className="pt-8 border-t border-slate-200">
                            <h3 className="text-xl font-semibold text-slate-900 mb-6">Company Overview</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {stats.map((stat, index) => {
                                    const IconComponent = stat.icon
                                    return (
                                        <Card
                                            key={index}
                                            className="group border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
                                        >
                                            <CardContent className="p-6 text-center">
                                                <div className="flex items-center justify-center mb-3">
                                                    <div className="w-12 h-12 bg-slate-100 group-hover:bg-teal-50 rounded-full flex items-center justify-center transition-colors duration-300">
                                                        <IconComponent
                                                            className={`w-6 h-6 ${stat.color} group-hover:scale-110 transition-transform duration-300`}
                                                        />
                                                    </div>
                                                </div>
                                                <dt className="text-sm font-medium text-slate-600 uppercase tracking-wide mb-2">
                                                    {stat.label}
                                                </dt>
                                                <dd className="text-2xl lg:text-3xl font-bold text-slate-900 group-hover:text-teal-700 transition-colors duration-300">
                                                    {stat.value}
                                                </dd>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>

                        {/* CTA Section */}
                        <Card className="bg-gradient-to-r from-teal-50 via-blue-50 to-slate-50 border-teal-200 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <IconBuilding className="w-6 h-6 text-teal-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-900 mb-2">Questions about this policy?</h3>
                                        <p className="text-slate-600 text-sm mb-4">
                                            If you have any questions or concerns about our privacy policy, please don't hesitate to contact
                                            us.
                                        </p>
                                        <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
                                            Contact Support
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
