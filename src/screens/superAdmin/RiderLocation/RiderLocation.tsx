import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { BASE_URL_STOCK  } from "@/constants/Constant";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

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

interface RideHistory {
  id: number;
  user_id: number;
  status: string;
  start_lat: string;
  start_lng: string;
  end_lat: string;
  end_lng: string;
  start_time: string;
  end_time: string;
  total_distance_km: string;
  duration_seconds: number | null;
  created_at: string;
}

// Fix: match actual API response shape
interface RideHistoryResponse {
  data: RideHistory[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

// ─── Icons ────────────────────────────────────────────────────────────────────

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
        ">${riderName ?? "Unknown"}</div>
      </div>`,
    className: "rider-marker",
    iconSize: [36, 52],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

const createStartIcon = () =>
  L.divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="width:14px;height:14px;background-color:#3b82f6;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>
        <div style="margin-top:2px;background-color:#3b82f6;color:white;font-size:9px;font-weight:600;padding:1px 5px;border-radius:999px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.3);">Start</div>
      </div>`,
    className: "",
    iconSize: [14, 28],
    iconAnchor: [7, 7],
    popupAnchor: [0, -14],
  });

const createEndIcon = () =>
  L.divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="width:14px;height:14px;background-color:#ef4444;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>
        <div style="margin-top:2px;background-color:#ef4444;color:white;font-size:9px;font-weight:600;padding:1px 5px;border-radius:999px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.3);">End</div>
      </div>`,
    className: "",
    iconSize: [14, 28],
    iconAnchor: [7, 7],
    popupAnchor: [0, -14],
  });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDuration = (startTime: string, endTime?: string): string => {
  if (!startTime) return "N/A";
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const elapsed = Math.floor((end - start) / 1000);
  if (elapsed < 0) return "N/A";
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
};

const formatDateTime = (iso: string) =>
  iso ? new Date(iso).toLocaleString() : "N/A";

// Fix: detect invalid/zero coordinates
const isValidCoord = (lat: string, lng: string): boolean => {
  const la = parseFloat(lat);
  const ln = parseFloat(lng);
  return !isNaN(la) && !isNaN(ln) && !(la === 0 && ln === 0);
};

// ─── Fit Bounds ───────────────────────────────────────────────────────────────

const FitBounds: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [40, 40] });
    }
  }, [map, positions]);
  return null;
};

// ---------- Helper Component to Recenter Map ----------
const RecenterMap: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};
// ─── Ride Route Map ───────────────────────────────────────────────────────────

const RideRouteMap: React.FC<{ ride: RideHistory }> = ({ ride }) => {
  const startLat = parseFloat(ride.start_lat);
  const startLng = parseFloat(ride.start_lng);
  const endLat   = parseFloat(ride.end_lat);
  const endLng   = parseFloat(ride.end_lng);

  const hasStart = isValidCoord(ride.start_lat, ride.start_lng);
  const hasEnd   = isValidCoord(ride.end_lat, ride.end_lng);

  const positions: [number, number][] = [
    ...(hasStart ? [[startLat, startLng] as [number, number]] : []),
    ...(hasEnd   ? [[endLat,   endLng  ] as [number, number]] : []),
  ];

  const center: [number, number] = hasStart
    ? [startLat, startLng]
    : [24.8607, 67.0011];

  return (
    <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {positions.length === 2 && (
        <Polyline
          positions={positions}
          pathOptions={{ color: "#6366f1", weight: 4, opacity: 0.8, dashArray: "8 4" }}
        />
      )}

      {hasStart && (
        <Marker position={[startLat, startLng]} icon={createStartIcon()}>
          <Popup>
            <div className="text-sm space-y-0.5">
              <p className="font-bold text-blue-600">📍 Ride Start</p>
              <p>Time: {formatDateTime(ride.start_time)}</p>
              <p>Lat: {startLat.toFixed(6)}, Lng: {startLng.toFixed(6)}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {hasEnd && ride.status === "completed" && (
        <Marker position={[endLat, endLng]} icon={createEndIcon()}>
          <Popup>
            <div className="text-sm space-y-0.5">
              <p className="font-bold text-red-500">🏁 Ride End</p>
              <p>Time: {formatDateTime(ride.end_time)}</p>
              <p>Lat: {endLat.toFixed(6)}, Lng: {endLng.toFixed(6)}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {positions.length >= 2 && <FitBounds positions={positions} />}

      {/* Fix: show message when coords are invalid/zero */}
      {!hasStart && !hasEnd && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(255,255,255,0.85)", fontSize: 14, color: "#6b7280"
        }}>
          📍 No valid location data for this ride
        </div>
      )}
    </MapContainer>
  );
};

// ─── Ride Detail Panel ────────────────────────────────────────────────────────

const RideDetailPanel: React.FC<{ ride: RideHistory; onClose: () => void }> = ({ ride, onClose }) => (
  <div className="fixed inset-0 z-[99999] flex">
    <div className="flex-1 bg-black/40" onClick={onClose} />
    <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col">

      <div className="flex items-center justify-between px-5 py-4 border-b bg-indigo-600 text-white">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🗺️</span>
          <h3 className="font-bold text-base">Ride #{ride.id} — Route Map</h3>
          <span className="text-indigo-200 text-sm">· User #{ride.user_id}</span>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x border-b bg-gray-50 text-center text-sm">
        <div className="px-4 py-3">
          <p className="text-xs text-gray-400 uppercase font-medium">Distance</p>
          <p className="font-bold text-gray-800 mt-0.5">
            {parseFloat(ride.total_distance_km) > 0
              ? `${parseFloat(ride.total_distance_km).toFixed(2)} km`
              : "N/A"}
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs text-gray-400 uppercase font-medium">Duration</p>
          <p className="font-bold text-gray-800 mt-0.5">
            {formatDuration(ride.start_time, ride.status === "completed" ? ride.end_time : undefined)}
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs text-gray-400 uppercase font-medium">Status</p>
          <p className="mt-0.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              ride.status === "ongoing" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
            }`}>
              {ride.status === "ongoing" ? "🔵 Ongoing" : "✅ Completed"}
            </span>
          </p>
        </div>
      </div>

      {/* Times */}
      <div className="grid grid-cols-2 divide-x border-b text-sm">
        <div className="px-5 py-3">
          <p className="text-xs text-gray-400 uppercase font-medium">Start Time</p>
          <p className="text-gray-700 mt-0.5">{formatDateTime(ride.start_time)}</p>
        </div>
        <div className="px-5 py-3">
          <p className="text-xs text-gray-400 uppercase font-medium">End Time</p>
          <p className="text-gray-700 mt-0.5">
            {ride.status === "completed" ? formatDateTime(ride.end_time) : "—"}
          </p>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <RideRouteMap ride={ride} />
        <div className="absolute bottom-3 left-3 z-[9999] bg-white rounded-lg shadow-md px-3 py-2 text-xs space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Start point</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600">End point</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 border-t-2 border-dashed border-indigo-500"></div>
            <span className="text-gray-600">Route</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─── Ride History Panel ───────────────────────────────────────────────────────

const RideHistoryPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [history, setHistory] = useState<RideHistory[]>([]);
  const [pagination, setPagination] = useState<RideHistoryResponse["pagination"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUserId, setFilterUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedRide, setSelectedRide] = useState<RideHistory | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await axios.get<RideHistoryResponse>(`${BASE_URL_STOCK}/rideHistory`);
        // Fix: extract response.data.data and response.data.pagination
        setHistory(response.data.data);
        setPagination(response.data.pagination);
        setError(null);
      } catch (err) {
        setError("Failed to fetch ride history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Fix: filter using correct fields from actual response
  const filtered = history.filter((ride) => {
    const matchStatus = filterStatus === "all" ? true : ride.status === filterStatus;
    const matchUser = filterUserId
      ? String(ride.user_id).includes(filterUserId.trim())
      : true;
    const rideStart = new Date(ride.start_time).getTime();
    const matchStart = startDate ? rideStart >= new Date(startDate).getTime() : true;
    const matchEnd = endDate ? rideStart <= new Date(endDate).getTime() + 86400000 : true;
    return matchStatus && matchUser && matchStart && matchEnd;
  });

  return (
    <>
      {selectedRide && (
        <RideDetailPanel ride={selectedRide} onClose={() => setSelectedRide(null)} />
      )}

      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🏍️</span>
              <h2 className="text-lg font-bold text-gray-800">Ride History</h2>
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                {filtered.length} / {pagination?.total ?? 0} rides
              </span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition text-2xl leading-none">
              ×
            </button>
          </div>

          {/* Filters */}
          <div className="px-6 py-3 border-b bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Filter by User ID..."
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All Statuses</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Table */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-gray-500">Loading...</div>
            ) : error ? (
              <div className="flex items-center justify-center h-40 text-red-500">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-400">No rides found</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {["#", "UserName", "Status", "Start Time", "End Time", "Duration", "Distance", "Route"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((ride) => (
                    <tr key={ride.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-gray-400 text-xs">{ride.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{ride.username}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          ride.status === "ongoing" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                        }`}>
                          {ride.status === "ongoing" ? "🔵 Ongoing" : "✅ Completed"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDateTime(ride.start_time)}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {ride.status === "completed" ? formatDateTime(ride.end_time) : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDuration(ride.start_time, ride.status === "completed" ? ride.end_time : undefined)}
                      </td>
                      {/* Fix: show N/A for 0.00 distances */}
                      <td className="px-4 py-3 text-gray-600">
                        {parseFloat(ride.total_distance_km) > 0
                          ? `${parseFloat(ride.total_distance_km).toFixed(2)} km`
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedRide(ride)}
                          className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-medium transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          <span>View Map</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer with pagination info */}
          <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Showing {filtered.length} of {pagination?.total ?? 0} total rides
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SuperAdminRiderLocation: React.FC = () => {
  const [riders, setRiders] = useState<RiderLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.006]);
  const [showHistory, setShowHistory] = useState(false);

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
      {showHistory && <RideHistoryPanel onClose={() => setShowHistory(false)} />}

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
            onClick={() => setShowHistory(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Ride History</span>
          </button>
          <button
            onClick={fetchLocations}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Live Map */}
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
                {rider.status === "ongoing" && rider.start_lat !== 0 && rider.start_lng !== 0 && (
                  <Polyline
                    positions={[[rider.start_lat, rider.start_lng], [rider.lat, rider.lng]]}
                    pathOptions={{ color: rider.active ? "#10b981" : "#6b7280", weight: 3, opacity: 0.7, dashArray: "6 4" }}
                  />
                )}
                {rider.status === "ongoing" && rider.start_lat !== 0 && rider.start_lng !== 0 && (
                  <Marker position={[rider.start_lat, rider.start_lng]} icon={createStartIcon()}>
                    <Popup>
                      <div className="text-sm space-y-1">
                        <p className="font-bold text-blue-600">📍 Ride Start</p>
                        <p>Rider: {rider.riderName ?? rider.riderId}</p>
                        <p>Started: {rider.startTime ? new Date(rider.startTime).toLocaleTimeString() : "N/A"}</p>
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
                      <p>Distance: {rider.total_distance ? `${rider.total_distance.toFixed(2)} km` : "N/A"}</p>
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