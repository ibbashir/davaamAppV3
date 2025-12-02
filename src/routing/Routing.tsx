import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/layouts/layout'
import PrivateRouting from './PrivateRouting'

import Login from '@/screens/login/Login'
import ForgetPassword from '@/screens/forgetPassword/ForgetPassword'
import CompanyInfo from '@/screens/company-info/Company-info'
import PrivacyPolicy from '@/screens/privacypolicy/PrivacyPolicy'

//superAdmin Screens
import Dashboard from '@/screens/superAdmin/dashboard/Dashboard'
import { PointShare } from '@/screens/superAdmin/pointsshare/PointShare'
import Roles from '@/screens/superAdmin/roles/Roles'
import Machines from '@/screens/superAdmin/machines/Machines'
import Locations from '@/screens/superAdmin/locations/Locations'
import { Topup } from '@/screens/superAdmin/topup/Topup'
import Notifications from '@/screens/superAdmin/notification/Notifications'
import Feedback from '@/screens/superAdmin/feedback/Feedback'
import Corporate from '@/screens/superAdmin/corporate/Corporate'
import SuperAdminMachineVisit from '@/screens/superAdmin/machines/MachineVisit'

//admin screens
import AdminDashboard from '@/screens/admin/dashboard/Dashboard'
import { AdminPointShare } from '@/screens/admin/pointsshare/PointShare'
import AdminMachines from '@/screens/admin/machines/Machines'
import AdminLocations from '@/screens/admin/locations/Locations'
import { AdminTopup } from '@/screens/admin/topup/Topup'
import AdminNotifications from '@/screens/admin/notification/Notifications'
import AdminFeedback from '@/screens/admin/feedback/Feedback'
import AdminCorporate from '@/screens/admin/corporate/Corporate'
import AdminMachineVisit from '@/screens/admin/machines/MachineVisit'

//ops screens
import OpsDashboard from '@/screens/ops/dashboard/Dashboard'
import { OpsPointShare } from '@/screens/ops/pointsshare/PointShare'
import OpsMachines from '@/screens/ops/machines/Machines'
import OpsLocations from '@/screens/ops/locations/Locations'
import { OpsTopup } from '@/screens/ops/topup/Topup'
import OpsFeedback from '@/screens/ops/feedback/Feedback'
import OpsCorporate from '@/screens/ops/corporate/Corporate'

//corporate (company) screens
import CorporateDashboard from '@/screens/corporate/dashboard/Dashboard'
import CorporateMachines from '@/screens/corporate/machines/Machines'
import CorporateMachineVisit from '@/screens/corporate/machines/MachineVisit'

//404 not found
import NotFound from '@/screens/NotFound/NotFound'

import {
  ADMIN_CORPORATE,
  ADMIN_DASHBOARD,
  ADMIN_FEEDBACK,
  ADMIN_LOCATIONS,
  ADMIN_MACHINE_VISIT,
  ADMIN_MACHINES,
  ADMIN_NOTIFICATIONS,
  ADMIN_POINTS,
  ADMIN_TOPUP,
  ADMIN_USERS,
  COMPANY_INFO,
  COMPANY_MACHINE_VISIT,
  FORGET_PASSWORD,
  LOGIN,
  MACHINE_DASHBOARD,
  MACHINE_MACHINES,
  OPS_CORPORATE,
  OPS_DASHBOARD,
  OPS_FEEDBACK,
  OPS_LOCATIONS,
  OPS_MACHINE_VISIT,
  OPS_MACHINES,
  OPS_POINTS,
  OPS_TOPUP,
  OPS_USERS,
  PRIVACY_POLICY,
  REPORT,
  RESET_PASSWORD,
  SUPERADMIN_CORPORATE,
  SUPERADMIN_CORPORATE_TOPUP,
  SUPERADMIN_DASHBOARD,
  SUPERADMIN_FEEDBACK,
  SUPERADMIN_LOCATIONS,
  SUPERADMIN_MACHINE_VISIT,
  SUPERADMIN_MACHINES,
  SUPERADMIN_NOTIFICATIONS,
  SUPERADMIN_POINTS,
  SUPERADMIN_ROLES,
  SUPERADMIN_TOPUP,
  TEST
} from '@/constants/Constant'
import OpsMachineVisit from '@/screens/ops/machines/MachineVisit'
import Reports from '@/screens/corporate/reports/reports'
import ResetPassword from '@/screens/forgetPassword/ResetPassword'
import CorporateTopup from '@/screens/superAdmin/corporateTopup'
import MobilinkTest from '@/Corporate/Mobilink/MobilinkTest'

