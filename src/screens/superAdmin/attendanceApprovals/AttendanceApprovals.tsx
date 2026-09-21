import MissedPunchQueue from "@/components/hr/MissedPunchQueue"

/**
 * The super admin's final approval for missed-attendance requests that HR has
 * already approved. Approving here is what marks the attendance.
 */
const AttendanceApprovals = () => <MissedPunchQueue stage="superadmin" />

export default AttendanceApprovals
