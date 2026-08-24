import * as React from "react"
import { SiteHeader } from "@/components/admin/site-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconLoader2,
  IconSearch,
  IconInbox,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  hrList,
  hrCreate,
  hrUpdate,
  hrDelete,
  errorMessage,
  statusClass,
  humanise,
  formatDate,
  formatDateTime,
  formatMoney,
  stripHiddenEmployees,
} from "./hr-api"
import type { HrRow, HrItemResponse } from "@/Types/hr"

export type FieldType =
  | "text"
  | "email"
  | "number"
  | "money"
  | "date"
  | "datetime-local"
  | "time"
  | "select"
  | "textarea"
  | "checkbox"

export interface Option {
  value: string | number
  label: string
}

export interface Field {
  name: string
  label: string
  type?: FieldType
  options?: Option[]
  /** Resolves options at render time — used for employee/department pickers. */
  optionsKey?: string
  required?: boolean
  placeholder?: string
  help?: string
  defaultValue?: string | number | boolean
  /** Keep out of the table (still editable in the form). */
  hideInTable?: boolean
  /** Keep out of the create/edit form (still shown in the table). */
  hideInForm?: boolean
  /** Only offered when creating — e.g. a one-off password for a new login. */
  createOnly?: boolean
  /** Full-width in the two-column form grid. */
  wide?: boolean
  /** Custom cell renderer; receives the whole row. */
  render?: (row: HrRow) => React.ReactNode
}

export interface FilterDef {
  name: string
  label: string
  options: Option[]
}

export interface RowAction {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  /** Hide the action for rows it doesn't apply to. */
  show?: (row: HrRow) => boolean
  onClick: (row: HrRow, reload: () => void) => void
  variant?: "default" | "outline" | "ghost" | "destructive"
}

export interface ResourceScreenProps {
  /** Page heading + the noun used in dialogs and toasts. */
  title: string
  singular: string
  /** Path under /api/dashboard/hr, e.g. "/employees". */
  endpoint: string
  fields: Field[]
  filters?: FilterDef[]
  /** Option lists shared by several fields, keyed by Field.optionsKey. */
  optionSources?: Record<string, Option[]>
  rowActions?: RowAction[]
  /** Extra controls rendered next to the "New" button. */
  toolbar?: React.ReactNode
  /** Rendered above the table — stat tiles, pipelines, etc. */
  header?: React.ReactNode
  description?: string
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
  /** Offers a "delete everything permanently" checkbox in the delete dialog. */
  allowForceDelete?: boolean
  searchPlaceholder?: string
  /** Bumping this from a parent forces a reload. */
  refreshToken?: number
  onLoaded?: (rows: HrRow[]) => void
  /**
   * Receives the raw create response, so a screen can surface anything the
   * server returned alongside the row — Employees uses it to show the login
   * credentials generated for a new joiner.
   */
  onCreated?: (response: HrItemResponse<HrRow> & Record<string, unknown>) => void
  emptyMessage?: string
  /**
   * Renders without the page header and outer padding, so several resources
   * can share one tabbed page (Payroll, Leave, Recruitment…).
   */
  embedded?: boolean
}

const PAGE_SIZE = 20

/** Renders a cell using the field's type when no custom renderer is given. */
function defaultCell(field: Field, row: HrRow): React.ReactNode {
  const value = row[field.name]

  if (field.name === "status" || field.name === "stage") {
    if (value === null || value === undefined || value === "") return "—"
    return (
      <Badge variant="outline" className={cn("font-medium", statusClass(value))}>
        {humanise(value)}
      </Badge>
    )
  }

  if (value === null || value === undefined || value === "") return "—"

  switch (field.type) {
    case "checkbox":
      return value ? "Yes" : "No"
    case "money":
      return formatMoney(value)
    case "date":
      return formatDate(value)
    case "datetime-local":
      return formatDateTime(value)
    case "select":
      return humanise(value)
    default:
      return String(value)
  }
}

