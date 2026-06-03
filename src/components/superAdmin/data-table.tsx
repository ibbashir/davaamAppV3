import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { z } from "zod"
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCreditCard,
  IconDevices,
  IconLoader,
  IconPhone,
  IconSearch,
  IconUser,
  IconWallet,
  IconX,
} from "@tabler/icons-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getRequest } from "@/Apis/Api"
import { formatDateTime } from "@/utils/formatters"

export const mobileUserSchema = z.object({
  id: z.number(),
  card_number: z.number().nullable(),
  name: z.string(),
  mobile_number: z.string(),
  balance: z.number(),
  created_at: z.string(),
  tokens: z
    .array(z.object({ device_id: z.string(), type: z.string() }))
    .optional()
    .default([]),
})

type MobileUser = z.infer<typeof mobileUserSchema>

type MobileUserApiResponse = {
  users: MobileUser[]
  currentPage: number
  totalPages: number
  totalUsers: number
  limit: number
}

const columns: ColumnDef<MobileUser>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <TableCellViewer item={row.original} />,
    enableHiding: false,
  },
  {
    accessorKey: "mobile_number",
    header: "Mobile",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <IconPhone className="size-4 shrink-0 text-teal-600" />
        <span className="font-mono text-sm">{row.original.mobile_number}</span>
      </div>
    ),
  },
  {
    accessorKey: "card_number",
    header: "Card",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <IconCreditCard className="size-4 shrink-0 text-teal-600" />
        <span className="font-mono text-sm">
          {row.original.card_number ?? (
            <span className="italic text-muted-foreground">None</span>
          )}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "balance",
    header: "Balance",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <IconWallet className="size-4 shrink-0 text-teal-600" />
        <Badge
          variant={row.original.balance > 0 ? "default" : "secondary"}
          className="font-mono text-xs"
        >
          ₨ {row.original.balance.toLocaleString()}
        </Badge>
      </div>
    ),
  },
  {
    id: "device_ids",
    header: "Device IDs",
    cell: ({ row }) => {
      const ids = [...new Set((row.original.tokens ?? []).map((t) => t.device_id))]
      if (ids.length === 0)
        return <span className="italic text-sm text-muted-foreground">—</span>
      return (
        <div className="flex flex-wrap gap-1">
          {ids.map((id, i) => (
            <Badge key={i} variant="secondary" className="text-xs capitalize">
              {id}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    id: "device_types",
    header: "Device Types",
    cell: ({ row }) => {
      const types = [...new Set((row.original.tokens ?? []).map((t) => t.type))]
      if (types.length === 0)
        return <span className="italic text-sm text-muted-foreground">—</span>
      return (
        <div className="flex flex-wrap gap-1">
          {types.map((type, i) => (
            <Badge key={i} variant="outline" className="text-xs capitalize">
              {type}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <IconCalendar className="size-4 shrink-0 text-teal-600" />
        <span className="text-sm tabular-nums">
          {formatDateTime(row.original.created_at)}
        </span>
      </div>
    ),
  },
]

/** Card rendered per-user on screens narrower than sm (< 640 px) */
function MobileUserCard({ item }: { item: MobileUser }) {
  const tokens = item.tokens ?? []
  const deviceTypes = [...new Set(tokens.map((t) => t.type))]
  const deviceIds = [...new Set(tokens.map((t) => t.device_id))]

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <TableCellViewer item={item} />
        <span className="font-mono text-xs text-muted-foreground">#{item.id}</span>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Mobile
          </p>
          <div className="flex items-center gap-1.5">
            <IconPhone className="size-3.5 shrink-0 text-teal-600" />
            <span className="font-mono text-xs">{item.mobile_number}</span>
          </div>
        </div>

        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Card
          </p>
          <div className="flex items-center gap-1.5">
            <IconCreditCard className="size-3.5 shrink-0 text-teal-600" />
            <span className="font-mono text-xs">
              {item.card_number ?? (
                <span className="italic text-muted-foreground">None</span>
              )}
            </span>
          </div>
        </div>

        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Balance
          </p>
          <div className="flex items-center gap-1.5">
            <IconWallet className="size-3.5 shrink-0 text-teal-600" />
            <Badge
              variant={item.balance > 0 ? "default" : "secondary"}
              className="font-mono text-xs"
            >
              ₨ {item.balance.toLocaleString()}
            </Badge>
          </div>
        </div>

        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Devices
          </p>
          <div className="flex flex-wrap items-center gap-1">
            <IconDevices className="size-3.5 shrink-0 text-teal-600" />
            {deviceTypes.length > 0 ? (
              deviceTypes.map((t, i) => (
                <Badge key={i} variant="secondary" className="text-xs capitalize">
                  {t}
                </Badge>
              ))
            ) : (
              <span className="italic text-xs text-muted-foreground">None</span>
            )}
          </div>
        </div>
      </div>

      {deviceIds.length > 0 && (
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Device IDs
          </p>
          <div className="flex flex-wrap gap-1">
            {deviceIds.map((id, i) => (
              <Badge key={i} variant="outline" className="font-mono text-xs">
                {id}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Registered
        </p>
        <div className="flex items-center gap-1.5">
          <IconCalendar className="size-3.5 shrink-0 text-teal-600" />
          <span className="text-xs tabular-nums">{formatDateTime(item.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-8" />
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-2.5 w-12" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-4 w-44" />
      </div>
    </div>
  )
}

export function SuperAdminMobileUsersDataTable() {
  const isMobile = useIsMobile()
  const [data, setData] = React.useState<MobileUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [apiPagination, setApiPagination] = React.useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 5,
  })
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  
  // Set different page sizes based on device
  const defaultPageSize = isMobile ? 5 : 10
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: defaultPageSize,
  })
  
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isSearching, setIsSearching] = React.useState(false)

  const normalizeUserData = (
    users: (Omit<MobileUser, "tokens"> & {
      tokens?: { device_id: string; type: string }[]
    })[],
  ): MobileUser[] => users.map((u) => ({ ...u, tokens: u.tokens ?? [] }))

  const fetchMobileUsers = async (page = 1, limit = 5) => {
    try {
      setLoading(true)
      const res = await getRequest<MobileUserApiResponse>(
        `/superadmin/mobileAppUsers?page=${page}&limit=${limit}`,
      )
      setData(normalizeUserData(res.users))
      setApiPagination({
        currentPage: res.currentPage,
        totalPages: res.totalPages,
        totalUsers: res.totalUsers,
        limit: res.limit,
      })
    } catch (err) {
      console.error("Error fetching mobile users:", err)
      toast.error("Failed to fetch mobile users")
      setData([])
      setApiPagination({ currentPage: 1, totalPages: 1, totalUsers: 0, limit: 5 })
    } finally {
      setLoading(false)
    }
  }

  const searchMobileUsers = async (searchQuery: string, page = 1) => {
    if (!searchQuery.trim()) {
      setIsSearching(false)
      fetchMobileUsers(page, pagination.pageSize)
      return
    }
    try {
      setLoading(true)
      setIsSearching(true)
      const res = await getRequest<MobileUserApiResponse>(
        `/superadmin/searchAllMobileAppUsers/search/${searchQuery}?page=${page}`,
      )
      setData(normalizeUserData(res.users))
      setApiPagination({
        currentPage: res.currentPage,
        totalPages: res.totalPages,
        totalUsers: res.totalUsers,
        limit: res.limit,
      })
    } catch (err) {
      console.error("Error searching mobile users:", err)
      toast.error("Failed to search mobile users")
      setData([])
      setApiPagination({ currentPage: 1, totalPages: 1, totalUsers: 0, limit: 5 })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    if (searchTerm.trim()) {
      searchMobileUsers(searchTerm, 1)
    } else {
      setIsSearching(false)
      fetchMobileUsers(1, pagination.pageSize)
    }
  }

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    if (!value.trim()) {
      setIsSearching(false)
      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
      fetchMobileUsers(1, pagination.pageSize)
    }
  }

  const clearSearch = () => {
    setSearchTerm("")
    setIsSearching(false)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    fetchMobileUsers(1, pagination.pageSize)
  }

  // Update page size when device changes
  React.useEffect(() => {
    const newPageSize = isMobile ? 5 : 10
    setPagination((prev) => ({
      ...prev,
      pageSize: newPageSize,
      pageIndex: 0, // Reset to first page when changing page size
    }))
  }, [isMobile])

  React.useEffect(() => {
    if (isSearching && searchTerm.trim()) {
      searchMobileUsers(searchTerm, pagination.pageIndex + 1)
    } else {
      fetchMobileUsers(pagination.pageIndex + 1, pagination.pageSize)
    }
  }, [pagination.pageIndex, pagination.pageSize])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, columnFilters, pagination },
    pageCount: apiPagination.totalPages,
    manualPagination: true,
    getRowId: (row) => row.id.toString(),
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

  // Page size options based on device
  const pageSizeOptions = isMobile ? [5, 10, 20] : [10, 20, 30, 40, 50]

  return (
    <div className="flex flex-col gap-4 px-3 sm:px-4 md:px-6">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="relative">
        <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground text-teal-600" />
        <Input
          placeholder="Search by name, mobile number, or card number"
          value={searchTerm}
          onChange={handleSearchInputChange}
          className="pl-9 pr-9"
        />
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
          >
            <IconX className="size-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </form>

      {/* Mobile: vertical card list — hidden on sm and up */}
      <div className="flex flex-col gap-3 sm:hidden">
        {loading ? (
          Array.from({ length: pagination.pageSize }).map((_, i) => <CardSkeleton key={i} />)
        ) : data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {isSearching
              ? `No results for "${searchTerm}"`
              : "No mobile users found."}
          </p>
        ) : (
          data.map((item) => <MobileUserCard key={item.id} item={item} />)
        )}
      </div>

      {/* Desktop: standard table — hidden on mobile */}
      <div className="hidden overflow-hidden rounded-lg border sm:block">
        <Table>
          <TableHeader className="bg-teal-600">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className="font-semibold text-white"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    <IconLoader className="size-4 animate-spin" />
                    {isSearching ? "Searching…" : "Loading…"}
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {isSearching
                    ? `No results for "${searchTerm}"`
                    : "No mobile users found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination — works for both mobile cards and desktop table */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 sm:justify-start sm:gap-6">
          <p className="text-sm text-muted-foreground tabular-nums">
            {apiPagination.totalUsers.toLocaleString()} total users
            {isSearching && (
              <span className="ml-1 italic">— "{searchTerm}"</span>
            )}
          </p>

          <div className="flex items-center gap-2">
            <Label
              htmlFor="rows-per-page"
              className="text-sm font-medium whitespace-nowrap"
            >
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(v) => {
                table.setPageSize(Number(v))
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
            >
              <SelectTrigger size="sm" className="w-16" id="rows-per-page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((ps) => (
                  <SelectItem key={ps} value={`${ps}`}>
                    {ps}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8 border-teal-200 hover:bg-teal-50 hover:border-teal-300"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage() || loading}
          >
            <span className="sr-only">First page</span>
            <IconChevronsLeft className="size-4 text-teal-600" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 border-teal-200 hover:bg-teal-50 hover:border-teal-300"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || loading}
          >
            <span className="sr-only">Previous page</span>
            <IconChevronLeft className="size-4 text-teal-600" />
          </Button>
          <span className="px-2 text-sm font-medium tabular-nums">
            {apiPagination.currentPage} / {apiPagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-8 border-teal-200 hover:bg-teal-50 hover:border-teal-300"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || loading}
          >
            <span className="sr-only">Next page</span>
            <IconChevronRight className="size-4 text-teal-600" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 border-teal-200 hover:bg-teal-50 hover:border-teal-300"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage() || loading}
          >
            <span className="sr-only">Last page</span>
            <IconChevronsRight className="size-4 text-teal-600" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function TableCellViewer({ item }: { item: MobileUser }) {
  const isMobile = useIsMobile()
  const tokens = item.tokens ?? []

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button
          variant="link"
          className="w-fit px-0 text-left font-medium text-foreground"
        >
          <div className="flex items-center gap-2">
            <IconUser className="size-4 shrink-0 text-teal-600" />
            {item.name}
          </div>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.name}</DrawerTitle>
          <DrawerDescription>Mobile user details</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                User ID
              </Label>
              <span className="font-mono text-sm">{item.id}</span>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Card Number
              </Label>
              <span className="font-mono text-sm">
                {item.card_number ?? "Not assigned"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Mobile
              </Label>
              <span className="font-mono text-sm">{item.mobile_number}</span>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Balance
              </Label>
              <span className="font-mono text-sm font-bold">
                ₨ {item.balance.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Registered
            </Label>
            <span className="text-sm tabular-nums">
              {formatDateTime(item.created_at)}
            </span>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <IconDevices className="size-4" />
              Devices ({tokens.length})
            </Label>
            {tokens.length > 0 ? (
              <div className="space-y-2">
                {tokens.map((token, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3"
                  >
                    <IconDevices className="size-5 text-muted-foreground" />
                    <div className="flex-1 space-y-0.5">
                      <Badge variant="outline" className="text-xs capitalize">
                        {token.type}
                      </Badge>
                      <p className="font-mono text-xs text-muted-foreground">
                        {token.device_id}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="italic text-sm text-muted-foreground">
                No devices registered
              </p>
            )}
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

export default SuperAdminMobileUsersDataTable