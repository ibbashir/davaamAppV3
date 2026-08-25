import * as React from "react"
import { ResourceScreen, type Field, type RowAction } from "@/components/hr/ResourceScreen"
import { ImportAdminsDialog } from "@/components/hr/ImportAdminsDialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { IconUsersPlus, IconKey, IconCopy } from "@tabler/icons-react"
import { toast } from "sonner"
import { useHrOptions, enumOptions } from "@/components/hr/useHrOptions"
import { hrGet, hrAction, humanise, errorMessage } from "@/components/hr/hr-api"
import type { HrRow } from "@/Types/hr"
import type { Option } from "@/components/hr/ResourceScreen"

/** What the server reports back about the login it created (or didn't). */
type LoginResult = {
  created: boolean
  reason: string
  admin_id: number | null
  email: string | null
  temp_password: string | null
}

const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "intern", "daily_wage"]
const STATUSES = ["active", "probation", "notice_period", "separated", "suspended"]

const Employees = () => {
  const { options } = useHrOptions([
    "departments",
    "designations",
    "employees",
    "reportsTo",
    "shifts",
  ])
  const [adminOptions, setAdminOptions] = React.useState<Option[]>([])
  const [importOpen, setImportOpen] = React.useState(false)
  const [refresh, setRefresh] = React.useState(0)
  // Shown once, right after a login is provisioned — the generated password is
  // never stored in readable form, so this is HR's only chance to copy it.
  const [credentials, setCredentials] = React.useState<{ email: string; password: string } | null>(
    null,
  )

  const showLogin = (login?: LoginResult | null) => {
    if (login?.temp_password && login.email) {
      setCredentials({ email: login.email, password: login.temp_password })
    }
  }

  const copyCredentials = async () => {
    if (!credentials) return
    try {
      await navigator.clipboard.writeText(
        `Email: ${credentials.email}\nPassword: ${credentials.password}`,
      )
      toast.success("Credentials copied")
    } catch {
      toast.error("Could not copy — select the text and copy it manually")
    }
  }

  // Back-fills a login for anyone imported or created without one.
  const rowActions: RowAction[] = [
    {
      label: "Create login",
      icon: IconKey,
      variant: "outline",
      show: (row: HrRow) => !row.admin_id,
      onClick: async (row: HrRow, reload: () => void) => {
        try {
          const res = await hrAction<{ message: string; login?: LoginResult }>(
            `/employees/${row.id}/create-login`,
          )
          showLogin(res.login)
          if (!res.login?.temp_password) toast.success(res.message)
          reload()
          setRefresh((r) => r + 1)
        } catch (err) {
          toast.error(errorMessage(err, "Could not create the login"))
        }
      },
    },
  ]

  // Dashboard logins with no employee record yet — linking one switches on ESS
  // for that person, so ops/finance/admin staff can use self-service.
  React.useEffect(() => {
    ;(async () => {
      try {
        const res = await hrGet<{
          data: Array<{ id: number; first_name: string; last_name: string; email: string; user_role: string }>
        }>("/employees/unlinked-admins")
        setAdminOptions(
          (res.data ?? []).map((a) => ({
            value: a.id,
            label: `${a.first_name ?? ""} ${a.last_name ?? ""} — ${a.email} (${humanise(a.user_role)})`.trim(),
          })),
        )
      } catch {
        setAdminOptions([])
      }
    })()
  }, [refresh])

  const fields: Field[] = [
    { name: "employee_code", label: "Code", placeholder: "Auto-generated if left blank" },
    {
      name: "first_name",
      label: "Name",
      required: true,
      render: (row: HrRow) => `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "—",
    },
    { name: "last_name", label: "Last Name", hideInTable: true },
    { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Phone" },
    { name: "cnic", label: "CNIC", hideInTable: true },
    {
      name: "department_id",
      label: "Department",
      type: "select",
      optionsKey: "departments",
      render: (row: HrRow) => (row.department as { name?: string })?.name ?? "—",
    },
    {
      name: "designation_id",
      label: "Designation",
      type: "select",
      optionsKey: "designations",
      render: (row: HrRow) => (row.designation as { title?: string })?.title ?? "—",
    },
    {
      name: "manager_id",
      label: "Reports To",
      type: "select",
      optionsKey: "reportsTo",
      hideInTable: true,
      help: "Drives Manager Self Service — this person approves their leave and expenses",
    },
    {
      name: "shift_id",
      label: "Shift",
      type: "select",
      optionsKey: "shifts",
      hideInTable: true,
      help: "Used to calculate lateness and overtime",
    },
    {
      name: "employment_type",
      label: "Type",
      type: "select",
      options: enumOptions(EMPLOYMENT_TYPES),
      defaultValue: "full_time",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: enumOptions(STATUSES),
      defaultValue: "active",
    },
    { name: "date_of_joining", label: "Joined", type: "date" },
    { name: "date_of_confirmation", label: "Confirmation Date", type: "date", hideInTable: true },
    { name: "contract_end_date", label: "Contract Ends", type: "date", hideInTable: true },
    { name: "date_of_birth", label: "Date of Birth", type: "date", hideInTable: true },
    {
      name: "gender",
      label: "Gender",
      type: "select",
      options: enumOptions(["male", "female", "other"]),
      hideInTable: true,
    },
    { name: "work_location", label: "Work Location", hideInTable: true },
    { name: "bank_name", label: "Bank", hideInTable: true },
    { name: "bank_account", label: "Bank Account", hideInTable: true },
    { name: "emergency_contact_name", label: "Emergency Contact", hideInTable: true },
    { name: "emergency_contact_phone", label: "Emergency Phone", hideInTable: true },
    {
      name: "is_manager",
      label: "Is a manager",
      type: "checkbox",
      hideInTable: true,
      placeholder: "Appears in manager pickers",
    },
    {
      name: "admin_id",
      label: "Dashboard Login",
      type: "select",
      options: adminOptions,
      hideInTable: true,
      wide: true,
      help: "Link a dashboard account to give this person self-service (attendance, leave, expenses). Only unlinked accounts are listed.",
    },
    { name: "address", label: "Address", type: "textarea", hideInTable: true },
    {
      name: "create_login",
      label: "Create a self-service login",
      type: "checkbox",
      defaultValue: true,
      createOnly: true,
      hideInTable: true,
      placeholder: "Skip only if this person will never sign in",
    },
    {
      name: "login_password",
      label: "Login Password",
      createOnly: true,
      hideInTable: true,
      wide: true,
      placeholder: "Leave blank to generate one",
      help: "They sign in with their email on the “Others” role, which reaches nothing but self-service — marking attendance and reading their own HR data.",
    },
  ]

  return (
    <>
    <ResourceScreen
      title="Employee Management"
      refreshToken={refresh}
      toolbar={
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <IconUsersPlus className="h-4 w-4" />
          Import from Admins
        </Button>
      }
      singular="Employee"
      allowForceDelete
      endpoint="/employees"
      description="The central employee register. Every new employee also gets a self-service login, so they can mark attendance and see their own HR data."
      fields={fields}
      rowActions={rowActions}
      onCreated={(res) => {
        showLogin(res.login as LoginResult | undefined)
        setRefresh((r) => r + 1)
      }}
      optionSources={options}
      searchPlaceholder="Search name, code, email, phone or CNIC…"
      filters={[
        { name: "status", label: "Status", options: enumOptions(STATUSES) },
        { name: "employment_type", label: "Types", options: enumOptions(EMPLOYMENT_TYPES) },
        { name: "department_id", label: "Departments", options: options.departments ?? [] },
      ]}
      emptyMessage="No employees yet — use “Import from Admins” to bring your existing dashboard users in, or add one manually"
    />

    <ImportAdminsDialog
      open={importOpen}
      onOpenChange={setImportOpen}
      onImported={() => setRefresh((r) => r + 1)}
    />

    <Dialog open={!!credentials} onOpenChange={(open) => !open && setCredentials(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Self-service login created</DialogTitle>
          <DialogDescription>
            Pass these on now — the password is stored hashed, so it can't be shown again.
            They should change it after signing in.
          </DialogDescription>
        </DialogHeader>

        <dl className="rounded-md border bg-muted/40 p-4 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium break-all">{credentials?.email}</dd>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">Password</dt>
            <dd className="font-mono font-medium">{credentials?.password}</dd>
          </div>
        </dl>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={copyCredentials}>
            <IconCopy className="h-4 w-4" />
            Copy
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setCredentials(null)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}

export default Employees
