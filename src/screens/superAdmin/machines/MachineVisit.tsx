import { MachineVisitPage } from "@/components/machine-visit/machine-visit-page";
import { SiteHeader } from "@/components/superAdmin/site-header";
import { SUPERADMIN_MACHINES } from "@/constants/Constant";

export default function SuperAdminMachineVisit() {
  return (
    <MachineVisitPage
      apiBase="/superadmin"
      header={<SiteHeader title="🌍 SuperAdmin Machine Dashboard" />}
      backTo={SUPERADMIN_MACHINES}
    />
  );
}
