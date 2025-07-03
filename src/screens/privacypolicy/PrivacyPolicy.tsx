"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    IconShield,
    IconDatabase,
    IconCamera,
    IconLock,
    IconShare,
    IconExternalLink,
    IconUsers,
    IconRefresh,
    IconMail,
    IconList,
    IconArrowUp,
    IconEye,
    IconMapPin,
} from "@tabler/icons-react"

const sections = [
    { id: "collection", title: "Information Collection", icon: IconDatabase },
    { id: "log-data", title: "Log Data", icon: IconEye },
    { id: "camera", title: "Camera Use", icon: IconCamera },
    { id: "security", title: "Data Security", icon: IconLock },
    { id: "sharing", title: "Sharing Information", icon: IconShare },
    { id: "links", title: "External Links", icon: IconExternalLink },
    { id: "children", title: "Children's Privacy", icon: IconUsers },
    { id: "changes", title: "Policy Changes", icon: IconRefresh },
    { id: "contact", title: "Contact Us", icon: IconMail },
]

export default function PrivacyPolicy() {
    const [activeSection, setActiveSection] = useState("")

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId)
        if (element) {
            element.scrollIntoView({ behavior: "smooth" })
            setActiveSection(sectionId)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
            <div className="container mx-auto px-4 py-8 lg:px-8 max-w-6xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full mb-6">
                        <IconShield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-4 tracking-tight">DAVAAM PRIVACY POLICY</h1>
                    <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 px-4 py-2 text-sm">
                        Effective Date: December 31, 2023
                    </Badge>
                </div>

                <div className="grid gap-8 lg:grid-cols-4 lg:gap-12">
                    {/* Table of Contents - Sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-8 border-slate-200 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <IconList className="w-5 h-5 text-teal-600" />
                                    Contents
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {sections.map((section) => {
                                    const IconComponent = section.icon
                                    return (
                                        <Button
                                            key={section.id}
                                            variant="ghost"
                                            onClick={() => scrollToSection(section.id)}
                                            className={`w-full justify-start text-left h-auto py-3 px-3 ${activeSection === section.id
                                                ? "bg-teal-50 text-teal-700 border-l-2 border-l-teal-500"
                                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                                }`}
                                        >
                                            <IconComponent className="w-4 h-4 mr-3 flex-shrink-0" />
                                            <span className="text-sm">{section.title}</span>
                                        </Button>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Introduction */}
                        <Card className="border-l-4 border-l-teal-500 bg-gradient-to-r from-teal-50/80 to-transparent border-teal-100">
                            <CardContent className="p-6 space-y-4">
                                <p className="text-lg font-medium text-slate-700 leading-relaxed">
                                    Davaam Pvt Ltd built the Davaam app as a Free app. This SERVICE is provided by Davaam Pvt Ltd at no
                                    cost and is intended for use as is.
                                </p>
                                <p className="text-slate-600 leading-relaxed">
                                    This privacy policy outlines the information that our app collects, how it is used, and the steps we
                                    take to protect it. Our goal is to be transparent about the data we collect and to give you control
                                    over your personal information.
                                </p>
                                <p className="text-slate-600 leading-relaxed">
                                    The terms used in this Privacy Policy have the same meanings as in our Terms and Conditions, which are
                                    accessible at Davaam unless otherwise defined in this Privacy Policy.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Information Collection and Use */}
                        <Card id="collection" className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-3 text-2xl text-slate-900">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <IconDatabase className="w-5 h-5 text-blue-600" />
                                    </div>
                                    INFORMATION COLLECTION AND USE
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-1">
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                <IconUsers className="w-4 h-4 text-green-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-2">Personal Information</h4>
                                                <p className="text-slate-600 text-sm leading-relaxed">
                                                    When you use our app, we may ask you to provide personal information such as your name, email
                                                    address, and phone number. This information is used to provide you with the services you
                                                    request and to communicate with you about your use of the app.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                <IconMapPin className="w-4 h-4 text-purple-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-2">Location Information</h4>
                                                <p className="text-slate-600 text-sm leading-relaxed">
                                                    Our app may collect information about your location to provide you with relevant content and
                                                    services. You can choose not to allow us to access your location information by adjusting your
                                                    device's settings.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                <IconEye className="w-4 h-4 text-orange-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-2">Usage Information</h4>
                                                <p className="text-slate-600 text-sm leading-relaxed">
                                                    We collect information about how you use our app, including the features you use, the pages
                                                    you visit, and the length of your sessions. This information helps us to improve the app and
                                                    provide you with a better user experience.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Log Data */}
                        <Card id="log-data" className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-3 text-2xl text-slate-900">
                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                        <IconEye className="w-5 h-5 text-red-600" />
                                    </div>
                                    LOG DATA
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-600 leading-relaxed">
                                    We want to inform you that whenever you use our Service, in a case of an error in the app we collect
                                    data and information (through third-party products) on your phone called Log Data. This Log Data may
                                    include information such as your device Internet Protocol ("IP") address, device name, operating
                                    system version, the configuration of the app when utilizing our Service, the time and date of your use
                                    of the Service, and other statistics.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Camera Use */}
                        <Card id="camera" className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-3 text-2xl text-slate-900">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <IconCamera className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    CAMERA USE FOR SCANNING
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-slate-600 leading-relaxed">
                                    Our app may use the camera feature on your device for scanning purposes, such as scanning barcodes or
                                    QR codes. This information is used to provide you with relevant content and services.
                                </p>
                                <p className="text-slate-600 leading-relaxed">
                                    We take the security of the information obtained through scanning very seriously and will store it
                                    securely on our servers. We will not share this information with third parties unless required by law
                                    or for the purpose of providing you with the services you request.
                                </p>
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-amber-800 text-sm">
                                        <strong>Note:</strong> You can choose not to allow us to access your camera by adjusting your
                                        device's settings. If you have any questions or concerns about our use of the camera feature, please
                                        contact us at{" "}
                                        <a href="mailto:info@davaam.pk" className="text-teal-600 hover:text-teal-700 underline">
                                            info@davaam.pk
                                        </a>
                                        .
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Data Security */}
                        <Card id="security" className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-3 text-2xl text-slate-900">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <IconLock className="w-5 h-5 text-green-600" />
                                    </div>
                                    DATA SECURITY
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-600 leading-relaxed">
                                    We take the security of your personal information seriously and use a variety of security measures to
                                    protect it, including encryption and secure servers. However, no method of transmission over the
                                    internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Sharing of Information */}
                        <Card id="sharing" className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-3 text-2xl text-slate-900">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                        <IconShare className="w-5 h-5 text-purple-600" />
                                    </div>
                                    SHARING OF INFORMATION
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-slate-600 leading-relaxed">
                                    We will not sell, rent, or share your personal information with third parties for their own marketing
                                    purposes without your consent.
                                </p>
                                <p className="text-slate-600 leading-relaxed">
                                    We may employ third-party companies and individuals due to the following reasons:
                                </p>
                                <div className="grid gap-2 ml-4">
                                    {[
                                        "To facilitate our Service",
                                        "To provide the Service on our behalf",
                                        "To perform Service-related services",
                                        "To assist us in analyzing how our Service is used",
                                    ].map((item, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                                            <span className="text-slate-600">{item}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-blue-800 text-sm">
                                        <strong>Important:</strong> These third parties have access to Personal Information only to perform
                                        tasks on our behalf and are obligated not to disclose or use the information for any other purpose.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Links to Other Sites */}
                        <Card id="links" className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-3 text-2xl text-slate-900">
                                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                        <IconExternalLink className="w-5 h-5 text-orange-600" />
                                    </div>
                                    LINKS TO OTHER SITES
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-600 leading-relaxed">
                                    This Service may contain links to other sites. If you click on a third-party link, you will be
                                    directed to that site. Note that these external sites are not operated by us. Therefore, we strongly
                                    advise you to review the Privacy Policy of these websites. We have no control over and assume no
                                    responsibility for the content, privacy policies, or practices of any third-party sites or services.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Children's Privacy */}
                        <Card id="children" className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-3 text-2xl text-slate-900">
                                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                                        <IconUsers className="w-5 h-5 text-pink-600" />
                                    </div>
                                    CHILDREN'S PRIVACY
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-600 leading-relaxed">
                                    These Services do not address anyone under the age of 13. We do not knowingly collect personally
                                    identifiable information from children under 13 years of age. In the case we discover that a child
                                    under 13 has provided us with personal information, we immediately delete this from our servers. If
                                    you are a parent or guardian and you are aware that your child has provided us with personal
                                    information, please contact us so that we will be able to do the necessary actions.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Changes to Privacy Policy */}
                        <Card id="changes" className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-3 text-2xl text-slate-900">
                                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                                        <IconRefresh className="w-5 h-5 text-teal-600" />
                                    </div>
                                    CHANGES TO THIS PRIVACY POLICY
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-600 leading-relaxed">
                                    We may update this privacy policy from time to time to reflect changes in our practices or for other
                                    operational, legal, or regulatory reasons. We will notify you of any changes by posting the new
                                    Privacy Policy on this page. This policy is effective as of 2023-12-31.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Contact Us */}
                        <Card id="contact" className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-3 text-2xl text-slate-900">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <IconMail className="w-5 h-5 text-blue-600" />
                                    </div>
                                    CONTACT US
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="p-6 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-lg">
                                    <p className="text-slate-700 mb-4">
                                        If you have any questions or concerns about our privacy policy or the information we collect, please
                                        don't hesitate to reach out to us.
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <IconMail className="w-5 h-5 text-teal-600" />
                                        <a href="mailto:info@davaam.pk" className="text-teal-600 hover:text-teal-700 font-medium underline">
                                            info@davaam.pk
                                        </a>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Scroll to Top Button */}
                <div className="fixed bottom-8 right-8">
                    <Button
                        onClick={scrollToTop}
                        className="w-12 h-12 rounded-full bg-teal-600 hover:bg-teal-700 shadow-lg hover:shadow-xl transition-all duration-200"
                        size="icon"
                    >
                        <IconArrowUp className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
