"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconTrendingUp,
  IconUser,
  IconCreditCard,
  IconPhone,
  IconWallet,
  IconCalendar,
  IconDevices,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import type { ColumnFiltersState, ColumnDef, Row, SortingState, VisibilityState } from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { getRequest } from "@/Apis/Api"

// Updated schema for mobile users
export const mobileUserSchema = z.object({
  id: z.number(),
  card_number: z.number().nullable(),
  name: z.string(),
  mobile_number: z.string(),
  balance: z.number(),
  created_at: z.string(),
  tokens: z.array(
    z.object({
      device_id: z.string(),
      type: z.string(),
    }),
  ),
})

// API response type
type MobileUserApiResponse = {
  users: z.infer<typeof mobileUserSchema>[]
  currentPage: number
  totalPages: number
  totalUsers: number
  limit: number
}

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

const columns: ColumnDef<z.infer<typeof mobileUserSchema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />
    },
    enableHiding: false,
  },
  {
    accessorKey: "mobile_number",
    header: "Mobile Number",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <IconPhone className="size-4 text-muted-foreground" />
        <span className="font-mono">{row.original.mobile_number}</span>
      </div>
    ),
  },
  {
    accessorKey: "card_number",
    header: "Card Number",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <IconCreditCard className="size-4 text-muted-foreground" />
        <span className="font-mono">
          {row.original.card_number || <span className="text-muted-foreground italic">No card</span>}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "balance",
    header: "Balance",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <IconWallet className="size-4 text-muted-foreground" />
        <Badge variant={row.original.balance > 0 ? "default" : "secondary"} className="font-mono">
          {row.original.balance.toLocaleString()}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "tokens",
    header: "Devices",
    cell: ({ row }) => {
      const tokens = row.original.tokens
      const deviceCount = tokens.length
      const deviceTypes = [...new Set(tokens.map((token) => token.type))]

      if (deviceCount === 0) {
        return (
          <div className="flex items-center gap-2">
            <IconDevices className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground italic text-sm">No devices</span>
          </div>
        )
      }

      return (
        <div className="flex items-center gap-2">
          <IconDevices className="size-4 text-muted-foreground" />
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              {deviceTypes.map((type, index) => (
                <Badge key={index} variant="secondary" className="text-xs capitalize">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <IconCalendar className="size-4 text-muted-foreground" />
        <span className="text-sm">{new Date(row.original.created_at).toLocaleDateString()}</span>
      </div>
    ),
  },
]

function DraggableRow({ row }: { row: Row<z.infer<typeof mobileUserSchema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
      ))}
    </TableRow>
  )
}

export function AdminMobileUsersDataTable() {
  const [data, setData] = React.useState<z.infer<typeof mobileUserSchema>[]>([])
  const [loading, setLoading] = React.useState(true)
  const [apiPagination, setApiPagination] = React.useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10,
  })
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const sortableId = React.useId()
  const sensors = useSensors(useSensor(MouseSensor, {}), useSensor(TouchSensor, {}), useSensor(KeyboardSensor, {}))
  const dataIds = React.useMemo<UniqueIdentifier[]>(() => data?.map(({ id }) => id) || [], [data])

  // API call function
  const fetchMobileUsers = async (page = 1, limit = 10) => {
    try {
      setLoading(true)
      const res = await getRequest<MobileUserApiResponse>(`/admin/mobileAppUsers?page=${page}&limit=${limit}`)
      console.log(res)
      setData(res.users)
      setApiPagination({
        currentPage: res.currentPage,
        totalPages: res.totalPages,
        totalUsers: res.totalUsers,
        limit: res.limit,
      })
    } catch (err) {
      console.error("Error fetching mobile users:", err)
      toast.error("Failed to fetch mobile users")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchMobileUsers(pagination.pageIndex + 1, pagination.pageSize)
  }, [pagination.pageIndex, pagination.pageSize])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    pageCount: apiPagination.totalPages,
    manualPagination: true,
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconLoader className="size-6 animate-spin" />
        <span className="ml-2">Loading mobile users...</span>
      </div>
    )
  }

  return (
    <Tabs defaultValue="users" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Mobile Users</h2>
          <Badge variant="secondary">{apiPagination.totalUsers} total users</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMobileUsers(pagination.pageIndex + 1, pagination.pageSize)}
          >
            <IconLoader className="size-4 mr-2" />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id.replace("_", " ")}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <TabsContent value="users" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No mobile users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>

        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of {apiPagination.totalUsers} user(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {apiPagination.currentPage} of {apiPagination.totalPages}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex bg-transparent"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8 bg-transparent"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8 bg-transparent"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex bg-transparent"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

const chartData = [
  { month: "January", users: 186, active: 80 },
  { month: "February", users: 305, active: 200 },
  { month: "March", users: 237, active: 120 },
  { month: "April", users: 173, active: 190 },
  { month: "May", users: 209, active: 130 },
  { month: "June", users: 214, active: 140 },
]

const chartConfig = {
  users: {
    label: "Total Users",
    color: "var(--primary)",
  },
  active: {
    label: "Active Users",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function TableCellViewer({ item }: { item: z.infer<typeof mobileUserSchema> }) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          <div className="flex items-center gap-2">
            <IconUser className="size-4" />
            {item.name}
          </div>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.name}</DrawerTitle>
          <DrawerDescription>Mobile user details and activity overview</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Area
                    dataKey="active"
                    type="natural"
                    fill="var(--color-active)"
                    fillOpacity={0.6}
                    stroke="var(--color-active)"
                    stackId="a"
                  />
                  <Area
                    dataKey="users"
                    type="natural"
                    fill="var(--color-users)"
                    fillOpacity={0.4}
                    stroke="var(--color-users)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  User activity trending up by 5.2% this month <IconTrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Showing user activity for the last 6 months. Balance: {item.balance.toLocaleString()}
                </div>
              </div>
              <Separator />
            </>
          )}
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">User ID</Label>
                <div className="font-mono text-sm">{item.id}</div>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Card Number</Label>
                <div className="font-mono text-sm">{item.card_number || "Not assigned"}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Mobile Number</Label>
                <div className="font-mono text-sm">{item.mobile_number}</div>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Balance</Label>
                <div className="font-mono text-sm font-bold">{item.balance.toLocaleString()}</div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Created At</Label>
              <div className="text-sm">{new Date(item.created_at).toLocaleString()}</div>
            </div>

            {/* Device Information Section */}
            <Separator />
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <IconDevices className="size-4" />
                Registered Devices ({item.tokens.length})
              </Label>
              {item.tokens.length > 0 ? (
                <div className="space-y-2">
                  {item.tokens.map((token, index) => {
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                        <IconDevices className="size-5 text-muted-foreground" />
                        <div className="flex-1">
                          <Badge variant="outline" className="capitalize">
                            {token.type}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">No devices registered</div>
              )}
            </div>
          </div>
        </div>
        <DrawerFooter>
          <Button>Edit User</Button>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default AdminMobileUsersDataTable
