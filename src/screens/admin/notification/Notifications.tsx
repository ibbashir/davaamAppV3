"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IconBell, IconSend, IconUsers, IconMail, IconCalendar, IconCheck } from "@tabler/icons-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRequest, postRequest } from "@/Apis/Api";
import { SiteHeader } from "@/components/admin/site-header";
import Reactselect from "react-select";
import loader from "../../../assets/infinite-spinner.svg"

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
];

// Types

type UserWithFcmAndToken = {
    mobile_number: string;
    name: string;
};

type OptionType = {
    value: string;
    label: string;
    data: UserWithFcmAndToken;
};

type ApiRes = {
    status: number;
    message: string;
    data: {
        usersWithFcmAndToken: UserWithFcmAndToken[];
    };
};

type FormValues = {
    title: string;
    body: string;
    multiNumber: OptionType[];
};

const Notifications = () => {
    const [userList, setUserList] = useState<UserWithFcmAndToken[]>([]);

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
    });

    const loadingUsers = async () => {
        const res = await getRequest<ApiRes>("/admin/getPhoneNumberWithFcm");
        setUserList(res.data.usersWithFcmAndToken);
    };

    useEffect(() => {
        loadingUsers();

        if (isSubmitSuccessful) {
            reset()
        }
    }, [isSubmitSuccessful, reset]);

    const onSubmit = (data: FormValues) => {
        // console.log(data);
        const payload = data.multiNumber.map((e) => e.data.mobile_number)

        const postData = async () => {
            try {
                const res = await postRequest("/admin/sentMultiNotification", {
                    multiNumber: payload,
                    title: data.title,
                    body: data.body,
                })
            } catch (error) {
                console.log(error);
            }
        }

        postData()
    };

    const selectAllUsers = () => {
        const allOptions: OptionType[] = userList.map((user) => ({
            value: user.mobile_number,
            label: `${user.name} (${user.mobile_number})`,
            data: user,
        }))
        setValue("multiNumber", allOptions)
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
                                            <Input {...register("title", { required: { value: true, message: "Title Required" } })} placeholder="Enter notification title" />
                                            {errors.title && <span className="text-sm text-red-700">{errors.title.message}</span>}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                {" "}
                                                {/* Improved UI for Select All button */}
                                                <Label htmlFor="notification-type">Select Users</Label>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="bg-teal-600 hover:bg-teal-700  text-white"
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
                                            <Textarea {...register("body", { required: { value: true, message: "Message Required" } })} placeholder="Enter your notification message..." rows={4} />
                                            {errors.body && <span className="text-sm text-red-700">{errors.body.message}</span>}
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700">
                                                <IconSend className="mr-2 h-4 w-4" />   {isSubmitting ? <img src={loader} alt="" className="w-7" /> : "Send Now"}
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
                                                    {notification.status === "Sent" && <IconCheck className="mr-1 h-3 w-3" />} {notification.status}
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
    );
};

export default Notifications;
