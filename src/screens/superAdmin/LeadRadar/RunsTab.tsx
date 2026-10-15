import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { IconLoader2 } from "@tabler/icons-react"
import { toast } from "sonner"
import { errorMessage } from "@/components/hr/hr-api"
import { fetchRuns, EMAIL_STYLE, RUN_KIND, fmtTime, type LeadRun } from "./api"
import { Pill } from "./LeadsTab"

const PAGE_SIZE = 25

/** Every delivery attempt — agent runs, resends and test emails — and what the mail server said. */
export function RunsTab({ refreshKey }: { refreshKey: number }) {
  const [rows, setRows] = React.useState<LeadRun[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    setLoading(true)
    fetchRuns({ page, limit: PAGE_SIZE })
      .then((r) => { setRows(r.data.rows); setTotal(r.data.total) })
      .catch((err) => toast.error(errorMessage(err, "Could not load the email log")))
      .finally(() => setLoading(false))
  }, [page, refreshKey])

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        "Emailed" means the mail server accepted the message for the addresses listed. Whether it then landed in the
        inbox or spam is not reported back, so check spam the first time.
      </p>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Found</TableHead>
                <TableHead className="text-right">New</TableHead>
                <TableHead className="text-right">Already seen</TableHead>
                <TableHead className="text-right">Emailed</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="min-w-[220px]">Delivered to / error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={8} className="py-12 text-center"><IconLoader2 className="mx-auto h-5 w-5 animate-spin text-teal-600" /></TableCell></TableRow>
              )}
              {!loading && rows.length === 0 && (
                <TableRow><TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No runs yet. The agent runs daily at 1:00 am.</TableCell></TableRow>
              )}
              {!loading && rows.map((r) => {
                const em = EMAIL_STYLE[r.email_status]
                return (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-xs">{fmtTime(r.created_at)}</TableCell>
                    <TableCell className="text-xs">{RUN_KIND[r.kind] ?? r.kind}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.kind === "agent" ? r.received : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.kind === "agent" ? r.new_count : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.kind === "agent" ? r.duplicates : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.emailed_count}</TableCell>
                    <TableCell>{em && <Pill className={em.className}>{em.label}</Pill>}</TableCell>
                    <TableCell className="whitespace-normal text-xs">
                      {r.email_error
                        ? <span className="text-red-700">{r.email_error}</span>
                        : r.accepted?.length
                          ? <span className="text-emerald-700">{r.accepted.join(", ")}</span>
                          : <span className="text-muted-foreground">—</span>}
                      {(r.rejected?.length ?? 0) > 0 && <p className="text-red-700">Rejected: {r.rejected!.join(", ")}</p>}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
        <span>Page {page} of {pages}</span>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>
    </div>
  )
}
