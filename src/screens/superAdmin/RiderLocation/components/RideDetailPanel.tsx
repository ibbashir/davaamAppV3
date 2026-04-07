import React from "react";
import type { RideHistory } from "../../../../Types/SuperAdmin/rider";
import { formatDuration, formatDateTime, formatDistance } from "../../../../utils/formatters";
import RideRouteMap from "./RideRouteMap";
import RideStatusBadge from "./RideStatusBadge";

interface Props {
  ride: RideHistory;
  onClose: () => void;
}

/**
 * Full-screen slide-over panel showing a ride's stats and route map.
 * The dimmed left area acts as a click-away close target.
 */
const RideDetailPanel: React.FC<Props> = ({ ride, onClose }) => {
  const endTime = ride.status === "completed" ? ride.end_time : undefined;

  return (
    <div className="fixed inset-0 z-[99999] flex">
      {/* Click-away backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-indigo-600 text-white">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🗺️</span>
            <h3 className="font-bold text-base">Ride #{ride.id} — Route Map</h3>
            <span className="text-indigo-200 text-sm">· User #{ride.user_id}</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-2xl leading-none"
            aria-label="Close panel"
          >
            ×
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x border-b bg-gray-50 text-center text-sm">
          <StatCell label="Distance" value={formatDistance(ride.total_distance_km)} />
          <StatCell label="Duration" value={formatDuration(ride.start_time, endTime)} />
          <StatCell
            label="Status"
            value={<RideStatusBadge status={ride.status} />}
          />
        </div>

        {/* Times row */}
        <div className="grid grid-cols-2 divide-x border-b text-sm">
          <TimeCell label="Start Time" value={formatDateTime(ride.start_time)} />
          <TimeCell
            label="End Time"
            value={ride.status === "completed" ? formatDateTime(ride.end_time) : "—"}
          />
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <RideRouteMap ride={ride} />
          <MapLegend />
        </div>
      </div>
    </div>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const StatCell: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="px-4 py-3">
    <p className="text-xs text-gray-400 uppercase font-medium">{label}</p>
    <p className="font-bold text-gray-800 mt-0.5">{value}</p>
  </div>
);

const TimeCell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="px-5 py-3">
    <p className="text-xs text-gray-400 uppercase font-medium">{label}</p>
    <p className="text-gray-700 mt-0.5">{value}</p>
  </div>
);

const MapLegend: React.FC = () => (
  <div className="absolute bottom-3 left-3 z-[9999] bg-white rounded-lg shadow-md px-3 py-2 text-xs space-y-1">
    <LegendItem color="bg-blue-500"  label="Start point" />
    <LegendItem color="bg-red-500"   label="End point" />
    <div className="flex items-center space-x-2">
      <div className="w-6 border-t-2 border-dashed border-indigo-500" />
      <span className="text-gray-600">Route</span>
    </div>
  </div>
);

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center space-x-2">
    <div className={`w-3 h-3 rounded-full ${color}`} />
    <span className="text-gray-600">{label}</span>
  </div>
);

export default RideDetailPanel;