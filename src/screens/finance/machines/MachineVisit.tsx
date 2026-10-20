import { MachineVisitPage } from "@/components/machine-visit/machine-visit-page";
import { SiteHeader } from "@/components/finance/site-header";
import { FINANCE_MACHINES } from "@/constants/Constant";

export default function FinanceMachineVisit() {
  return (
    <MachineVisitPage
      apiBase="/finance"
      header={<SiteHeader title="🌍 Finance Machine Dashboard" />}
      backTo={FINANCE_MACHINES}
    />
  );
}
