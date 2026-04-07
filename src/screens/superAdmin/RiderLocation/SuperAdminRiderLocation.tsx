import React, { useEffect, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { BASE_URL_STOCK } from "@/constants/Constant";
import { createRiderIcon, createStartIcon } from "@/constants/mapIcons";
import { RecenterMap } from "./components/MapControls";
import RideHistoryPanel from "./components/RideHistoryPanel";
import type { RiderLocation } from "@/Types/SuperAdmin/rider";

const POLLING_INTERVAL_MS = 5_000;
const DEFAULT_CENTER: [number, number] = [40.7128, -74.006];

/**
 * SuperAdminRiderLocation
 *
 * Top-level page that polls the live-location API and renders all active riders
 * on a Leaflet map. Ride history is accessible via the "Ride History" button.
 */
const SuperAdminRiderLocation: React.FC = () => {
  const [riders,     setRiders]     = useState<RiderLocation[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [mapCenter,  setMapCenter]  = useState<[number, number]>(DEFAULT_CENTER);
  const [showHistory, setShowHistory] = useState(false);

  const fetchLocations = async () => {
    try {
      const { data, status } = await axios.get<RiderLocation[]>(
        `${BASE_URL_STOCK}/getliveLocationTrack`
      );
      if (status !== 200) throw new Error("Failed to fetch rider locations");
      setRiders(data);
      setLastUpdate(new Date());
      if (data.length > 0) setMapCenter([data[0].lat, data[0].lng]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const activeCount = riders.filter((r) => r.active).length;

  return (
    <div className="h-screen flex flex-col">
      {showHistory && <RideHistoryPanel onClose={() => setShowHistory(false)} />}

      <LiveMapHeader
        activeCount={activeCount}
        totalCount={riders.length}
        lastUpdate={lastUpdate}
        onRefresh={fetchLocations}
        onShowHistory={() => setShowHistory(true)}
      />

      <div className="flex-1 relative">
        {loading && riders.length === 0 ? (
          <MapPlaceholder>Loading rider locations…</MapPlaceholder>
        ) : error ? (
          <MapPlaceholder className="text-red-500">Error: {error}</MapPlaceholder>
        ) : (
          <MapContainer center={mapCenter} zoom={12} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {riders.map((rider) => (
              <RiderMapLayer key={rider.riderId} rider={rider} />
            ))}
            <RecenterMap center={mapCenter} />
          </MapContainer>
        )}
      </div>
    </div>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────────

interface HeaderProps {
  activeCount: number;
  totalCount: number;
  lastUpdate: Date | null;
  onRefresh: () => void;
  onShowHistory: () => void;
}

const LiveMapHeader: React.FC<HeaderProps> = ({
  activeCount, totalCount, lastUpdate, onRefresh, onShowHistory,
}) => (
  <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-blue-600 rounded-lg">
        <LocationPinIcon />
      </div>
      <h1 className="text-xl font-bold text-gray-900">Rider Live Locations</h1>
    </div>

    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2 text-sm">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
          🟢 {activeCount} Active
        </span>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600 font-medium">{totalCount} Total</span>
      </div>

      <span className="text-xs text-gray-400">
        Last update: {lastUpdate ? lastUpdate.toLocaleTimeString() : "never"}
      </span>

      <button
        onClick={onShowHistory}
        className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition"
      >
        <ClockIcon />
        <span>Ride History</span>
      </button>

      <button
        onClick={onRefresh}
        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
      >
        Refresh
      </button>
    </div>
  </header>
);

/** Renders a single rider's route line, start pin, and current-position marker. */
const RiderMapLayer: React.FC<{ rider: RiderLocation }> = ({ rider }) => {
  const hasStartPin =
    rider.status === "ongoing" &&
    rider.start_lat !== 0 &&
    rider.start_lng !== 0;

  return (
    <React.Fragment>
      {hasStartPin && (
        <Polyline
          positions={[[rider.start_lat, rider.start_lng], [rider.lat, rider.lng]]}
          pathOptions={{
            color: rider.active ? "#10b981" : "#6b7280",
            weight: 3,
            opacity: 0.7,
            dashArray: "6 4",
          }}
        />
      )}

      {hasStartPin && (
        <Marker position={[rider.start_lat, rider.start_lng]} icon={createStartIcon()}>
          <Popup>
            <div className="text-sm space-y-1">
              <p className="font-bold text-blue-600">📍 Ride Start</p>
              <p>Rider: {rider.riderName ?? rider.riderId}</p>
              <p>
                Started:{" "}
                {rider.startTime
                  ? new Date(rider.startTime).toLocaleTimeString()
                  : "N/A"}
              </p>
            </div>
          </Popup>
        </Marker>
      )}

      <Marker
        position={[rider.lat, rider.lng]}
        icon={createRiderIcon(rider.active, rider.bearing, rider.riderName)}
      >
        <Popup>
          <div className="text-sm space-y-1">
            <p className="font-bold text-gray-800">🏍️ {rider.riderName ?? rider.riderId}</p>
            <p>Status: {rider.active ? "🟢 Active" : "⚪ Inactive"}</p>
            <p>Ride: {rider.status === "ongoing" ? "🔵 Ongoing" : "✅ Completed"}</p>
            <p>Speed: {rider.speed.toFixed(1)} km/h</p>
            <p>Bearing: {rider.bearing}°</p>
            <p>
              Distance:{" "}
              {rider.total_distance ? `${rider.total_distance.toFixed(2)} km` : "N/A"}
            </p>
            <p>
              Last update:{" "}
              {rider.updatedAt
                ? new Date(rider.updatedAt).toLocaleTimeString()
                : "N/A"}
            </p>
          </div>
        </Popup>
      </Marker>
    </React.Fragment>
  );
};

const MapPlaceholder: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "text-gray-500",
}) => (
  <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 ${className}`}>
    {children}
  </div>
);

// ─── Icon helpers ─────────────────────────────────────────────────────────────

const LocationPinIcon: React.FC = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ClockIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default SuperAdminRiderLocation;