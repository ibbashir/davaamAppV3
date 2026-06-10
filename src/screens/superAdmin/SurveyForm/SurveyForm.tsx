import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SiteHeader } from "@/components/superAdmin/site-header"
import { getRequest } from "@/Apis/Api"
import {
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
    IconSearch,
    IconUser,
    IconClock,
    IconPhone,
    IconLoader2,
    IconClipboardList,
} from "@tabler/icons-react"
import moment from "moment"

type SurveyResponse = {
    id: number
    name: string
    phone: string
    age_group: string
    answers: string[]
    recommended_product: string
    scores: Record<string, number>
    created_at: string
}

type SurveyResponsesApiResponse = {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    data: SurveyResponse[]
}

const SurveyForm = () => {
    const [responses, setResponses] = useState<SurveyResponse[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchResponses = async () => {
            setLoading(true)
            try {
                const params = new URLSearchParams()
                params.append("page", currentPage.toString())
                params.append("limit", itemsPerPage.toString())
                if (searchTerm) params.append("search", searchTerm)

                const res = await getRequest<SurveyResponsesApiResponse>(
                    `/superadmin/survey/responses?${params.toString()}`
                )
                setResponses(res.data)
                setTotalCount(res.totalCount)
                setTotalPages(res.totalPages)
            } catch (error) {
                console.error("Failed to fetch survey responses:", error)
                setResponses([])
                setTotalCount(0)
                setTotalPages(1)
            } finally {
                setLoading(false)
            }
        }
        fetchResponses()
    }, [currentPage, itemsPerPage, searchTerm])

    const topScore = (scores: Record<string, number>) => {
        const entries = Object.entries(scores)
        if (!entries.length) return null
        return entries.reduce((best, curr) => (curr[1] > best[1] ? curr : best))
    }

    return (
        <div>
            <SiteHeader title="Survey Forms" />
            <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">
                        Survey responses submitted through the Butterfly application
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconClipboardList className="h-4 w-4 text-teal-600" />
                        <span>{totalCount} total responses</span>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div>
                            <CardTitle>Survey Responses</CardTitle>
                            <CardDescription>All survey submissions from Butterfly users</CardDescription>
                        </div>
                        <div className="relative pt-2">
                            <IconSearch className="absolute left-3 top-1/2 translate-y-[2px] h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or phone..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className="pl-10"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-2xl border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-teal-600 hover:bg-teal-700">
                                        <TableHead className="text-center font-semibold text-white border-none">Name</TableHead>
                                        <TableHead className="text-center font-semibold text-white border-none">Phone</TableHead>
                                        <TableHead className="text-center font-semibold text-white border-none">Age Group</TableHead>
                                        <TableHead className="text-center font-semibold text-white border-none">Answers</TableHead>
                                        <TableHead className="text-center font-semibold text-white border-none">Recommended Product</TableHead>
                                        <TableHead className="text-center font-semibold text-white border-none">Top Score</TableHead>
                                        <TableHead className="text-center font-semibold text-white border-none">Submitted</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12">
                                                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                                    <IconLoader2 className="h-5 w-5 animate-spin" />
                                                    <span>Loading responses...</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : responses.length > 0 ? (
                                        responses.map((response) => {
                                            const best = topScore(response.scores)
                                            return (
                                                <TableRow key={response.id} className="hover:bg-muted/50">
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <IconUser className="h-3 w-3 text-muted-foreground shrink-0" />
                                                            {response.name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <IconPhone className="h-3 w-3 text-muted-foreground shrink-0" />
                                                            <span className="font-mono">{response.phone}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                                            {response.age_group}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px]">
                                                        <div className="flex flex-wrap gap-1">
                                                            {response.answers.map((ans, i) => (
                                                                <Badge key={i} variant="outline" className="text-xs bg-muted">
                                                                    {ans}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge className="bg-teal-600 hover:bg-teal-700 text-white">
                                                            {response.recommended_product}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {best ? (
                                                            <span className="text-sm font-medium">
                                                                {best[0]}{" "}
                                                                <span className="text-muted-foreground font-normal">({best[1]})</span>
                                                            </span>
                                                        ) : "—"}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <IconClock className="h-3 w-3 shrink-0" />
                                                            {moment(response.created_at).format("MMM D, YYYY h:mm A")}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No survey responses found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {totalCount > 0 && (
                            <div className="flex items-center justify-between px-4 mt-4">
                                <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                                    Showing {responses.length} of {totalCount} responses
                                </div>
                                <div className="flex w-full items-center gap-8 lg:w-fit">
                                    <div className="hidden items-center gap-2 lg:flex">
                                        <Label className="text-sm font-medium">Rows per page</Label>
                                        <Select
                                            value={`${itemsPerPage}`}
                                            onValueChange={(v) => {
                                                setItemsPerPage(Number(v))
                                                setCurrentPage(1)
                                            }}
                                        >
                                            <SelectTrigger size="sm" className="w-20">
                                                <SelectValue placeholder={itemsPerPage} />
                                            </SelectTrigger>
                                            <SelectContent side="top">
                                                {[5, 10, 20, 50, 100].map((s) => (
                                                    <SelectItem key={s} value={`${s}`}>{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex w-fit items-center justify-center text-sm font-medium">
                                        Page {currentPage} of {totalPages}
                                    </div>
                                    <div className="ml-auto flex items-center gap-2 lg:ml-0">
                                        <Button
                                            variant="outline"
                                            className="hidden h-8 w-8 p-0 lg:flex bg-transparent"
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                        >
                                            <span className="sr-only">Go to first page</span>
                                            <IconChevronsLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="size-8 bg-transparent"
                                            size="icon"
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <span className="sr-only">Previous page</span>
                                            <IconChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="size-8 bg-transparent"
                                            size="icon"
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <span className="sr-only">Next page</span>
                                            <IconChevronRight className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="hidden size-8 lg:flex bg-transparent"
                                            size="icon"
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                        >
                                            <span className="sr-only">Go to last page</span>
                                            <IconChevronsRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default SurveyForm
