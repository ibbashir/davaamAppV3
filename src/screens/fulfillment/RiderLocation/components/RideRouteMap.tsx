import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import type { RideHistory } from "@/Types/SuperAdmin/rider";
import { createStartIcon, createEndIcon } from "@/constants/mapIcons";
import { FitBounds } from "./MapControls";
import { formatDateTime, isValidCoord } from "@/utils/formatters";

interface Props {
  ride: RideHistory;
}

const fetchOSRMRoute = async (
  startLat: number, startLng: number,
  endLat: number,   endLng: number,
): Promise<[number, number][] | null> => {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
    );
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    return data.routes[0].geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng] as [number, number],
    );
  } catch {
    return null;
  }
};

/**
 * Renders a small embedded map showing the start → end route for a single ride.
 * Uses OSRM to draw the real road path instead of a straight line.
 * Gracefully handles rides with missing or zeroed-out coordinates.
 */
const RideRouteMap: React.FC<Props> = ({ ride }) => {
  const startLat = parseFloat(ride.start_lat);
  const startLng = parseFloat(ride.start_lng);
  const endLat   = parseFloat(ride.end_lat);
  const endLng   = parseFloat(ride.end_lng);

  const hasStart = isValidCoord(ride.start_lat, ride.start_lng);
  const hasEnd   = isValidCoord(ride.end_lat,   ride.end_lng);

  const fallbackPositions: [number, number][] = [
    ...(hasStart ? [[startLat, startLng] as [number, number]] : []),
    ...(hasEnd   ? [[endLat,   endLng  ] as [number, number]] : []),
  ];

  const center: [number, number] = hasStart
    ? [startLat, startLng]
    : [24.8607, 67.0011]; // fallback: Karachi

  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    if (!hasStart || !hasEnd) return;

    setRouteLoading(true);
    setRouteCoords(null);

    fetchOSRMRoute(startLat, startLng, endLat, endLng)
      .then((coords) => setRouteCoords(coords))
      .finally(() => setRouteLoading(false));
  }, [ride.id, startLat, startLng, endLat, endLng, hasStart, hasEnd]);

  // Use OSRM route if available, otherwise fall back to straight dashed line
  const polylinePositions = routeCoords ?? (fallbackPositions.length === 2 ? fallbackPositions : null);
  const isRoutedPath      = !!routeCoords;

  return (
    <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://locationiq.com">LocationIQ</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=pk.b32f17b2ac79ace43426c2a0d2fefedd"
      />

      {polylinePositions && (
        <Polyline
          positions={polylinePositions}
          pathOptions={{
            color:     "#6366f1",
            weight:    isRoutedPath ? 5 : 4,
            opacity:   0.85,
            // Dashed only for fallback straight line; solid for real road route
            dashArray: isRoutedPath ? undefined : "8 4",
            lineJoin:  "round",
          }}
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

      {fallbackPositions.length >= 2 && <FitBounds positions={fallbackPositions} />}

      {/* Loading indicator while fetching route */}
      {routeLoading && (
        <div style={{
          position: "absolute", bottom: 48, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, background: "white", borderRadius: 8, padding: "6px 12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontSize: 12, color: "#6b7280",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{
            display: "inline-block", width: 10, height: 10, borderRadius: "50%",
            border: "2px solid #6366f1", borderTopColor: "transparent",
            animation: "spin 0.7s linear infinite",
          }} />
          Fetching road route…
        </div>
      )}

      {!hasStart && !hasEnd && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(255,255,255,0.85)", fontSize: 14, color: "#6b7280",
        }}>
          📍 No valid location data for this ride
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </MapContainer>
  );
};

export default RideRouteMap;