import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import type { RideHistory } from "@/Types/SuperAdmin/rider";
import { createStartIcon, createEndIcon } from "@/constants/mapIcons";
import { FitBounds } from "./MapControls";
import { formatDateTime, isValidCoord } from "@/utils/formatters";

interface Props {
  ride: RideHistory;
}

/**
 * Renders a small embedded map showing the start → end route for a single ride.
 * Gracefully handles rides with missing or zeroed-out coordinates.
 */
const RideRouteMap: React.FC<Props> = ({ ride }) => {
  const startLat = parseFloat(ride.start_lat);
  const startLng = parseFloat(ride.start_lng);
  const endLat   = parseFloat(ride.end_lat);
  const endLng   = parseFloat(ride.end_lng);

  const hasStart = isValidCoord(ride.start_lat, ride.start_lng);
  const hasEnd   = isValidCoord(ride.end_lat,   ride.end_lng);

  const positions: [number, number][] = [
    ...(hasStart ? [[startLat, startLng] as [number, number]] : []),
    ...(hasEnd   ? [[endLat,   endLng  ] as [number, number]] : []),
  ];

  const center: [number, number] = hasStart
    ? [startLat, startLng]
    : [24.8607, 67.0011]; // fallback: Karachi

  return (
    <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://locationiq.com">LocationIQ</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=pk.b32f17b2ac79ace43426c2a0d2fefedd"
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

      {!hasStart && !hasEnd && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(255,255,255,0.85)", fontSize: 14, color: "#6b7280",
        }}>
          📍 No valid location data for this ride
        </div>
      )}
    </MapContainer>
  );
};

export default RideRouteMap;