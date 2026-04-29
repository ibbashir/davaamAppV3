import React, { useEffect, useState } from "react";
import { BASE_URL } from "@/constants/Constant";
import { getRequest } from "@/Apis/Api";
import type { RideHistory, RideHistoryPagination, RideHistoryResponse } from "../../../../Types/SuperAdmin/rider";
import { formatDuration, formatDateTime, formatDistance } from "../../../../utils/formatters";
import RideStatusBadge from "./RideStatusBadge";
import RideDetailPanel from "./RideDetailPanel";

interface Props {
  onClose: () => void;
}

/**
 * Modal panel listing all ride history with filtering controls.
 * Clicking "View Map" on any row opens the RideDetailPanel slide-over.
 */
const RideHistoryPanel: React.FC<Props> = ({ onClose }) => {
  const [history,    setHistory]    = useState<RideHistory[]>([]);
  const [pagination, setPagination] = useState<RideHistoryPagination | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [selectedRide, setSelectedRide] = useState<RideHistory | null>(null);

  // Filter state
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUserId, setFilterUserId] = useState("");
  const [startDate,    setStartDate]    = useState("");
  const [endDate,      setEndDate]      = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await getRequest<RideHistoryResponse>(
          `${BASE_URL}/superadmin/getRideHistory`,
        );
        setHistory(response.data);
        setPagination(response.pagination);
        setError(null);
      } catch {
        setError("Failed to fetch ride history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filtered = history.filter((ride) => {
    const rideStart = new Date(ride.start_time).getTime();
    return (
      (filterStatus === "all" || ride.status === filterStatus) &&
      (!filterUserId || String(ride.user_id).includes(filterUserId.trim())) &&
      (!startDate || rideStart >= new Date(startDate).getTime()) &&
      (!endDate   || rideStart <= new Date(endDate).getTime() + 86_400_000)
    );
  });

  return (
    <>
      {selectedRide && (
        <RideDetailPanel ride={selectedRide} onClose={() => setSelectedRide(null)} />
      )}

      <div className="fixed inset-0 z-[9998] flex">
        {/* Backdrop — click to close */}
        <div
          className="flex-1 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Drawer panel */}
        <div className="w-full max-w-4xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

          {/* Header */}
          <PanelHeader
            filteredCount={filtered.length}
            totalCount={pagination?.total ?? 0}
            onClose={onClose}
          />

          {/* Filters */}
          <RideFilters
            filterUserId={filterUserId}
            filterStatus={filterStatus}
            startDate={startDate}
            endDate={endDate}
            onUserIdChange={setFilterUserId}
            onStatusChange={setFilterStatus}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />

          {/* Table */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <CenteredMessage>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                  <span>Loading rides…</span>
                </div>
              </CenteredMessage>
            ) : error ? (
              <CenteredMessage className="text-red-500">{error}</CenteredMessage>
            ) : filtered.length === 0 ? (
              <CenteredMessage>No rides found</CenteredMessage>
            ) : (
              <RideTable rides={filtered} onViewMap={setSelectedRide} />
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between flex-shrink-0">
            <p className="text-xs text-gray-400">
              Showing {filtered.length} of {pagination?.total ?? 0} total rides
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const PanelHeader: React.FC<{
  filteredCount: number;
  totalCount: number;
  onClose: () => void;
}> = ({ filteredCount, totalCount, onClose }) => (
  <div className="flex items-center justify-between px-6 py-4 bg-teal-600 text-white flex-shrink-0">
    <div className="flex items-center space-x-2">
      <span className="text-xl">🏍️</span>
      <h2 className="text-lg font-bold">Ride History</h2>
      <span className="ml-2 px-2 py-0.5 bg-teal-500/60 text-white text-xs rounded-full font-medium">
        {filteredCount} / {totalCount} rides
      </span>
    </div>
    <button
      onClick={onClose}
      className="text-white/70 hover:text-white transition text-2xl leading-none"
      aria-label="Close"
    >
      ×
    </button>
  </div>
);

interface FilterProps {
  filterUserId: string;
  filterStatus: string;
  startDate: string;
  endDate: string;
  onUserIdChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
}

const RideFilters: React.FC<FilterProps> = ({
  filterUserId, filterStatus, startDate, endDate,
  onUserIdChange, onStatusChange, onStartDateChange, onEndDateChange,
}) => (
  <div className="px-6 py-3 border-b bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-3">
    <input
      type="text"
      placeholder="Filter by User ID..."
      value={filterUserId}
      onChange={(e) => onUserIdChange(e.target.value)}
      className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
    />
    <select
      value={filterStatus}
      onChange={(e) => onStatusChange(e.target.value)}
      className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
    >
      <option value="all">All Statuses</option>
      <option value="ongoing">Ongoing</option>
      <option value="completed">Completed</option>
    </select>
    <input
      type="date"
      value={startDate}
      onChange={(e) => onStartDateChange(e.target.value)}
      className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
    />
    <input
      type="date"
      value={endDate}
      onChange={(e) => onEndDateChange(e.target.value)}
      className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
    />
  </div>
);

const RideTable: React.FC<{
  rides: RideHistory[];
  onViewMap: (ride: RideHistory) => void;
}> = ({ rides, onViewMap }) => (
  <table className="w-full text-sm">
    <thead className="bg-gray-50 sticky top-0 z-10">
      <tr>
        {["#", "Username", "Status", "Start Time", "End Time", "Duration", "Distance", "Route"].map(
          (heading) => (
            <th
              key={heading}
              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
            >
              {heading}
            </th>
          )
        )}
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
      {rides.map((ride) => (
        <RideTableRow key={ride.id} ride={ride} onViewMap={onViewMap} />
      ))}
    </tbody>
  </table>
);

const RideTableRow: React.FC<{
  ride: RideHistory;
  onViewMap: (ride: RideHistory) => void;
}> = ({ ride, onViewMap }) => {
  const endTime = ride.status === "completed" ? ride.end_time : undefined;

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-4 py-3 text-gray-400 text-xs">{ride.id}</td>
      <td className="px-4 py-3 font-medium text-gray-800">{ride.username}</td>
      <td className="px-4 py-3"><RideStatusBadge status={ride.status} /></td>
      <td className="px-4 py-3 text-gray-600">{formatDateTime(ride.start_time)}</td>
      <td className="px-4 py-3 text-gray-600">
        {ride.status === "completed" ? formatDateTime(ride.end_time) : "—"}
      </td>
      <td className="px-4 py-3 text-gray-600">
        {formatDuration(ride.start_time, endTime)}
      </td>
      <td className="px-4 py-3 text-gray-600">
        {formatDistance(ride.total_distance_km) === "—"
          ? <span className="text-gray-300">—</span>
          : formatDistance(ride.total_distance_km)}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onViewMap(ride)}
          className="flex items-center space-x-1 px-2.5 py-1 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-lg text-xs font-medium transition"
        >
          <MapIcon />
          <span>View Map</span>
        </button>
      </td>
    </tr>
  );
};

const MapIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
    />
  </svg>
);

const CenteredMessage: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "text-gray-500",
}) => (
  <div className={`flex items-center justify-center h-40 ${className}`}>
    {children}
  </div>
);

export default RideHistoryPanel;