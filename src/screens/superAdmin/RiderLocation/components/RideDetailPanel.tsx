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
  const isCompleted = ride.status?.toLowerCase() === "completed";
  const endTime = isCompleted ? ride.end_time : undefined;
  const stops = ride.stops ?? [];
  const visited = stops.filter((s) => s.arrived).length;

  return (
    <div className="fixed inset-0 z-[99999] flex">
      {/* Click-away backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-teal-600 text-white">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🗺️</span>
            <h3 className="font-bold text-base">Ride #{ride.id} — Route Map</h3>
            <span className="text-teal-200 text-sm">· {ride.username ?? `User #${ride.user_id}`}</span>
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
        <div className={`grid ${stops.length > 0 ? "grid-cols-4" : "grid-cols-3"} divide-x border-b bg-gray-50 text-center text-sm`}>
          <StatCell label="Distance" value={formatDistance(ride.total_distance_km)} />
          <StatCell label="Duration" value={formatDuration(ride.start_time, endTime)} />
          {stops.length > 0 && (
            <StatCell label="Stops" value={`${visited}/${stops.length} visited`} />
          )}
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
            value={isCompleted ? formatDateTime(ride.end_time) : "—"}
          />
        </div>

        {/* Itinerary: every machine stop in visit order (batch rides) */}
        {stops.length > 0 && <StopItinerary stops={stops} />}

        {/* Map */}
        <div className="flex-1 relative">
          <RideRouteMap ride={ride} />
          <MapLegend hasStops={stops.length > 0} />
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

const MapLegend: React.FC<{ hasStops: boolean }> = ({ hasStops }) => (
  <div className="absolute bottom-3 left-3 z-[9999] bg-white rounded-lg shadow-md px-3 py-2 text-xs space-y-1">
    <LegendItem color="bg-blue-500"  label="Start point" />
    {hasStops && <LegendItem color="bg-amber-500" label="Machine stops (numbered)" />}
    <LegendItem color="bg-red-500"   label="End point" />
    <div className="flex items-center space-x-2">
      <div className="w-6 border-t-[3px] border-teal-600" />
      <span className="text-gray-600">Traveled path</span>
    </div>
    <div className="flex items-center space-x-2">
      <div className="w-6 border-t-2 border-dashed border-indigo-500" />
      <span className="text-gray-600">Road route</span>
    </div>
  </div>
);

/** Compact visit-order list of the ride's machine stops. */
const StopItinerary: React.FC<{ stops: NonNullable<RideHistory["stops"]> }> = ({ stops }) => (
  <div className="px-5 py-3 border-b bg-white flex-shrink-0">
    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
      Route · {stops.length} stop{stops.length > 1 ? "s" : ""}
    </p>
    <div className="space-y-1 max-h-32 overflow-y-auto pr-0.5">
      {stops.map((stop, i) => (
        <div
          key={i}
          className={`flex items-center gap-1.5 text-xs rounded border px-1.5 py-1 min-w-0 ${
            stop.arrived
              ? "bg-green-50 border-green-100 text-green-700"
              : "bg-gray-50 border-gray-100 text-gray-500"
          }`}
        >
          <span
            className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
              stop.arrived ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            {stop.arrived ? "✓" : i + 1}
          </span>
          <span className="truncate font-medium flex-1">{stop.name}</span>
          {stop.machineCode && (
            <span className="flex-shrink-0 text-[10px] text-gray-400">{stop.machineCode}</span>
          )}
          <span className="flex-shrink-0 text-[10px] font-semibold">
            {stop.arrived ? "visited" : "skipped"}
          </span>
        </div>
      ))}
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