import { MachineVisitPage } from "@/components/machine-visit/machine-visit-page";
import { SiteHeader } from "@/components/ops/site-header";
import { OPS_MACHINES } from "@/constants/Constant";

export default function OpsMachineVisit() {
  return (
    <MachineVisitPage
      apiBase="/ops"
      header={<SiteHeader title="🌍 Operations Machine Dashboard" />}
      backTo={OPS_MACHINES}
    />
  );
}
