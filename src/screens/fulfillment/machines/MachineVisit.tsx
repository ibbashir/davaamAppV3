import { MachineVisitPage } from "@/components/machine-visit/machine-visit-page";
import { SiteHeader } from "@/components/fulfillment/site-header";
import { FULFill_MACHINES } from "@/constants/Constant";

export default function FulfillmentMachineVisit() {
  return (
    <MachineVisitPage
      apiBase="/fulfillment"
      header={<SiteHeader title="🌍 Fulfillment Machine Dashboard" />}
      backTo={FULFill_MACHINES}
    />
  );
}
