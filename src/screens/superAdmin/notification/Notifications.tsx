"use client"
import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    IconBell,
    IconSend,
    IconUsers,
    IconMail,
    IconCalendar,
    IconCheck,
    IconChevronLeft,
    IconChevronRight,
    IconClock,
    IconUser,
} from "@tabler/icons-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getRequest, postRequest } from "@/Apis/Api"
import { SiteHeader } from "@/components/superAdmin/site-header"
import Reactselect from "react-select"
import loader from "../../../assets/infinite-spinner.svg"

type RecentNotificationData = {
    id: number
    created_at: string
    epoch_time: number
    notificationLength: string
}

type RecentApiResponse = {
    status: number
    message: string
    page: number
    limit: number
    data: RecentNotificationData[]
}

type UserWithFcmAndToken = {
    mobile_number: string
    name: string
}

type OptionType = {
    value: string
    label: string
    data: UserWithFcmAndToken
}

type ApiRes = {
    status: number
    message: string
    data: {
        usersWithFcmAndToken: UserWithFcmAndToken[]
    }
}

type FormValues = {
    title: string
    body: string
    multiNumber: OptionType[]
}

const Notifications = () => {
    const [userList, setUserList] = useState<UserWithFcmAndToken[]>([])
    const [recentNotifs, setRecentNotifs] = useState<RecentNotificationData[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    const limit = 10

    const {
        register,
        handleSubmit,
        control,
        reset,
        setValue,
        formState: { errors, isSubmitSuccessful, isSubmitting },
    } = useForm<FormValues>({
        defaultValues: {
            title: "",
            body: "",
            multiNumber: [],
        },
    })

    const loadingUsers = async () => {
        const res = await getRequest<ApiRes>("/superadmin/getPhoneNumberWithFcm")
        setUserList(res.data.usersWithFcmAndToken)
    }

    const getNotificationHistory = async (page = 1) => {
        setIsLoadingHistory(true)
        try {
            const res = await getRequest<RecentApiResponse>(`/superadmin/getAllNotifications?page=${page}&limit=${limit}`)
            setRecentNotifs(res.data)
            setCurrentPage(res.page)
            setTotalPages(Math.ceil(res.data.length / limit) || 1)
        } catch (error) {
            console.error("Error fetching notification history:", error)
        } finally {
            setIsLoadingHistory(false)
        }
        
     console.log(recentNotifs)
    }
    useEffect(() => {
        loadingUsers()
        getNotificationHistory()
        if (isSubmitSuccessful) {
            reset()
        }
    }, [isSubmitSuccessful, reset])

    const onSubmit = (data: FormValues) => {
        const payload = data.multiNumber.map((e) => e.data.mobile_number)
        const postData = async () => {
            try {
                const res = await postRequest("/superadmin/sentMultiNotification", {
                    multiNumber: payload,
                    title: data.title,
                    body: data.body,
                })
                // Refresh history after sending notification
                getNotificationHistory(currentPage)
            } catch (error) {
                console.log(error)
            }
        }
        postData()
    }

    const selectAllUsers = () => {
        const allOptions: OptionType[] = userList.map((user) => ({
            value: user.mobile_number,
            label: `${user.name} (${user.mobile_number})`,
            data: user,
        }))
        setValue("multiNumber", allOptions)
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
            getNotificationHistory(page)
        }
    }

    const getPageNumbers = () => {
        const pages = []
        const maxVisiblePages = 5

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i)
                }
                pages.push("...")
                pages.push(totalPages)
            } else if (currentPage >= totalPages - 2) {
                pages.push(1)
                pages.push("...")
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i)
                }
            } else {
                pages.push(1)
                pages.push("...")
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i)
                }
                pages.push("...")
                pages.push(totalPages)
            }
        }

        return pages
    }

    return (
        <div>
            <SiteHeader title="Notifications" />
            <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
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
                        <form onSubmit={handleSubmit(onSubmit)}>
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
                                                {...register("title", { required: { value: true, message: "Title Required" } })}
                                                placeholder="Enter notification title"
                                            />
                                            {errors.title && <span className="text-sm text-red-700">{errors.title.message}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="notification-type">Select Users</Label>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="bg-teal-600 hover:bg-teal-700 text-white"
                                                    onClick={selectAllUsers}
                                                >
                                                    Select All
                                                </Button>
                                            </div>
                                            <Controller
                                                name="multiNumber"
                                                control={control}
                                                render={({ field }) => (
                                                    <Reactselect
                                                        isMulti
                                                        options={userList.map((user) => ({
                                                            value: user.mobile_number,
                                                            label: `${user.name} (${user.mobile_number})`,
                                                            data: user,
                                                        }))}
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="Search and select users..."
                                                        className="max-h"
                                                    />
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="notification-message">Message</Label>
                                            <Textarea
                                                {...register("body", { required: { value: true, message: "Message Required" } })}
                                                placeholder="Enter your notification message..."
                                                rows={4}
                                            />
                                            {errors.body && <span className="text-sm text-red-700">{errors.body.message}</span>}
                                        </div>
                                        <div className="flex gap-4 pt-4">
                                            <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700">
                                                <IconSend className="mr-2 h-4 w-4" />
                                                {isSubmitting ? <img src={loader || "/placeholder.svg"} alt="" className="w-7" /> : "Send Now"}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Notification History</CardTitle>
                                        <CardDescription>View previously sent notifications</CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => getNotificationHistory(currentPage)}
                                        disabled={isLoadingHistory}
                                    >
                                        {isLoadingHistory ? "Refreshing..." : "Refresh"}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoadingHistory ? (
                                    <div className="flex items-center justify-center py-8">
                                        <img src={loader || "/placeholder.svg"} alt="Loading..." className="w-8 h-8" />
                                        <span className="ml-2">Loading notifications...</span>
                                    </div>
                                ) : recentNotifs.length === 0 ? (
                                    <div className="text-center py-8">
                                        <IconBell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium text-muted-foreground mb-2">No notifications found</h3>
                                        <p className="text-sm text-muted-foreground">Start by sending your first notification!</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-4">
                                            {recentNotifs.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-2 bg-teal-100 rounded-full mt-1">
                                                            <IconBell className="h-4 w-4 text-teal-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h4 className="font-medium">Notification #{notification.id}</h4>
                                                                <Badge variant="secondary" className="text-xs">
                                                                    <IconCheck className="mr-1 h-3 w-3" />
                                                                    Sent
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                                <div className="flex items-center gap-1">
                                                                    <IconUser className="h-3 w-3" />
                                                                    <span>
                                                                        {notification.notificationLength} recipient
                                                                        {Number.parseInt(notification.notificationLength) !== 1 ? "s" : ""}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <IconClock className="h-3 w-3" />
                                                                    <span>{formatDate(notification.created_at)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-medium text-muted-foreground">ID: {notification.id}</div>
                                                        <div className="text-xs text-muted-foreground mt-1">Epoch: {notification.epoch_time}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                                <div className="text-sm text-muted-foreground">
                                                    Page {currentPage} of {totalPages}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handlePageChange(currentPage - 1)}
                                                        disabled={currentPage === 1 || isLoadingHistory}
                                                    >
                                                        <IconChevronLeft className="h-4 w-4" />
                                                        Previous
                                                    </Button>

                                                    <div className="flex items-center gap-1">
                                                        {getPageNumbers().map((page, index) => (
                                                            <Button
                                                                key={index}
                                                                variant={page === currentPage ? "default" : "outline"}
                                                                size="sm"
                                                                className="w-8 h-8 p-0"
                                                                onClick={() => typeof page === "number" && handlePageChange(page)}
                                                                disabled={typeof page !== "number" || isLoadingHistory}
                                                            >
                                                                {page}
                                                            </Button>
                                                        ))}
                                                    </div>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handlePageChange(currentPage + 1)}
                                                        disabled={currentPage === totalPages || isLoadingHistory}
                                                    >
                                                        Next
                                                        <IconChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

export default Notifications
