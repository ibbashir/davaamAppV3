import { MachineVisitPage } from "@/components/machine-visit/machine-visit-page";
import { SiteHeader } from "@/components/admin/site-header";
import { ADMIN_MACHINES } from "@/constants/Constant";

export default function AdminMachineVisit() {
  return (
    <MachineVisitPage
      apiBase="/admin"
      header={<SiteHeader title="🌍 Admin Machine Dashboard" />}
      backTo={ADMIN_MACHINES}
    />
  );
}
