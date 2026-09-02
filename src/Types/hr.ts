// Shared types for the HR / HCM subsystem.

export interface HrListResponse<T> {
  statusCode: number;
  message: string;
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  data: T[];
}

export interface HrItemResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

/** Every HR table row carries at least these. */
export interface HrRow {
  id: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface EmployeeOption {
  id: number;
  employee_code: string;
  name: string;
  department_id: number | null;
}

export interface Employee extends HrRow {
  employee_code: string;
  admin_id: number | null;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  department_id: number | null;
  designation_id: number | null;
  manager_id: number | null;
  employment_type: string;
  status: string;
  date_of_joining: string | null;
  base_salary: string | number | null;
  department?: { id: number; name: string } | null;
  designation?: { id: number; title: string } | null;
  manager?: { id: number; first_name: string; last_name: string | null } | null;
}

export interface RosterRow {
  employee_id: number;
  employee_code: string;
  name: string;
  email: string | null;
  department: string | null;
  attendance_id: number | null;
  check_in: string | null;
  check_out: string | null;
  check_in_lat: number | null;
  check_in_lng: number | null;
  check_out_lat: number | null;
  check_out_lng: number | null;
  worked_minutes: number | null;
  late_minutes: number;
  status: string;
}

export interface HrOverview {
  headcount: {
    total: number;
    active: number;
    probation: number;
    notice_period: number;
    new_this_month: number;
    separated_this_month: number;
  };
  attendance_today: Record<string, number> & {
    present: number;
    not_marked: number;
    attendance_rate: number;
  };
  pending_approvals: {
    leave: number;
    expense: number;
    travel: number;
    manpower: number;
    piece_work: number;
    total: number;
  };
  open_positions: number;
  open_tickets: number;
  overdue_onboarding_tasks: number;
}

export interface HrAnalytics {
  headcount_by_department: Array<{ department_id: number; count: number; department: { id: number; name: string } }>;
  headcount_by_type: Array<{ employment_type: string; count: number }>;
  gender_split: Array<{ gender: string | null; count: number }>;
  trend: Array<{ label: string; joiners: number; exits: number; attendance_rate: number }>;
  leave_by_type: Array<{ leave_type_id: number; days: string }>;
  payroll_history: Array<{
    period_year: number;
    period_month: number;
    total_net: string;
    employee_count: number;
    status: string;
  }>;
  asset_value: number;
  training_count: number;
  candidate_count: number;
}

/**
 * A request to be checked out from wherever the employee actually is, because
 * the office geofence refused their punch. HR decides; approving writes the
 * check-out onto that day's attendance.
 */
export interface CheckoutRequest {
  id: number;
  employee_id: number;
  employee: string | null;
  employee_code: string | null;
  email: string | null;
  department: string | null;
  attendance_date: string;
  attendance_id: number | null;
  check_in: string | null;
  requested_at: string;
  reason: string;
  lat: number | null;
  lng: number | null;
  accuracy_m: number | null;
  distance_m: number | null;
  nearest_site: string | null;
  approved_check_out: string | null;
  status: string;
  decided_at: string | null;
  decision_note: string | null;
  created_at?: string;
}

export interface EssDashboard {
  employee: {
    id: number;
    name: string;
    employee_code: string;
    department: string | null;
    designation: string | null;
    manager: string | null;
    shift: { name: string; start_time: string; end_time: string } | null;
  };
  today: {
    date: string;
    checked_in: boolean;
    checked_out: boolean;
    check_in: string | null;
    check_out: string | null;
    status: string | null;
    worked_minutes: number | null;
    /** Set while a remote check-out is waiting on HR. */
    checkout_request: CheckoutRequest | null;
  };
  this_month: {
    present_days: number;
    absent_days: number;
    leave_days: number;
    late_minutes: number;
  };
  leave_balances: Array<{
    leave_type_id: number;
    leave_type: string;
    entitled: number;
    used: number;
    available: number;
  }>;
  /** Approved check-in/out sites — only enabled for the fenced roles. */
  geofence?: {
    enabled: boolean;
    sites: Array<{ id: string; label: string; lat: number; lng: number; radius_m: number }>;
  };
  pending: { leave: number; expense: number; tickets: number; onboarding_tasks: number };
  assets_held: number;
  /** Company holidays from today onwards, soonest first. */
  holidays: Holiday[];
  is_manager: boolean;
  direct_reports: number;
}

export interface MonthlySheetDay {
  date: string;
  day: number;
  weekday: number;
  label: string;
  is_week_off: boolean;
  is_holiday: boolean;
  holiday_name: string | null;
  is_working_day: boolean;
  is_future: boolean;
}

export interface MonthlySheetCell {
  status: string | null;
  check_in: string | null;
  check_out: string | null;
  worked_minutes: number | null;
  late_minutes: number;
  overtime_minutes: number;
}

export interface MonthlySheetRow {
  employee_id: number;
  employee_code: string;
  name: string;
  email: string | null;
  department: string | null;
  designation: string | null;
  shift: string | null;
  days: Record<string, MonthlySheetCell>;
  totals: {
    working_days: number;
    counted_from: string;
    present_days: number;
    late_days: number;
    half_days: number;
    leave_days: number;
    absent_days: number;
    holiday_days: number;
    week_off_days: number;
    days_marked: number;
    worked_minutes: number;
    worked_hours: number;
    late_minutes: number;
    overtime_minutes: number;
    overtime_hours: number;
    expected_hours: number;
    late_penalty_days: number;
    payable_days: number;
    attendance_rate: number;
  };
}

export interface MonthlySheet {
  period: {
    month: number;
    year: number;
    from: string;
    to: string;
    label: string;
    working_days_in_month: number;
    working_days_elapsed: number;
    tracking_start: string;
    is_current_month: boolean;
    days: MonthlySheetDay[];
  };
  policy: {
    late_after: string;
    full_day_hours: number;
    lates_per_half_day: number;
    working_week: string;
    timezone: string;
  };
  totals: {
    employees: number;
    present_days: number;
    absent_days: number;
    late_days: number;
    half_days: number;
    leave_days: number;
    worked_hours: number;
    overtime_hours: number;
    attendance_rate: number;
  };
  data: MonthlySheetRow[];
}

export interface Holiday {
  id: number;
  name: string;
  holiday_date: string;
  is_optional: boolean;
  description?: string | null;
  is_today: boolean;
}

export interface TeamMember {
  employee_id: number;
  employee_code: string;
  name: string;
  designation: string | null;
  employment_status: string;
  today_status: string;
  check_in: string | null;
  check_out: string | null;
}
