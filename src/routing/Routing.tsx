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
import AdminDashboard from '@/screens/finance/dashboard/Dashboard'
import { AdminPointShare } from '@/screens/admin/pointsshare/PointShare'
import AdminMachines from '@/screens/finance/machines/Machines'
import AdminLocations from '@/screens/admin/locations/Locations'
import { AdminTopup } from '@/screens/admin/topup/Topup'
import AdminNotifications from '@/screens/admin/notification/Notifications'
import AdminFeedback from '@/screens/admin/feedback/Feedback'
import AdminMachineVisit from '@/screens/finance/machines/MachineVisit'

//ops screens
import OpsDashboard from '@/screens/ops/dashboard/Dashboard'
import { OpsPointShare } from '@/screens/ops/pointsshare/PointShare'
import OpsMachines from '@/screens/ops/machines/Machines'
import OpsLocations from '@/screens/ops/locations/Locations'
import { OpsTopup } from '@/screens/ops/topup/Topup'
import OpsFeedback from '@/screens/ops/feedback/Feedback'

// FulFillMENT Screens
import FulfillDashboard from "@/screens/fulfillment/dashboard/Dashboard";
import FulfillMachines from "@/screens/fulfillment/machines/Machines";
import FulfillLocations from "@/screens/fulfillment/locations/Locations";
import FulfillMachineVisit from "@/screens/fulfillment/machines/MachineVisit"

// Finane Screens
import FinanceDashboard from "@/screens/finance/dashboard/Dashboard"
import FinanceMachines from "@/screens/finance/machines/Machines";
import FinanceMachineVisit from "@/screens/finance/machines/MachineVisit"

//corporate (company) screens
import CorporateDashboard from '@/screens/corporate/dashboard/Dashboard'
import CorporateMachines from '@/screens/corporate/machines/Machines'
import CorporateMachineVisit from '@/screens/corporate/machines/MachineVisit'

//404 not found
import NotFound from '@/screens/NotFound/NotFound'

