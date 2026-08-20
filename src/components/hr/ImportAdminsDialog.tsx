import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { IconLoader2, IconUsersPlus, IconSearch } from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { hrGet, hrAction, errorMessage, humanise } from "./hr-api"

interface AdminCandidate {
  id: number
  full_name: string
  email: string
  user_role: string
  role_code: string
  already_imported: boolean
}

/**
 * Bulk-creates employee records from the existing dashboard logins in `admins`.
 *
 * This is the fast path for a team that is already using the dashboard: rather
 * than re-typing everyone into HR, import them here. Each imported employee is
 * linked to its login account, which is what turns on self-service for that
 * person — so after importing, ops/finance/admin staff can mark their own
 * attendance and the HR attendance roster stops being empty.
 */
export function ImportAdminsDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void
}) {
  const [rows, setRows] = React.useState<AdminCandidate[]>([])
  const [loading, setLoading] = React.useState(true)
  const [importing, setImporting] = React.useState(false)
  const [selected, setSelected] = React.useState<number[]>([])
  const [search, setSearch] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await hrGet<{ data: AdminCandidate[] }>("/employees/admin-candidates")
      const data = res.data ?? []
      setRows(data)
      // Pre-select everyone not yet in HR — the common case is "import all"
      setSelected(data.filter((a) => !a.already_imported).map((a) => a.id))
    } catch (err) {
      toast.error(errorMessage(err, "Could not load dashboard accounts"))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (open) {
      setSearch("")
      load()
    }
  }, [open, load])

  const term = search.trim().toLowerCase()
  const visible = term
    ? rows.filter(
        (r) =>
          r.full_name.toLowerCase().includes(term) ||
          r.email?.toLowerCase().includes(term) ||
          r.user_role?.toLowerCase().includes(term),
      )
    : rows

  const importable = visible.filter((r) => !r.already_imported)
  const allSelected = importable.length > 0 && importable.every((r) => selected.includes(r.id))

  const toggle = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const runImport = async () => {
    if (!selected.length) {
      toast.error("Select at least one account")
      return
    }
    setImporting(true)
    try {
      const res = await hrAction<{ message: string }>("/employees/import-admins", {
        admin_ids: selected,
      })
      toast.success(res.message)
      onOpenChange(false)
      onImported()
    } catch (err) {
      toast.error(errorMessage(err, "Could not import the accounts"))
    } finally {
      setImporting(false)
    }
  }

  const alreadyCount = rows.filter((r) => r.already_imported).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import employees from dashboard accounts</DialogTitle>
          <DialogDescription>
            Creates an employee record for each selected login and links the two, which switches
            on self-service for that person. Corporate client accounts are excluded, and anyone
            already in HR is skipped.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email or role…"
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setSelected(
                allSelected
                  ? selected.filter((id) => !importable.some((r) => r.id === id))
                  : [...new Set([...selected, ...importable.map((r) => r.id)])],
              )
            }
            disabled={!importable.length}
          >
            {allSelected ? "Clear all" : "Select all"}
          </Button>
        </div>

        <div className="max-h-[45vh] overflow-y-auto rounded-md border">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <IconLoader2 className="h-5 w-5 animate-spin text-teal-600" />
            </div>
          ) : visible.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">
              No dashboard accounts match.
            </p>
          ) : (
            visible.map((row) => (
              <label
                key={row.id}
                className={cn(
                  "flex items-center gap-3 border-b px-3 py-2 text-sm last:border-b-0",
                  row.already_imported ? "opacity-60" : "cursor-pointer hover:bg-muted",
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(row.id)}
                  disabled={row.already_imported}
                  onChange={() => toggle(row.id)}
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{row.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.email}</p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {humanise(row.user_role)}
                </Badge>
                {row.already_imported && (
                  <Badge
                    variant="outline"
                    className="shrink-0 bg-emerald-100 text-emerald-700 border-emerald-200"
                  >
                    In HR
                  </Badge>
                )}
              </label>
            ))
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {rows.length} staff account{rows.length === 1 ? "" : "s"} · {alreadyCount} already in HR ·{" "}
          <span className="font-medium text-teal-600">{selected.length} selected</span>
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={runImport}
            disabled={importing || !selected.length}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {importing && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            <IconUsersPlus className="h-4 w-4" />
            Import {selected.length || ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ImportAdminsDialog