export function ResourceScreen({
  title,
  singular,
  endpoint,
  fields,
  filters = [],
  optionSources = {},
  rowActions = [],
  toolbar,
  header,
  description,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  allowForceDelete = false,
  searchPlaceholder,
  refreshToken = 0,
  onLoaded,
  onCreated,
  emptyMessage,
  embedded = false,
}: ResourceScreenProps) {
  const [rows, setRows] = React.useState<HrRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [filterValues, setFilterValues] = React.useState<Record<string, string>>({})
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<HrRow | null>(null)
  const [form, setForm] = React.useState<Record<string, unknown>>({})
  const [deleteTarget, setDeleteTarget] = React.useState<HrRow | null>(null)
  const [forceDelete, setForceDelete] = React.useState(false)

  // Debounce the search box so typing doesn't fire a request per keystroke
  React.useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(id)
  }, [search])

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await hrList(endpoint, {
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        ...filterValues,
      })
      setRows(stripHiddenEmployees(res.data ?? []))
      setTotalPages(res.totalPages ?? 1)
      setTotal(res.total ?? res.data?.length ?? 0)
      onLoaded?.(res.data ?? [])
    } catch (err) {
      toast.error(errorMessage(err, `Could not load ${title.toLowerCase()}`))
      setRows([])
    } finally {
      setLoading(false)
    }
    // onLoaded is intentionally excluded — parents commonly pass an inline fn
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, page, debouncedSearch, filterValues, title, refreshToken])

  React.useEffect(() => {
    load()
  }, [load])

  const tableFields = fields.filter((f) => !f.hideInTable && !f.createOnly)
  // Create-only fields drop out of the dialog — and out of the payload — on an
  // edit. openCreate/openEdit ask for the list explicitly rather than reading
  // `editing`, which still holds the previous row while they run.
  const formFieldsFor = (isEdit: boolean) =>
    fields.filter((f) => !f.hideInForm && !(f.createOnly && isEdit))
  const formFields = formFieldsFor(!!editing)

  const openCreate = () => {
    const initial: Record<string, unknown> = {}
    formFieldsFor(false).forEach((f) => {
      initial[f.name] = f.defaultValue ?? (f.type === "checkbox" ? false : "")
    })
    setForm(initial)
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (row: HrRow) => {
    const initial: Record<string, unknown> = {}
    formFieldsFor(true).forEach((f) => {
      const value = row[f.name]
      if (f.type === "checkbox") initial[f.name] = !!value
      else if (f.type === "datetime-local" && value) {
        initial[f.name] = String(value).slice(0, 16)
      } else if (f.type === "date" && value) {
        initial[f.name] = String(value).slice(0, 10)
      } else initial[f.name] = value ?? ""
    })
    setForm(initial)
    setEditing(row)
    setDialogOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    const missing = formFields.filter(
      (f) => f.required && (form[f.name] === "" || form[f.name] === undefined || form[f.name] === null),
    )
    if (missing.length) {
      toast.error(`${missing[0].label} is required`)
      return
    }

    // Built from formFields, not from `form`, so a create-only field left over
    // in state (the dialog is reused for edits) never reaches the server.
    // Empty strings would fail integer/date columns — send null instead.
    const payload: Record<string, unknown> = {}
    formFields.forEach((f) => {
      const value = form[f.name]
      payload[f.name] = value === "" ? null : value
    })

    setSaving(true)
    try {
      if (editing) {
        await hrUpdate(endpoint, editing.id, payload)
        toast.success(`${singular} updated`)
      } else {
        const res = await hrCreate(endpoint, payload)
        toast.success(res?.message || `${singular} created`)
        onCreated?.(res as HrItemResponse<HrRow> & Record<string, unknown>)
      }
      setDialogOpen(false)
      load()
    } catch (err) {
      toast.error(errorMessage(err, `Could not save ${singular.toLowerCase()}`))
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await hrDelete(endpoint, deleteTarget.id, forceDelete)
      // The server may archive instead of deleting, and explains why — show its
      // message rather than claiming a delete that didn't happen.
      if (res?.archived) toast.info(res.message)
      else toast.success(res?.message || `${singular} deleted`)
      setDeleteTarget(null)
      setForceDelete(false)
      load()
    } catch (err) {
      toast.error(errorMessage(err, `Could not delete ${singular.toLowerCase()}`))
    }
  }

  const resolveOptions = (field: Field): Option[] => {
    if (field.optionsKey) return optionSources[field.optionsKey] ?? []
    return field.options ?? []
  }

  const showActions = canEdit || canDelete || rowActions.length > 0

  const body = (
    <>
          {description && <p className="text-sm text-muted-foreground -mb-1">{description}</p>}

          {header}

          {/* Toolbar */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder ?? `Search ${title.toLowerCase()}…`}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {filters.map((filter) => (
                <Select
                  key={filter.name}
                  value={filterValues[filter.name] ?? "all"}
                  onValueChange={(value) => {
                    setFilterValues((prev) => ({ ...prev, [filter.name]: value }))
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {filter.label}</SelectItem>
                    {filter.options.map((o) => (
                      <SelectItem key={String(o.value)} value={String(o.value)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}

              {toolbar}

              {canCreate && (
                <Button onClick={openCreate} className="bg-teal-600 hover:bg-teal-700">
                  <IconPlus className="h-4 w-4" />
                  New {singular}
                </Button>
              )}
            </div>
          </div>

          {/* Table */}
          <Card className="overflow-hidden py-0">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {tableFields.map((f) => (
                        <TableHead key={f.name} className="whitespace-nowrap">
                          {f.label}
                        </TableHead>
                      ))}
                      {showActions && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={tableFields.length + (showActions ? 1 : 0)}
                          className="h-32 text-center"
                        >
                          <IconLoader2 className="mx-auto h-5 w-5 animate-spin text-teal-600" />
                        </TableCell>
                      </TableRow>
                    ) : rows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={tableFields.length + (showActions ? 1 : 0)}
                          className="h-32 text-center text-sm text-muted-foreground"
                        >
                          <IconInbox className="mx-auto mb-2 h-6 w-6 opacity-50" />
                          {emptyMessage ?? `No ${title.toLowerCase()} yet`}
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row) => (
                        <TableRow key={row.id}>
                          {tableFields.map((f) => (
                            <TableCell key={f.name} className="whitespace-nowrap">
                              {f.render ? f.render(row) : defaultCell(f, row)}
                            </TableCell>
                          ))}
                          {showActions && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {rowActions
                                  .filter((a) => !a.show || a.show(row))
                                  .map((action) => (
                                    <Button
                                      key={action.label}
                                      size="sm"
                                      variant={action.variant ?? "outline"}
                                      onClick={() => action.onClick(row, load)}
                                      className="h-8"
                                    >
                                      {action.icon && <action.icon className="h-3.5 w-3.5" />}
                                      {action.label}
                                    </Button>
                                  ))}
                                {canEdit && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openEdit(row)}
                                    aria-label={`Edit ${singular}`}
                                    className="h-8 w-8 p-0"
                                  >
                                    <IconEdit className="h-4 w-4 text-teal-600" />
                                  </Button>
                                )}
                                {canDelete && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setDeleteTarget(row)}
                                    aria-label={`Delete ${singular}`}
                                    className="h-8 w-8 p-0"
                                  >
                                    <IconTrash className="h-4 w-4 text-red-500" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {!loading && total > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {total} record{total === 1 ? "" : "s"}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
    </>
  )

  return (
    <>
      {embedded ? (
        <div className="flex flex-col gap-4">{body}</div>
      ) : (
        <>
          <SiteHeader title={title} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-col gap-4 px-3 py-4 sm:px-4 lg:px-6 md:py-6 overflow-y-auto flex-1">
              {body}
            </div>
          </div>
        </>
      )}

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${singular}` : `New ${singular}`}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? `Update this ${singular.toLowerCase()} record.`
                : `Add a new ${singular.toLowerCase()}.`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            {formFields.map((field) => {
              const value = form[field.name]
              return (
                <div
                  key={field.name}
                  className={cn("grid gap-1.5", (field.wide || field.type === "textarea") && "sm:col-span-2")}
                >
                  <Label htmlFor={`f-${field.name}`}>
                    {field.label}
                    {field.required && <span className="text-red-500"> *</span>}
                  </Label>

                  {field.type === "select" ? (
                    <Select
                      value={value === null || value === undefined ? "" : String(value)}
                      onValueChange={(v) => setForm((prev) => ({ ...prev, [field.name]: v }))}
                    >
                      <SelectTrigger id={`f-${field.name}`}>
                        <SelectValue placeholder={field.placeholder ?? "Select…"} />
                      </SelectTrigger>
                      <SelectContent>
                        {resolveOptions(field).map((o) => (
                          <SelectItem key={String(o.value)} value={String(o.value)}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === "textarea" ? (
                    <Textarea
                      id={`f-${field.name}`}
                      value={String(value ?? "")}
                      onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      placeholder={field.placeholder}
                      rows={3}
                    />
                  ) : field.type === "checkbox" ? (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        id={`f-${field.name}`}
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-muted-foreground">{field.placeholder ?? "Enabled"}</span>
                    </label>
                  ) : (
                    <Input
                      id={`f-${field.name}`}
                      type={field.type === "money" ? "number" : field.type ?? "text"}
                      step={field.type === "money" ? "0.01" : undefined}
                      value={String(value ?? "")}
                      onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      placeholder={field.placeholder}
                    />
                  )}

                  {field.help && (
                    <p className="text-xs text-muted-foreground">{field.help}</p>
                  )}
                </div>
              )
            })}

            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : `Create ${singular}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
            setForceDelete(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {singular.toLowerCase()}?</DialogTitle>
            <DialogDescription>
              {allowForceDelete
                ? `This removes the ${singular.toLowerCase()}. If it still has history in other modules it is archived instead, unless you tick the box below.`
                : "This permanently removes the record. This cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          {allowForceDelete && (
            <label className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
              <input
                type="checkbox"
                checked={forceDelete}
                onChange={(e) => setForceDelete(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-red-600"
              />
              <span>
                <span className="font-medium text-red-700">Delete everything permanently</span>
                <span className="block text-xs text-red-600/90">
                  Also removes their attendance, leave, payslips and other records. This cannot be undone.
                </span>
              </span>
            </label>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ResourceScreen
