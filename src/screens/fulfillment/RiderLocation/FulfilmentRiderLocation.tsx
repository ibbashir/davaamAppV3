import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { BASE_URL } from "@/constants/Constant";
import { createRiderIcon, createStartIcon, createDestinationIcon } from "@/constants/mapIcons";
import { RecenterMap } from "./components/MapControls";
import RideHistoryPanel from "./components/RideHistoryPanel";
import type { RiderLocation } from "@/Types/SuperAdmin/rider";
import { getRequest } from "@/Apis/Api";

const POLLING_INTERVAL_MS = 5_000;
const DEFAULT_CENTER: [number, number] = [24.8607, 67.0011]; // Karachi

const FulfillmentRiderLocation: React.FC = () => {
  const [riders,          setRiders]          = useState<RiderLocation[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [lastUpdate,      setLastUpdate]      = useState<Date | null>(null);
  const [mapCenter,       setMapCenter]       = useState<[number, number]>(DEFAULT_CENTER);
  const [showHistory,     setShowHistory]     = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const initialCenterSet = useRef(false);

  const fetchLocations = async () => {
    try {
      const data = await getRequest<RiderLocation[]>(
        `${BASE_URL}/fulfillment/getliveLocationTrack/dashboard`
      );
      setRiders(data);
      setLastUpdate(new Date());
      if (data.length > 0 && !initialCenterSet.current) {
        setMapCenter([data[0].lat, data[0].lng]);
        initialCenterSet.current = true;
      }
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

  // Follow selected rider as their position updates
  useEffect(() => {
    if (!selectedRiderId) return;
    const sel = riders.find((r) => r.riderId === selectedRiderId);
    if (sel) setMapCenter([sel.lat, sel.lng]);
  }, [riders, selectedRiderId]);

  const handleSelectRider = (rider: RiderLocation) => {
    const newId = rider.riderId === selectedRiderId ? null : rider.riderId;
    setSelectedRiderId(newId);
    if (newId) {
      setMapCenter([rider.lat, rider.lng]);
      setShowMobileSheet(false); // close sheet to reveal map on mobile
    }
  };

  const activeRiders   = riders.filter((r) => r.active);
  const inactiveRiders = riders.filter((r) => !r.active);

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {showHistory && <RideHistoryPanel onClose={() => setShowHistory(false)} />}

      <LiveMapHeader
        activeCount={activeRiders.length}
        totalCount={riders.length}
        lastUpdate={lastUpdate}
        onRefresh={fetchLocations}
        onShowHistory={() => setShowHistory(true)}
      />

      {/* ── Main content area ── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ── Desktop sidebar (hidden on mobile) ── */}
        <aside className="hidden md:flex w-72 bg-white border-r border-gray-100 flex-col shadow-sm overflow-hidden flex-shrink-0">
          <div className="px-4 py-3 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Live Riders
            </h2>
            {!loading && (
              <span className="text-xs text-gray-400">{riders.length} total</span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <RiderListPanel
              activeRiders={activeRiders}
              inactiveRiders={inactiveRiders}
              selectedRiderId={selectedRiderId}
              onSelect={handleSelectRider}
              loading={loading && riders.length === 0}
            />
          </div>
        </aside>

        {/* ── Map area ── */}
        <div className="flex-1 relative">
          {loading && riders.length === 0 ? (
            <MapPlaceholder>
              <div className="flex flex-col items-center space-y-3">
                <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-500 text-sm">Loading rider locations…</span>
              </div>
            </MapPlaceholder>
          ) : error ? (
            <MapPlaceholder>
              <div className="flex flex-col items-center space-y-2 text-center px-4">
                <span className="text-4xl">⚠️</span>
                <p className="font-semibold text-gray-700">Failed to load locations</p>
                <p className="text-sm text-gray-400">{error}</p>
                <button
                  onClick={fetchLocations}
                  className="mt-2 px-4 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition"
                >
                  Retry
                </button>
              </div>
            </MapPlaceholder>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={14}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://locationiq.com">LocationIQ</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=pk.b32f17b2ac79ace43426c2a0d2fefedd"
              />
              {riders.map((rider) => (
                <RiderMapLayer
                  key={rider.riderId}
                  rider={rider}
                  onSelect={handleSelectRider}
                />
              ))}
              <RecenterMap center={mapCenter} />
            </MapContainer>
          )}

          {/* Live pulse badge — raised on mobile to clear the floating button */}
          {!error && !loading && (
            <div className="absolute bottom-20 right-3 md:bottom-4 md:right-4 z-[9999] bg-white rounded-xl shadow-lg px-3 py-2 flex items-center space-x-2 text-xs text-gray-600 border border-gray-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
              </span>
              <span>Live · {lastUpdate?.toLocaleTimeString() ?? "—"}</span>
            </div>
          )}
        </div>

        {/* ── Mobile: floating "View Riders" button ── */}
        {!loading && !error && (
          <button
            onClick={() => setShowMobileSheet(true)}
            className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-[9999] bg-teal-600 text-white rounded-full px-5 py-3 flex items-center space-x-2 shadow-xl text-sm font-semibold active:scale-95 transition-transform"
          >
            <span className="relative flex h-2 w-2">
              {activeRiders.length > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-200 opacity-75" />
              )}
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-200" />
            </span>
            <span>
              {riders.length === 0
                ? "No riders"
                : `${activeRiders.length} active · ${riders.length} total`}
            </span>
            <ChevronUpIcon />
          </button>
        )}

        {/* ── Mobile bottom sheet ── */}
        {showMobileSheet && (
          <>
            {/* Backdrop */}
            <div
              className="md:hidden fixed inset-0 bg-black/30 z-[10000] backdrop-blur-[1px]"
              onClick={() => setShowMobileSheet(false)}
            />
            {/* Sheet */}
            <div
              className="md:hidden fixed bottom-0 left-0 right-0 z-[10001] bg-white rounded-t-2xl shadow-2xl flex flex-col"
              style={{ maxHeight: "72vh" }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>
              {/* Sheet header */}
              <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm font-semibold text-gray-800">Live Riders</h2>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">
                    {activeRiders.length} active
                  </span>
                </div>
                <button
                  onClick={() => setShowMobileSheet(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"
                  aria-label="Close"
                >
                  <XIcon />
                </button>
              </div>
              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <RiderListPanel
                  activeRiders={activeRiders}
                  inactiveRiders={inactiveRiders}
                  selectedRiderId={selectedRiderId}
                  onSelect={handleSelectRider}
                  loading={loading && riders.length === 0}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Rider List Panel ─────────────────────────────────────────────────────────

interface RiderListPanelProps {
  activeRiders:   RiderLocation[];
  inactiveRiders: RiderLocation[];
  selectedRiderId: string | null;
  onSelect: (rider: RiderLocation) => void;
  loading: boolean;
}

const RiderListPanel: React.FC<RiderListPanelProps> = ({
  activeRiders, inactiveRiders, selectedRiderId, onSelect, loading,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-40 space-y-2 text-gray-400 text-sm">
        <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <span>Loading…</span>
      </div>
    );
  }

  if (activeRiders.length === 0 && inactiveRiders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm space-y-2">
        <span className="text-3xl">🏍️</span>
        <span>No riders online</span>
      </div>
    );
  }

  return (
    <div>
      {activeRiders.length > 0 && (
        <>
          <RiderSectionHeader label="Active" count={activeRiders.length} active />
          {activeRiders.map((rider) => (
            <RiderCard
              key={rider.riderId}
              rider={rider}
              selected={rider.riderId === selectedRiderId}
              onSelect={onSelect}
            />
          ))}
        </>
      )}
      {inactiveRiders.length > 0 && (
        <>
          <RiderSectionHeader label="Inactive" count={inactiveRiders.length} active={false} />
          {inactiveRiders.map((rider) => (
            <RiderCard
              key={rider.riderId}
              rider={rider}
              selected={rider.riderId === selectedRiderId}
              onSelect={onSelect}
            />
          ))}
        </>
      )}
    </div>
  );
};

const RiderSectionHeader: React.FC<{ label: string; count: number; active: boolean }> = ({
  label, count, active,
}) =>
  active ? (
    <div className="px-4 py-2 flex items-center justify-between bg-teal-50">
      <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">{label}</span>
      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-teal-100 text-teal-700">{count}</span>
    </div>
  ) : (
    <div className="px-4 py-2 flex items-center justify-between bg-gray-50">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-gray-200 text-gray-500">{count}</span>
    </div>
  );

const RiderCard: React.FC<{
  rider:    RiderLocation;
  selected: boolean;
  onSelect: (rider: RiderLocation) => void;
}> = ({ rider, selected, onSelect }) => (
  <button
    onClick={() => onSelect(rider)}
    className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-all relative ${
      selected ? "bg-teal-50" : "hover:bg-gray-50 active:bg-gray-100"
    }`}
  >
    {selected && (
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-teal-600 rounded-r" />
    )}

    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center space-x-2 min-w-0">
        <span className="relative flex h-2 w-2 flex-shrink-0">
          {rider.active && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              rider.active ? "bg-teal-500" : "bg-gray-300"
            }`}
          />
        </span>
        <span className="text-sm font-semibold text-gray-800 truncate">
          {rider.riderName ?? rider.riderId}
        </span>
      </div>
      {rider.status && (
        <span
          className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium ml-2 ${
            rider.status === "ongoing"
              ? "bg-blue-100 text-blue-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {rider.status === "ongoing" ? "Ongoing" : "Done"}
        </span>
      )}
    </div>

    {/* Stats: 2-col on mobile to avoid cramping, 3-col on sm+ */}
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs text-gray-500">
      <span>⚡ {rider.speed.toFixed(1)} km/h</span>
      <span>📏 {rider.total_distance ? `${rider.total_distance.toFixed(1)} km` : "—"}</span>
      <span className="col-span-2 sm:col-span-1">
        ⏱ {rider.status === "ongoing" && rider.startTime
          ? fmtElapsed(Math.floor((Date.now() - rider.startTime) / 1000))
          : "—"}
      </span>
    </div>

    {rider.dest_name && (
      <div className="mt-1.5 flex items-center space-x-1 text-xs text-teal-700 bg-teal-50 rounded px-1.5 py-0.5 min-w-0">
        <span className="flex-shrink-0">→</span>
        <span className="truncate font-medium">{rider.dest_name}</span>
      </div>
    )}

    {rider.updatedAt && (
      <p className="mt-1 text-xs text-gray-400">
        {new Date(rider.updatedAt).toLocaleTimeString()}
      </p>
    )}
  </button>
);

// ─── Header ───────────────────────────────────────────────────────────────────

interface HeaderProps {
  activeCount: number;
  totalCount:  number;
  lastUpdate:  Date | null;
  onRefresh:   () => void;
  onShowHistory: () => void;
}

const LiveMapHeader: React.FC<HeaderProps> = ({
  activeCount, totalCount, lastUpdate, onRefresh, onShowHistory,
}) => (
  <header className="bg-white border-b border-gray-100 px-3 md:px-5 py-2.5 md:py-3 flex items-center justify-between shadow-sm flex-shrink-0 gap-2">
    {/* Left: icon + title */}
    <div className="flex items-center space-x-2.5 min-w-0">
      <div className="p-1.5 md:p-2 bg-teal-600 rounded-xl flex-shrink-0">
        <LocationPinIcon />
      </div>
      <div className="min-w-0">
        <h1 className="text-sm md:text-base font-bold text-gray-900 leading-tight truncate">
          Rider Live Locations
        </h1>
        {/* Desktop subtitle */}
        <p className="hidden md:block text-xs text-gray-400 mt-0.5">
          Real-time tracking · auto-refreshes every 5s
        </p>
        {/* Mobile: compact counts */}
        <p className="md:hidden text-xs text-gray-400 mt-0.5">
          {activeCount} active · {totalCount} total
        </p>
      </div>
    </div>

    {/* Right: stats + actions */}
    <div className="flex items-center gap-2 flex-shrink-0">
      {/* Desktop-only stat badges */}
      <div className="hidden md:flex items-center space-x-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
          {activeCount} Active
        </span>
        <span className="text-gray-300">·</span>
        <span className="text-gray-500 text-xs font-medium">{totalCount} Total</span>
      </div>

      <span className="hidden lg:block text-xs text-gray-400">
        Updated {lastUpdate ? lastUpdate.toLocaleTimeString() : "never"}
      </span>

      {/* History button: icon-only on mobile, icon + label on sm+ */}
      <button
        onClick={onShowHistory}
        className="flex items-center space-x-1.5 px-2.5 md:px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 active:bg-teal-800 transition"
        aria-label="Ride History"
      >
        <ClockIcon />
        <span className="hidden sm:inline">Ride History</span>
      </button>

      {/* Refresh button: icon-only on mobile */}
      <button
        onClick={onRefresh}
        className="flex items-center justify-center px-2.5 md:px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 active:bg-gray-100 transition"
        aria-label="Refresh"
      >
        <RefreshIcon />
        <span className="hidden sm:inline ml-1.5">Refresh</span>
      </button>
    </div>
  </header>
);

// ─── Rider Map Layer ──────────────────────────────────────────────────────────

const RiderMapLayer: React.FC<{
  rider:    RiderLocation;
  onSelect: (rider: RiderLocation) => void;
}> = ({ rider, onSelect }) => {
  const [startRouteCoords, setStartRouteCoords] = useState<[number, number][]>([]);
  const [destRouteCoords,  setDestRouteCoords]  = useState<[number, number][]>([]);
  const lastFetchedPosRef = useRef<{ lat: number; lng: number } | null>(null);

  const hasStartPin =
    rider.status === "ongoing" &&
    rider.start_lat !== 0 &&
    rider.start_lng !== 0;

  const hasDestination =
    rider.dest_lat != null &&
    rider.dest_lng != null;

  useEffect(() => {
    const last = lastFetchedPosRef.current;
    if (last && geoDistMeters(last.lat, last.lng, rider.lat, rider.lng) < 100) return;
    lastFetchedPosRef.current = { lat: rider.lat, lng: rider.lng };

    if (hasStartPin) {
      fetchOSRMRoute(rider.start_lat, rider.start_lng, rider.lat, rider.lng)
        .then((d) => { if (d) setStartRouteCoords(d.coords); });
    }
    if (hasDestination && rider.status === "ongoing") {
      fetchOSRMRoute(rider.lat, rider.lng, rider.dest_lat!, rider.dest_lng!)
        .then((d) => { if (d) setDestRouteCoords(d.coords); });
    }
  }, [rider.lat, rider.lng, rider.start_lat, rider.start_lng, rider.dest_lat, rider.dest_lng, hasStartPin, hasDestination, rider.status]);

  const displayName = rider.riderName || rider.riderId;

  return (
    <React.Fragment>
      {/* Route so-far: start → current position */}
      {hasStartPin && (
        <Polyline
          positions={
            startRouteCoords.length > 1
              ? startRouteCoords
              : [[rider.start_lat, rider.start_lng], [rider.lat, rider.lng]]
          }
          pathOptions={{
            color:     rider.active ? "#0d9488" : "#9ca3af",
            weight:    3,
            opacity:   0.7,
            dashArray: startRouteCoords.length > 1 ? undefined : "6 4",
          }}
        />
      )}

      {/* Remaining route: current position → destination */}
      {hasDestination && rider.status === "ongoing" && (
        <Polyline
          positions={
            destRouteCoords.length > 1
              ? destRouteCoords
              : [[rider.lat, rider.lng], [rider.dest_lat!, rider.dest_lng!]]
          }
          pathOptions={{
            color: "#f59e0b", weight: 4, opacity: 0.85, lineJoin: "round"
          }}
        />
      )}

      {/* Start pin */}
      {hasStartPin && (
        <Marker position={[rider.start_lat, rider.start_lng]} icon={createStartIcon()}>
          <Popup>
            <div className="text-sm space-y-1">
              <p className="font-bold text-teal-600">📍 Ride Start</p>
              <p className="font-medium">{displayName}</p>
              <p className="text-gray-500">
                {rider.startTime
                  ? new Date(rider.startTime).toLocaleTimeString()
                  : "N/A"}
              </p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Destination pin */}
      {hasDestination && (
        <Marker
          position={[rider.dest_lat!, rider.dest_lng!]}
          icon={createDestinationIcon(rider.dest_name)}
        >
          <Popup>
            <div className="text-sm space-y-1">
              <p className="font-bold text-amber-600">🏁 Destination</p>
              <p className="font-medium">{rider.dest_name ?? "Unknown"}</p>
              <p className="text-gray-500 text-xs">Rider: {displayName}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Rider current position */}
      <Marker
        position={[rider.lat, rider.lng]}
        icon={createRiderIcon(rider.active, rider.bearing, rider.riderName)}
        eventHandlers={{ click: () => onSelect(rider) }}
      >
        <Popup>
          <div className="text-sm space-y-1 min-w-[180px]">
            <p className="font-bold text-gray-800 text-base">🏍️ {displayName}</p>
            <hr className="border-gray-100" />
            <p>Status: {rider.active ? "🟢 Active" : "⚪ Inactive"}</p>
            <p>Ride: {rider.status === "ongoing" ? "🔵 Ongoing" : "✅ Completed"}</p>
            <p>Speed: {rider.speed.toFixed(1)} km/h</p>
            <p>Distance: {rider.total_distance ? `${rider.total_distance.toFixed(2)} km` : "N/A"}</p>
            {rider.dest_name && (
              <p className="text-amber-600 font-medium">→ {rider.dest_name}</p>
            )}
            {rider.updatedAt && (
              <p className="text-gray-400 text-xs">
                {new Date(rider.updatedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        </Popup>
      </Marker>
    </React.Fragment>
  );
};

// ─── Utility components ───────────────────────────────────────────────────────

const MapPlaceholder: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
    {children}
  </div>
);

const LocationPinIcon: React.FC = () => (
  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ClockIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefreshIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ChevronUpIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const XIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const fmtElapsed = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return "<1m";
};

const fetchOSRMRoute = async (
  startLat: number, startLng: number,
  endLat: number,   endLng: number,
): Promise<{ coords: [number, number][] } | null> => {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
    );
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    return {
      coords: data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng] as [number, number],
      ),
    };
  } catch {
    return null;
  }
};

const geoDistMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6_371_000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default FulfillmentRiderLocation;