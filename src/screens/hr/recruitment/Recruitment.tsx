import * as React from "react"
import { HrTabbedPage } from "@/components/hr/HrPage"
import { ResourceScreen, type Field, type RowAction } from "@/components/hr/ResourceScreen"
import { useHrOptions, enumOptions } from "@/components/hr/useHrOptions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { IconLoader2, IconArrowRight, IconUserPlus } from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { hrGet, hrAction, errorMessage, statusClass, humanise } from "@/components/hr/hr-api"
import type { HrRow } from "@/Types/hr"

const STAGES = ["applied", "screening", "interview", "offer", "hired", "rejected", "on_hold"]
const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "intern", "daily_wage"]

interface PipelineColumn {
  stage: string
  count: number
  candidates: Array<HrRow & { full_name?: string; job_posting?: { title?: string } }>
}

/** Kanban view of the ATS pipeline. */
function PipelineTab() {
  const [columns, setColumns] = React.useState<PipelineColumn[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await hrGet<{ data: PipelineColumn[] }>("/recruitment/pipeline")
      setColumns(res.data ?? [])
    } catch (err) {
      toast.error(errorMessage(err, "Could not load the pipeline"))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const advance = async (candidate: HrRow, stage: string) => {
    try {
      await hrAction(`/candidates/${candidate.id}/stage`, { stage })
      toast.success(`Moved to ${humanise(stage)}`)
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Could not move the candidate"))
    }
  }

  const convert = async (candidate: HrRow) => {
    try {
      await hrAction(`/candidates/${candidate.id}/convert`, {})
      toast.success("Candidate converted to an employee")
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Could not convert the candidate"))
    }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <IconLoader2 className="h-5 w-5 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3" style={{ minWidth: `${STAGES.length * 220}px` }}>
        {columns.map((column) => {
          const nextStage = STAGES[STAGES.indexOf(column.stage) + 1]
          return (
            <div key={column.stage} className="flex-1 min-w-[210px]">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-sm font-semibold">{humanise(column.stage)}</span>
                <Badge variant="outline" className={cn(statusClass(column.stage))}>
                  {column.count}
                </Badge>
              </div>

              <div className="flex flex-col gap-2">
                {column.candidates.length === 0 && (
                  <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                    Empty
                  </p>
                )}
                {column.candidates.map((candidate) => (
                  <Card key={candidate.id} className="py-0">
                    <CardContent className="space-y-1.5 p-3">
                      <p className="text-sm font-medium leading-tight">{candidate.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {candidate.job_posting?.title ?? "No position"}
                      </p>
                      <div className="flex gap-1 pt-1">
                        {column.stage === "hired" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-full text-xs"
                            disabled={!!candidate.converted_employee_id}
                            onClick={() => convert(candidate)}
                          >
                            <IconUserPlus className="h-3 w-3" />
                            {candidate.converted_employee_id ? "Onboarded" : "Make employee"}
                          </Button>
                        ) : (
                          nextStage &&
                          !["rejected", "on_hold"].includes(column.stage) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-full text-xs"
                              onClick={() => advance(candidate, nextStage)}
                            >
                              <IconArrowRight className="h-3 w-3" />
                              {humanise(nextStage)}
                            </Button>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PostingsTab() {
  const { options } = useHrOptions(["departments", "designations"])

  const fields: Field[] = [
    { name: "title", label: "Title", required: true },
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
      hideInTable: true,
    },
    { name: "openings", label: "Openings", type: "number", defaultValue: 1 },
    {
      name: "employment_type",
      label: "Type",
      type: "select",
      options: enumOptions(EMPLOYMENT_TYPES),
      defaultValue: "full_time",
    },
    { name: "location", label: "Location" },
    { name: "experience_required", label: "Experience", hideInTable: true },
    { name: "salary_range", label: "Salary Range", hideInTable: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: enumOptions(["draft", "open", "on_hold", "closed"]),
      defaultValue: "open",
    },
    { name: "closing_date", label: "Closes", type: "date" },
    { name: "description", label: "Description", type: "textarea", hideInTable: true },
  ]

  return (
    <ResourceScreen
      embedded
      title="Job Postings"
      singular="Job Posting"
      endpoint="/job-postings"
      fields={fields}
      optionSources={options}
      filters={[{ name: "status", label: "Status", options: enumOptions(["draft", "open", "on_hold", "closed"]) }]}
    />
  )
}

function CandidatesTab() {
  const { options } = useHrOptions(["jobPostings"])
  const [refresh, setRefresh] = React.useState(0)

  const convert = async (row: HrRow) => {
    try {
      await hrAction(`/candidates/${row.id}/convert`, {})
      toast.success("Candidate converted to an employee")
      setRefresh((r) => r + 1)
    } catch (err) {
      toast.error(errorMessage(err, "Could not convert the candidate"))
    }
  }

  const fields: Field[] = [
    { name: "full_name", label: "Candidate", required: true },
    {
      name: "job_posting_id",
      label: "Position",
      type: "select",
      optionsKey: "jobPostings",
      render: (row: HrRow) => (row.job_posting as { title?: string })?.title ?? "—",
    },
    { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Phone" },
    { name: "stage", label: "Stage", type: "select", options: enumOptions(STAGES), defaultValue: "applied" },
    { name: "experience_years", label: "Experience (yrs)", type: "number" },
    { name: "expected_salary", label: "Expected Salary", type: "money", hideInTable: true },
    { name: "current_company", label: "Current Company", hideInTable: true },
    { name: "source", label: "Source", hideInTable: true },
    { name: "resume_url", label: "Resume URL", hideInTable: true, wide: true },
    { name: "rating", label: "Rating (1-5)", type: "number", hideInTable: true },
    { name: "notes", label: "Notes", type: "textarea", hideInTable: true },
  ]

  const actions: RowAction[] = [
    {
      label: "Make employee",
      icon: IconUserPlus,
      show: (row) => row.stage === "hired" && !row.converted_employee_id,
      onClick: convert,
    },
  ]

  return (
    <ResourceScreen
      embedded
      title="Candidates"
      singular="Candidate"
      endpoint="/candidates"
      fields={fields}
      optionSources={options}
      rowActions={actions}
      refreshToken={refresh}
      filters={[{ name: "stage", label: "Stage", options: enumOptions(STAGES) }]}
      searchPlaceholder="Search candidates…"
    />
  )
}

function InterviewsTab() {
  const { options } = useHrOptions(["candidates", "employees"])

  const fields: Field[] = [
    {
      name: "candidate_id",
      label: "Candidate",
      type: "select",
      optionsKey: "candidates",
      required: true,
      render: (row: HrRow) => (row.candidate as { full_name?: string })?.full_name ?? "—",
    },
    { name: "round", label: "Round", type: "number", defaultValue: 1 },
    { name: "scheduled_at", label: "Scheduled", type: "datetime-local" },
    {
      name: "interviewer_id",
      label: "Interviewer",
      type: "select",
      optionsKey: "employees",
      hideInTable: true,
    },
    { name: "mode", label: "Mode", type: "select", options: enumOptions(["onsite", "phone", "video"]), defaultValue: "onsite" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: enumOptions(["scheduled", "completed", "cancelled", "no_show"]),
      defaultValue: "scheduled",
    },
    { name: "score", label: "Score", type: "number" },
    { name: "feedback", label: "Feedback", type: "textarea", hideInTable: true },
  ]

  return (
    <ResourceScreen
      embedded
      title="Interviews"
      singular="Interview"
      endpoint="/interviews"
      fields={fields}
      optionSources={options}
      filters={[
        { name: "status", label: "Status", options: enumOptions(["scheduled", "completed", "cancelled", "no_show"]) },
      ]}
    />
  )
}

const Recruitment = () => (
  <HrTabbedPage
    title="Recruitment / ATS"
    description="Moving a candidate to Hired lets you convert them into an employee record in one click — which also seeds their onboarding checklist."
    tabs={[
      { value: "pipeline", label: "Pipeline", content: <PipelineTab /> },
      { value: "candidates", label: "Candidates", content: <CandidatesTab /> },
      { value: "postings", label: "Job Postings", content: <PostingsTab /> },
      { value: "interviews", label: "Interviews", content: <InterviewsTab /> },
    ]}
  />
)

export default Recruitment
