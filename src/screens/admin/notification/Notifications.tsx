"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { IconBell, IconSend, IconUsers, IconMail, IconDeviceMobile, IconCalendar, IconCheck } from "@tabler/icons-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { SiteHeader } from "@/components/admin/site-header"

const recentNotifications = [
    {
        id: 1,
        title: "System Maintenance Alert",
        message: "Scheduled maintenance on Sunday 2AM-4AM",
        type: "System",
        recipients: 156,
        status: "Sent",
        sentAt: "2 hours ago",
    },
    {
        id: 2,
        title: "New Product Launch",
        message: "Introducing new healthy snack options",
        type: "Marketing",
        recipients: 1234,
        status: "Sent",
        sentAt: "1 day ago",
    },
    {
        id: 3,
        title: "Payment Reminder",
        message: "Monthly subscription payment due",
        type: "Billing",
        recipients: 89,
        status: "Scheduled",
        sentAt: "Tomorrow 9AM",
    },
]

const Notifications = () => {
    const [notificationTitle, setNotificationTitle] = useState("")
    const [notificationMessage, setNotificationMessage] = useState("")
    const [selectedAudience, setSelectedAudience] = useState("")
    const [notificationType, setNotificationType] = useState("")
    const [sendViaEmail, setSendViaEmail] = useState(true)
    const [sendViaPush, setSendViaPush] = useState(true)

    return (
        <div>
            <SiteHeader title="Notifications" />
            <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        {/* <h1 className="text-2xl font-bold tracking-tight">Send Notifications</h1> */}
                        <p className="text-muted-foreground">Create and send notifications to users</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                            <IconBell className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">1,479</div>
                            <p className="text-xs text-muted-foreground">This month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                            <IconUsers className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">1,234</div>
                            <p className="text-xs text-muted-foreground">Available recipients</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                            <IconMail className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">68.5%</div>
                            <p className="text-xs text-muted-foreground">Email open rate</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                            <IconCalendar className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">3</div>
                            <p className="text-xs text-muted-foreground">Pending notifications</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="compose" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="compose">Compose</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="compose" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Create New Notification</CardTitle>
                                <CardDescription>Compose and send notifications to your users</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="notification-title">Notification Title</Label>
                                        <Input
                                            id="notification-title"
                                            value={notificationTitle}
                                            onChange={(e) => setNotificationTitle(e.target.value)}
                                            placeholder="Enter notification title"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="notification-type">Type</Label>
                                        <Select value={notificationType} onValueChange={setNotificationType}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select notification type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="system">System Alert</SelectItem>
                                                <SelectItem value="marketing">Marketing</SelectItem>
                                                <SelectItem value="billing">Billing</SelectItem>
                                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                                <SelectItem value="promotion">Promotion</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notification-message">Message</Label>
                                    <Textarea
                                        id="notification-message"
                                        value={notificationMessage}
                                        onChange={(e) => setNotificationMessage(e.target.value)}
                                        placeholder="Enter your notification message..."
                                        rows={4}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="audience">Target Audience</Label>
                                    <Select value={selectedAudience} onValueChange={setSelectedAudience}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select target audience" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Users (1,234)</SelectItem>
                                            <SelectItem value="active">Active Users (987)</SelectItem>
                                            <SelectItem value="managers">Managers (45)</SelectItem>
                                            <SelectItem value="operators">Operators (156)</SelectItem>
                                            <SelectItem value="corporate">Corporate Clients (67)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-4">
                                    <Label>Delivery Method</Label>
                                    <div className="flex items-center space-x-6">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="email"
                                                checked={sendViaEmail}
                                                onCheckedChange={(checked) => setSendViaEmail(checked === true)}
                                            />
                                            <Label htmlFor="email" className="flex items-center gap-2">
                                                <IconMail className="h-4 w-4" />
                                                Email
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="push"
                                                checked={sendViaPush}
                                                onCheckedChange={(checked) => setSendViaPush(checked === true)}
                                            />
                                            <Label htmlFor="push" className="flex items-center gap-2">
                                                <IconDeviceMobile className="h-4 w-4" />
                                                Push Notification
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button className="bg-teal-600 hover:bg-teal-700">
                                        <IconSend className="mr-2 h-4 w-4" />
                                        Send Now
                                    </Button>
                                    <Button variant="outline">
                                        <IconCalendar className="mr-2 h-4 w-4" />
                                        Schedule
                                    </Button>
                                    <Button variant="outline">Preview</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification History</CardTitle>
                                <CardDescription>View previously sent notifications</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentNotifications.map((notification) => (
                                        <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-teal-100 rounded-full">
                                                    <IconBell className="h-4 w-4 text-teal-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium">{notification.title}</h4>
                                                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <Badge variant="outline">{notification.type}</Badge>
                                                        <span className="text-xs text-muted-foreground">{notification.recipients} recipients</span>
                                                        <span className="text-xs text-muted-foreground">{notification.sentAt}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={notification.status === "Sent" ? "default" : "secondary"}>
                                                    {notification.status === "Sent" && <IconCheck className="mr-1 h-3 w-3" />}
                                                    {notification.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

export default Notifications
