import * as React from "react"
import { HrTabbedPage } from "@/components/hr/HrPage"
import { ResourceScreen, type Field } from "@/components/hr/ResourceScreen"
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
import { IconUsersPlus } from "@tabler/icons-react"
import { toast } from "sonner"
import { hrAction, errorMessage, formatMoney } from "@/components/hr/hr-api"
import type { HrRow } from "@/Types/hr"

const TRAINING_STATUSES = ["planned", "ongoing", "completed", "cancelled"]
const ENROLLMENT_STATUSES = ["nominated", "enrolled", "attended", "completed", "dropped"]

function TrainingsTab() {
  const fields: Field[] = [
    { name: "title", label: "Training", required: true, wide: true },
    { name: "category", label: "Category" },
    { name: "trainer", label: "Trainer" },
    {
      name: "mode",
      label: "Mode",
      type: "select",
      options: enumOptions(["onsite", "online", "external", "self_paced"]),
      defaultValue: "onsite",
    },
    { name: "start_date", label: "Start", type: "date" },
    { name: "end_date", label: "End", type: "date" },
    { name: "duration_hours", label: "Hours", type: "number", hideInTable: true },
    { name: "capacity", label: "Capacity", type: "number" },
    {
      name: "cost_per_head",
      label: "Cost / Head",
      type: "money",
      render: (row: HrRow) => formatMoney(row.cost_per_head),
    },
    { name: "venue", label: "Venue", hideInTable: true },
    { name: "is_mandatory", label: "Mandatory", type: "checkbox", hideInTable: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: enumOptions(TRAINING_STATUSES),
      defaultValue: "planned",
    },
    { name: "description", label: "Description", type: "textarea", hideInTable: true },
  ]

  return (
    <ResourceScreen
      embedded
      title="Trainings"
      singular="Training"
      endpoint="/trainings"
      fields={fields}
      filters={[{ name: "status", label: "Status", options: enumOptions(TRAINING_STATUSES) }]}
    />
  )
}

function EnrollmentsTab() {
  const { options } = useHrOptions(["employees", "trainings"])
  const [refresh, setRefresh] = React.useState(0)
  const [bulkOpen, setBulkOpen] = React.useState(false)
  const [trainingId, setTrainingId] = React.useState("")
  const [selected, setSelected] = React.useState<string[]>([])

  const enrollMany = async () => {
    if (!trainingId || !selected.length) {
      toast.error("Pick a training and at least one employee")
      return
    }
    try {
      const res = await hrAction<{ message: string }>("/trainings/bulk-enroll", {
        training_id: Number(trainingId),
        employee_ids: selected.map(Number),
      })
      toast.success(res.message)
      setBulkOpen(false)
      setSelected([])
      setRefresh((r) => r + 1)
    } catch (err) {
      toast.error(errorMessage(err, "Could not enroll the employees"))
    }
  }

  const fields: Field[] = [
    {
      name: "training_id",
      label: "Training",
      type: "select",
      optionsKey: "trainings",
      required: true,
      render: (row: HrRow) => (row.training as { title?: string })?.title ?? "—",
    },
    {
      name: "employee_id",
      label: "Employee",
      type: "select",
      optionsKey: "employees",
      required: true,
      render: (row: HrRow) => {
        const e = row.employee as { first_name?: string; last_name?: string } | undefined
        return `${e?.first_name ?? ""} ${e?.last_name ?? ""}`.trim() || "—"
      },
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: enumOptions(ENROLLMENT_STATUSES),
      defaultValue: "enrolled",
    },
    { name: "score", label: "Score", type: "number" },
    { name: "certificate_url", label: "Certificate URL", hideInTable: true, wide: true },
    { name: "feedback", label: "Feedback", type: "textarea", hideInTable: true },
  ]

  return (
    <>
      <ResourceScreen
        embedded
        title="Enrollments"
        singular="Enrollment"
        endpoint="/training-enrollments"
        fields={fields}
        optionSources={options}
        refreshToken={refresh}
        filters={[
          { name: "training_id", label: "Trainings", options: options.trainings ?? [] },
          { name: "status", label: "Status", options: enumOptions(ENROLLMENT_STATUSES) },
        ]}
        toolbar={
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <IconUsersPlus className="h-4 w-4" />
            Bulk enroll
          </Button>
        }
      />

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk enroll</DialogTitle>
            <DialogDescription>
              Enroll several employees onto one training. Anyone already enrolled is skipped.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Training</Label>
              <Select value={trainingId} onValueChange={setTrainingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a training…" />
                </SelectTrigger>
                <SelectContent>
                  {(options.trainings ?? []).map((o) => (
                    <SelectItem key={String(o.value)} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Employees ({selected.length} selected)</Label>
              <div className="max-h-64 overflow-y-auto rounded-md border p-2">
                {(options.employees ?? []).map((o) => {
                  const value = String(o.value)
                  return (
                    <label key={value} className="flex items-center gap-2 py-1 text-sm">
                      <input
                        type="checkbox"
                        checked={selected.includes(value)}
                        onChange={() =>
                          setSelected((prev) =>
                            prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value],
                          )
                        }
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      {o.label}
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>
              Cancel
            </Button>
            <Button onClick={enrollMany} className="bg-teal-600 hover:bg-teal-700">
              Enroll {selected.length || ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

const Training = () => (
  <HrTabbedPage
    title="Training Management"
    tabs={[
      { value: "trainings", label: "Trainings", content: <TrainingsTab /> },
      { value: "enrollments", label: "Enrollments", content: <EnrollmentsTab /> },
    ]}
  />
)

export default Training
