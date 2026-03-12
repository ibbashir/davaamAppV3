import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { BASE_URL_STOCK } from "@/constants/Constant";

// Fix for default marker icons in Leaflet with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Define types for rider location data
interface RiderLocation {
  riderId: string;
  lat: number;
  lng: number;
  speed: number;
  bearing: number;
  updatedAt: number | null;
  active: boolean;
  riderName: string | null;
  start_lat: number;
  start_lng: number;
  startTime: number;
  total_distance: number;
  status: string | null;
}

// Custom motorbike marker icon
const createRiderIcon = (active: boolean, bearing: number, riderName: string | null) => {
  const color = active ? "#10b981" : "#6b7280";
  return L.divIcon({
    html: `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="transform: rotate(${bearing}deg); width: 36px; height: 36px;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="36" height="36">
            <circle cx="32" cy="32" r="30" fill="${color}" opacity="0.15"/>
            <g fill="${color}" stroke="${color}" stroke-width="0.5">
              <circle cx="16" cy="40" r="8" fill="none" stroke="${color}" stroke-width="3"/>
              <circle cx="16" cy="40" r="2" fill="${color}"/>
              <circle cx="50" cy="40" r="8" fill="none" stroke="${color}" stroke-width="3"/>
              <circle cx="50" cy="40" r="2" fill="${color}"/>
              <line x1="16" y1="40" x2="34" y2="24" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
              <line x1="34" y1="24" x2="50" y2="40" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
              <line x1="24" y1="40" x2="44" y2="40" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
              <rect x="26" y="30" width="14" height="10" rx="2" fill="${color}"/>
              <line x1="44" y1="24" x2="52" y2="24" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
              <line x1="50" y1="22" x2="50" y2="28" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
              <rect x="24" y="24" width="18" height="5" rx="2" fill="${color}"/>
              <circle cx="34" cy="18" r="6" fill="${color}"/>
              <rect x="28" y="20" width="12" height="4" rx="1" fill="${color}" opacity="0.7"/>
            </g>
          </svg>
        </div>
        <div style="
          margin-top: 2px;
          background-color: ${color};
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 999px;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
        ">
          ${riderName ?? "Unknown"}
        </div>
      </div>`,
    className: "rider-marker",
    iconSize: [36, 52],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

// Green circle icon for ride start point
const createStartIcon = () =>
  L.divIcon({
    html: `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="
          width: 14px; height: 14px;
          background-color: #3b82f6;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        "></div>
        <div style="
          margin-top: 2px;
          background-color: #3b82f6;
          color: white;
          font-size: 9px;
          font-weight: 600;
          padding: 1px 5px;
          border-radius: 999px;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        ">Start</div>
      </div>`,
    className: "",
    iconSize: [14, 28],
    iconAnchor: [7, 7],
    popupAnchor: [0, -14],
  });

// Component to recenter map
const RecenterMap: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

// Format seconds into hh:mm:ss
const formatDuration = (startTime: number): string => {
  if (!startTime) return "N/A";
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
};

const SuperAdminRiderLocation: React.FC = () => {
  const [riders, setRiders] = useState<RiderLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.006]);

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${BASE_URL_STOCK}/getliveLocationTrack`);
      if (response.status !== 200) throw new Error("Failed to fetch rider locations");

      const data: RiderLocation[] = response.data;
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
    const interval = setInterval(fetchLocations, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeCount = riders.filter((r) => r.active).length;
  const totalCount = riders.length;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
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
          <div className="text-xs text-gray-400">
            Last update: {lastUpdate ? lastUpdate.toLocaleTimeString() : "never"}
          </div>
          <button
            onClick={fetchLocations}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative">
        {loading && riders.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-gray-500">Loading rider locations...</div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-red-500">Error: {error}</div>
          </div>
        ) : (
          <MapContainer center={mapCenter} zoom={12} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {riders.map((rider) => (
              <React.Fragment key={rider.riderId}>

                {/* Route line: start → current position (only if ride is ongoing and start coords exist) */}
                {rider.status === "ongoing" && rider.start_lat !== 0 && rider.start_lng !== 0 && (
                  <Polyline
                    positions={[
                      [rider.start_lat, rider.start_lng],
                      [rider.lat, rider.lng],
                    ]}
                    pathOptions={{
                      color: rider.active ? "#10b981" : "#6b7280",
                      weight: 3,
                      opacity: 0.7,
                      dashArray: "6 4",  // dashed line to distinguish from roads
                    }}
                  />
                )}

                {/* Start point marker (only if ride is ongoing and start coords exist) */}
                {rider.status === "ongoing" && rider.start_lat !== 0 && rider.start_lng !== 0 && (
                  <Marker
                    position={[rider.start_lat, rider.start_lng]}
                    icon={createStartIcon()}
                  >
                    <Popup>
                      <div className="text-sm space-y-1">
                        <p className="font-bold text-blue-600">📍 Ride Start</p>
                        <p>Rider: {rider.riderName ?? rider.riderId}</p>
                        <p>Started: {rider.startTime ? new Date(rider.startTime).toLocaleTimeString() : "N/A"}</p>
                        <p>Duration: {formatDuration(rider.startTime)}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Rider marker at current position */}
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
                      <p>Distance: {rider.total_distance ? `${rider.total_distance.toFixed(2)} km` : "N/A"}</p>
                      <p>Duration: {formatDuration(rider.startTime)}</p>
                      <p>Last update: {rider.updatedAt ? new Date(rider.updatedAt).toLocaleTimeString() : "N/A"}</p>
                    </div>
                  </Popup>
                </Marker>

              </React.Fragment>
            ))}

            <RecenterMap center={mapCenter} />
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default SuperAdminRiderLocation;