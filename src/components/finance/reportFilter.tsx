import React from "react";

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
  <div className="flex flex-wrap gap-4 items-end mb-8 bg-gray-50 p-5 rounded-xl shadow-sm">
    <div className="flex flex-wrap gap-5 flex-1">
      <label className="flex flex-col text-sm font-medium text-gray-700 gap-1">
        Start Date:
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-base w-56 max-w-full focus:border-blue-500 focus:outline-none"
        />
      </label>
      <label className="flex flex-col text-sm font-medium text-gray-700 gap-1">
        End Date:
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-base w-56 max-w-full focus:border-blue-500 focus:outline-none"
        />
      </label>
    </div>
    <button
      onClick={onFetch}
      disabled={loading}
      className={`px-6 py-2.5 rounded-lg text-white font-medium transition-colors duration-200 h-11 ${
        loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      {loading ? "Generating..." : "Get Report"}
    </button>
  </div>
);

export default ReportFilters;