const Routing = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path='/' element={<Navigate to={LOGIN} replace />} />
      <Route path={LOGIN} element={<Login />} />
      <Route path={FORGET_PASSWORD} element={<ForgetPassword />} />
      <Route path={RESET_PASSWORD} element={<ResetPassword />} />
      <Route path={COMPANY_INFO} element={<CompanyInfo />} />
      <Route path={PRIVACY_POLICY} element={<PrivacyPolicy />} />

      {/* Protected routes wrapped with Layout */}
      <Route element={<PrivateRouting allowedRoles={["superadmin"]} />}>
        <Route element={<Layout />}>
          <Route path={SUPERADMIN_DASHBOARD} element={<Dashboard />} />
          <Route path={SUPERADMIN_MACHINES} element={<Machines />} />
          <Route path={SUPERADMIN_ROLES} element={<Roles />} />
          <Route path={SUPERADMIN_POINTS} element={<PointShare />} />
          <Route path={SUPERADMIN_LOCATIONS} element={<Locations />} />
          <Route path={SUPERADMIN_TOPUP} element={<Topup />} />
          {/* <Route path={SUPERADMIN_USERS} element={<UsersManagement />} /> */}
          <Route path={SUPERADMIN_NOTIFICATIONS} element={<Notifications />} />
          <Route path={SUPERADMIN_FEEDBACK} element={<Feedback />} />
          <Route path={SUPERADMIN_CORPORATE} element={<Corporate />} />
          <Route path={SUPERADMIN_MACHINE_VISIT} element={<SuperAdminMachineVisit />} />
          <Route path={SUPERADMIN_CORPORATE_TOPUP} element={<CorporateTopup />} />
        </Route>
      </Route>

      <Route element={<PrivateRouting allowedRoles={["admin"]} />}>
        <Route element={<Layout />}>
          <Route path={ADMIN_DASHBOARD} element={<AdminDashboard />} />
          <Route path={ADMIN_MACHINES} element={<AdminMachines />} />
          <Route path={ADMIN_POINTS} element={<AdminPointShare />} />
          <Route path={ADMIN_LOCATIONS} element={<AdminLocations />} />
          <Route path={ADMIN_TOPUP} element={<AdminTopup />} />
          {/* <Route path={ADMIN_USERS} element={<AdminUsersManagement />} /> */}
          <Route path={ADMIN_NOTIFICATIONS} element={<AdminNotifications />} />
          <Route path={ADMIN_FEEDBACK} element={<AdminFeedback />} />
          {/* <Route path={ADMIN_CORPORATE} element={<AdminCorporate />} /> */}
          <Route path={ADMIN_MACHINE_VISIT} element={<AdminMachineVisit />} />
        </Route>
      </Route>

      <Route element={<PrivateRouting allowedRoles={["ops"]} />}>
        <Route element={<Layout />}>
          <Route path={OPS_DASHBOARD} element={<OpsDashboard />} />
          <Route path={OPS_MACHINES} element={<OpsMachines />} />
          <Route path={OPS_POINTS} element={<OpsPointShare />} />
          <Route path={OPS_LOCATIONS} element={<OpsLocations />} />
          <Route path={OPS_TOPUP} element={<OpsTopup />} />
          {/* <Route path={OPS_USERS} element={<OpsUsersManagement />} /> */}
          <Route path={OPS_FEEDBACK} element={<OpsFeedback />} />
          {/* <Route path={OPS_CORPORATE} element={<OpsCorporate />} /> */}
          <Route path={OPS_MACHINE_VISIT} element={<OpsMachineVisit />} />
        </Route>
      </Route>

      {/* ✅ Updated company (corporate) routes to /company/... */}
      <Route element={<PrivateRouting allowedRoles={["company"]} />}>
        <Route element={<Layout />}>
          <Route path={MACHINE_DASHBOARD} element={<CorporateDashboard />} />
          <Route path={MACHINE_MACHINES} element={<CorporateMachines />} />
          <Route path={COMPANY_MACHINE_VISIT} element={<CorporateMachineVisit />} />
          <Route path={TEST} element={<MobilinkTest />} />
          <Route path={REPORT} element={<Reports />} />
        </Route>
      </Route>

      <Route path='*' element={<NotFound />} />
    </Routes>
  )
}

export default Routing
