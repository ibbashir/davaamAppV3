import * as React from "react"
import { HrTabbedPage } from "@/components/hr/HrPage"
import { ResourceScreen, type Field, type RowAction } from "@/components/hr/ResourceScreen"
import { useHrOptions, enumOptions } from "@/components/hr/useHrOptions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
import { IconFilePlus, IconEye } from "@tabler/icons-react"
import { toast } from "sonner"
import { hrAction, errorMessage, todayISO } from "@/components/hr/hr-api"
import type { HrRow } from "@/Types/hr"

const LETTER_TYPES = [
  "offer",
  "appointment",
  "confirmation",
  "promotion",
  "increment",
  "warning",
  "experience",
  "relieving",
  "noc",
  "salary_certificate",
  "other",
]

const TOKENS = [
  "employee_name",
  "employee_code",
  "designation",
  "department",
  "date_of_joining",
  "date_of_confirmation",
  "base_salary",
  "employment_type",
  "work_location",
  "email",
  "phone",
  "cnic",
  "today",
  "company_name",
]

function LettersTab() {
  const { options } = useHrOptions(["employees", "letterTemplates"])
  const [refresh, setRefresh] = React.useState(0)
  const [open, setOpen] = React.useState(false)
  const [employeeId, setEmployeeId] = React.useState("")
  const [templateId, setTemplateId] = React.useState("")
  const [preview, setPreview] = React.useState<{ subject: string; body: string } | null>(null)
  const [viewing, setViewing] = React.useState<HrRow | null>(null)

  const runPreview = async () => {
    if (!employeeId || !templateId) {
      toast.error("Pick an employee and a template")
      return
    }
    try {
      const res = await hrAction<{ data: { subject: string; body: string } }>("/letters/preview", {
        employee_id: Number(employeeId),
        template_id: Number(templateId),
      })
      setPreview(res.data)
    } catch (err) {
      toast.error(errorMessage(err, "Could not render the preview"))
    }
  }

  const generate = async () => {
    if (!employeeId || !templateId) {
      toast.error("Pick an employee and a template")
      return
    }
    try {
      await hrAction("/letters/generate", {
        employee_id: Number(employeeId),
        template_id: Number(templateId),
        issued_date: todayISO(),
      })
      toast.success("Letter generated")
      setOpen(false)
      setPreview(null)
      setEmployeeId("")
      setTemplateId("")
      setRefresh((r) => r + 1)
    } catch (err) {
      toast.error(errorMessage(err, "Could not generate the letter"))
    }
  }

  const fields: Field[] = [
    { name: "letter_code", label: "Letter", hideInForm: true },
    {
      name: "employee_id",
      label: "Employee",
      type: "select",
      optionsKey: "employees",
      hideInForm: true,
      render: (row: HrRow) => {
        const e = row.employee as { first_name?: string; last_name?: string } | undefined
        return `${e?.first_name ?? ""} ${e?.last_name ?? ""}`.trim() || "—"
      },
    },
    { name: "letter_type", label: "Type", type: "select", options: enumOptions(LETTER_TYPES) },
    { name: "subject", label: "Subject", wide: true },
    { name: "issued_date", label: "Issued", type: "date" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: enumOptions(["draft", "issued", "acknowledged"]),
    },
    { name: "body", label: "Body", type: "textarea", hideInTable: true },
  ]

  const actions: RowAction[] = [
    {
      label: "View",
      icon: IconEye,
      onClick: (row) => setViewing(row),
    },
  ]

  return (
    <>
      <ResourceScreen
        embedded
        title="Letters"
        singular="Letter"
        endpoint="/letters"
        fields={fields}
        optionSources={options}
        rowActions={actions}
        refreshToken={refresh}
        canCreate={false}
        filters={[{ name: "letter_type", label: "Types", options: enumOptions(LETTER_TYPES) }]}
        toolbar={
          <Button onClick={() => setOpen(true)} className="bg-teal-600 hover:bg-teal-700">
            <IconFilePlus className="h-4 w-4" />
            Generate letter
          </Button>
        }
      />

      {/* Generate */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate a letter</DialogTitle>
            <DialogDescription>
              Fills the template's {"{{tokens}}"} with the selected employee's details.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Employee</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {(options.employees ?? []).map((o) => (
                    <SelectItem key={String(o.value)} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {(options.letterTemplates ?? []).map((o) => (
                    <SelectItem key={String(o.value)} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button variant="outline" onClick={runPreview} className="w-full">
            <IconEye className="h-4 w-4" />
            Preview
          </Button>

          {preview && (
            <div className="rounded-md border p-3">
              <p className="mb-2 text-sm font-semibold">{preview.subject}</p>
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{preview.body}</pre>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={generate} className="bg-teal-600 hover:bg-teal-700">
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{String(viewing?.subject ?? "Letter")}</DialogTitle>
            <DialogDescription>{String(viewing?.letter_code ?? "")}</DialogDescription>
          </DialogHeader>
          <pre className="whitespace-pre-wrap rounded-md border p-4 text-sm">
            {String(viewing?.body ?? "")}
          </pre>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
            <Button onClick={() => window.print()} className="bg-teal-600 hover:bg-teal-700">
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function TemplatesTab() {
  const fields: Field[] = [
    { name: "name", label: "Template", required: true },
    { name: "letter_type", label: "Type", type: "select", options: enumOptions(LETTER_TYPES), defaultValue: "other" },
    { name: "subject", label: "Subject", wide: true },
    {
      name: "body",
      label: "Body",
      type: "textarea",
      required: true,
      hideInTable: true,
      help: `Available tokens: ${TOKENS.map((t) => `{{${t}}}`).join(", ")}`,
    },
    { name: "is_active", label: "Active", type: "checkbox", defaultValue: true },
  ]

  return (
    <ResourceScreen
      embedded
      title="Letter Templates"
      singular="Template"
      endpoint="/letter-templates"
      fields={fields}
      description="Write the body once with {{tokens}}; every generated letter substitutes the employee's own details."
    />
  )
}

const Letters = () => (
  <HrTabbedPage
    title="HR Letters"
    tabs={[
      { value: "letters", label: "Issued Letters", content: <LettersTab /> },
      { value: "templates", label: "Templates", content: <TemplatesTab /> },
    ]}
  />
)

export default Letters