import {
  ADD_EMPLOYEES,
  ADMIN_CASH_COLLECTION,
  ADMIN_CORPORATE_TOPUP,
  ADMIN_DASHBOARD,
  ADMIN_FEEDBACK,
  ADMIN_LOCATIONS,
  ADMIN_MACHINE_MAP,
  ADMIN_MACHINE_VISIT,
  ADMIN_MACHINES,
  ADMIN_NOTIFICATIONS,
  ADMIN_POINTS,
  ADMIN_TOPUP,
  CASH_COLLECTIONS,
  COMPANY_INFO,
  COMPANY_MACHINE_VISIT,
  CORPORATE_CASH_COLLECTION,
  DELETE_EMPLOYEES,
  FINANCE_CASH_COLLECTIONS,
  FINANCE_DASHBOARD,
  FINANCE_LOCATIONS,
  FINANCE_MACHINE_MAP,
  FINANCE_MACHINE_VISIT,
  FINANCE_MACHINES,
  FINANCE_TOPUP,
  FORGET_PASSWORD,
  FULFill_DASHBOARD,
  FULFill_LOCATIONS,
  FULFill_MACHINE_MAP,
  FULFill_MACHINE_VISIT,
  FULFill_MACHINES,
  FULFill_TOPUP,
  FULLFiLL_MAINTAINCE,
  LOGIN,
  MACHINE_DASHBOARD,
  MACHINE_MACHINES,
  MAINTAINCE_REQUESTS,
  OPS_DASHBOARD,
  OPS_FEEDBACK,
  OPS_LOCATIONS,
  OPS_MACHINE_MAP,
  OPS_MACHINE_VISIT,
  OPS_MACHINES,
  OPS_POINTS,
  OPS_TOPUP,
  PRIVACY_POLICY,
  REPORT,
  RESET_PASSWORD,
  SUPERADMIN_ADD_EMPLOYEES,
  SUPERADMIN_CASH_COLLECTION,
  SUPERADMIN_CORPORATE,
  SUPERADMIN_CORPORATE_TOPUP,
  SUPERADMIN_DASHBOARD,
  SUPERADMIN_DELETE_EMPLOYEES,
  SUPERADMIN_FEEDBACK,
  SUPERADMIN_LOCATIONS,
  SUPERADMIN_MACHINE_MAP,
  SUPERADMIN_MACHINE_VISIT,
  SUPERADMIN_MACHINES,
  SUPERADMIN_NOTIFICATIONS,
  SUPERADMIN_POINTS,
  SUPERADMIN_RIDER_LOCATION,
  SUPERADMIN_KNOWLEDGE_BASE,
  SUPERADMIN_ROLES,
  SUPERADMIN_TOPUP,
  USERS,
} from '@/constants/Constant'
import OpsMachineVisit from '@/screens/ops/machines/MachineVisit'
import Reports from '@/screens/corporate/reports/reports'
import ResetPassword from '@/screens/forgetPassword/ResetPassword'
import CorporateTopup from '@/screens/superAdmin/corporateTopup'
import { FulfillmentTopup } from '@/screens/fulfillment/topup/Topup'
import AddMaintenanceSchedule from '@/screens/fulfillment/maintaince/AddMaintainceSchedule'
import AdminMaintenanceRequests from '@/screens/fulfillment/maintaince/getMaintainceRequests'
import AdminCorporateTopup from '@/screens/admin/corporateTopup'
import AllUsers from '@/Corporate/Mobilink/allUsers/allUsers'
import AddEmployees from '@/Corporate/Mobilink/addEmployees/AddEmployees'
import BulkDelete from '@/Corporate/Mobilink/deleteEmployees/BulkDelete'
import CashCollectionPage from '@/screens/fulfillment/cashCollections/cashCollection'
import SuperAdminCashCollectionPage from '@/screens/superAdmin/cashCollections/cashCollection'
import SuperAdminAddEmployees from '@/Corporate/superadmin/addEmployees/AddEmployees'
import SuperAdminBulkDelete from '@/Corporate/superadmin/deleteEmployees/BulkDelete'
import SuperAdminMachineMap from '@/screens/superAdmin/MachinesMap/MachineMap'
import AdminMachineMap from '@/screens/admin/MachinesMap/MachineMap'
import FulfillMachineMap from '@/screens/fulfillment/MachinesMap/MachineMap'
import OpsMachineMap from '@/screens/ops/MachinesMap/MachineMap'
import AdminCashCollectionPage from '@/screens/admin/cashCollections/cashCollection'
import CorporateCashCollectionPage from '@/screens/corporate/cashCollections/cashCollectionCorporate'
import SuperAdminRiderLocation from '@/screens/superAdmin/RiderLocation/RiderLocation'
import KnowledgeBase from '@/screens/superAdmin/knowledgeBase/KnowledgeBase'
import { FinanceTopup } from '@/screens/finance/topup/Topup'
import FinanceCashCollectionPage from '@/screens/finance/cashCollections/cashCollection'
import FinanceMachineMap from '@/screens/finance/MachinesMap/MachineMap'

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
          <Route path={SUPERADMIN_MACHINE_MAP} element={<SuperAdminMachineMap />} />
          <Route path={SUPERADMIN_RIDER_LOCATION} element={<SuperAdminRiderLocation />}/>
          {/* this one */}
          <Route path={SUPERADMIN_CASH_COLLECTION} element={<SuperAdminCashCollectionPage />} />
          <Route path={SUPERADMIN_ADD_EMPLOYEES} element={<SuperAdminAddEmployees />} />
          <Route path={SUPERADMIN_DELETE_EMPLOYEES} element={<SuperAdminBulkDelete />} />
          <Route path={SUPERADMIN_KNOWLEDGE_BASE} element={<KnowledgeBase />} />
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
          <Route path={ADMIN_CORPORATE_TOPUP} element={<AdminCorporateTopup />} />
          <Route path={ADMIN_MACHINE_MAP} element={<AdminMachineMap />} />
          <Route path={ADMIN_CASH_COLLECTION} element={<AdminCashCollectionPage />} />
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
          <Route path={OPS_MACHINE_MAP} element={<OpsMachineMap />} />
        </Route>
      </Route>

      <Route element={<PrivateRouting allowedRoles={["fulfill"]} />}>
        <Route element={<Layout />}>
          <Route path={FULFill_DASHBOARD} element={< FulfillDashboard />} />
          <Route path={FULFill_MACHINES} element={<FulfillMachines />} />
          <Route path={FULFill_LOCATIONS} element={<FulfillLocations />} /> 
          <Route path={FULFill_TOPUP} element={<FulfillmentTopup />} />
          <Route path={FULFill_MACHINE_VISIT} element={<FulfillMachineVisit />} />
          <Route path={FULLFiLL_MAINTAINCE} element={<AddMaintenanceSchedule />} />
          <Route path={MAINTAINCE_REQUESTS} element={<AdminMaintenanceRequests />} />
          <Route path={CASH_COLLECTIONS} element={<CashCollectionPage />} />
          <Route path={FULFill_MACHINE_MAP} element={<FulfillMachineMap />} />
        </Route>
      </Route>

      <Route element={<PrivateRouting allowedRoles={["finance"]} />}>
        <Route element={<Layout />}>
          <Route path={FINANCE_DASHBOARD} element={< FinanceDashboard />} />
          <Route path={FINANCE_MACHINES} element={<FinanceMachines />} />
          <Route path={FINANCE_TOPUP} element={<FinanceTopup />} />
          <Route path={FINANCE_MACHINE_VISIT} element={<FinanceMachineVisit />} />
          <Route path={FINANCE_CASH_COLLECTIONS} element={<FinanceCashCollectionPage />} />
          <Route path={FINANCE_MACHINE_MAP} element={<FinanceMachineMap />} />
        </Route>
      </Route>

      {/* ✅ Updated company (corporate) routes to /company/... */}
      <Route element={<PrivateRouting allowedRoles={["company"]} />}>
        <Route element={<Layout />}>
          <Route path={MACHINE_DASHBOARD} element={<CorporateDashboard />} />
          <Route path={MACHINE_MACHINES} element={<CorporateMachines />} />
          <Route path={COMPANY_MACHINE_VISIT} element={<CorporateMachineVisit />} />
          <Route path={REPORT} element={<Reports />} />
          <Route path={USERS} element={<AllUsers />} />
          <Route path={ADD_EMPLOYEES} element={<AddEmployees />} />
          <Route path={DELETE_EMPLOYEES} element={<BulkDelete />} />
          <Route path={CORPORATE_CASH_COLLECTION} element={<CorporateCashCollectionPage />} />
          
        </Route>
      </Route>

      <Route path='*' element={<NotFound />} />
    </Routes>
  )
}

export default Routing
