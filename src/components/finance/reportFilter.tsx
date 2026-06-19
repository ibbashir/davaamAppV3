import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";

interface Props {
  startDate: string;
  endDate: string;
  loading: boolean;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onFetch: () => void;
}

const ReportFilters: React.FC<Props> = ({
  startDate, endDate, loading,
  onStartDateChange, onEndDateChange, onFetch,
}) => (
  <div className="flex flex-wrap items-end gap-4">
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="report-start-date">Start Date</Label>
      <Input
        id="report-start-date"
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="w-44"
      />
    </div>
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="report-end-date">End Date</Label>
      <Input
        id="report-end-date"
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="w-44"
      />
    </div>
    <Button onClick={onFetch} disabled={loading} className="bg-teal-600 hover:bg-teal-700">
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Search className="h-4 w-4" />
          Get Report
        </>
      )}
    </Button>
  </div>
);

export default ReportFilters;
