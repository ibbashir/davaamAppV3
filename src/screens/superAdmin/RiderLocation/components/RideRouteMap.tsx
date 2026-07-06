import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from "react-leaflet";
import type { RideHistory } from "@/Types/SuperAdmin/rider";
import { createStartIcon, createEndIcon, createStopIcon } from "@/constants/mapIcons";
import { FitBounds } from "./MapControls";
import { formatDateTime, isValidCoord } from "@/utils/formatters";
import { fetchOSRMRouteMulti, straightLegs } from "@/utils/osrm";

interface Props {
  ride: RideHistory;
}

/**
 * Embedded map replaying a completed ride, matching the live-tracking map:
 *  - numbered pins for every machine stop (with machine names)
 *  - the actual GPS breadcrumb trail when it was recorded
 *  - otherwise a road route drawn leg-by-leg: start → stop 1 → stop 2 → … → end
 * Gracefully handles rides with missing or zeroed-out coordinates.
 */
const RideRouteMap: React.FC<Props> = ({ ride }) => {
  const startLat = parseFloat(ride.start_lat);
  const startLng = parseFloat(ride.start_lng);
  const endLat   = parseFloat(ride.end_lat);
  const endLng   = parseFloat(ride.end_lng);

  const hasStart = isValidCoord(ride.start_lat, ride.start_lng);
  const hasEnd   = isValidCoord(ride.end_lat,   ride.end_lng);

  const stops    = ride.stops ?? [];
  const traveled = ride.route_path ?? [];

  // Waypoints in visit order: start → each stop → end
  const waypoints: [number, number][] = [
    ...(hasStart ? [[startLat, startLng] as [number, number]] : []),
    ...stops.map((s): [number, number] => [s.lat, s.lng]),
    ...(hasEnd ? [[endLat, endLng] as [number, number]] : []),
  ];

  const center: [number, number] = hasStart
    ? [startLat, startLng]
    : [24.8607, 67.0011]; // fallback: Karachi

  const [routeLegs,    setRouteLegs]    = useState<[number, number][][]>([]);
  const [routeLoading, setRouteLoading] = useState(false);

  // Only ask OSRM for the road path when we have no real breadcrumbs
  const needsOSRM = traveled.length < 2 && waypoints.length >= 2;

  useEffect(() => {
    if (!needsOSRM) return;

    setRouteLoading(true);
    setRouteLegs([]);

    fetchOSRMRouteMulti(waypoints)
      .then((d) => { if (d) setRouteLegs(d.legCoords); })
      .finally(() => setRouteLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ride.id]);

  // Name of the point each OSRM leg ends at (stop 1..n, then End)
  const legEndLabel = (i: number): string => {
    const stop = stops[i];
    if (stop) return `Stop ${i + 1}: ${stop.name}`;
    return "End point";
  };

  // Everything the camera should frame
  const boundsPositions: [number, number][] = [
    ...waypoints,
    ...traveled.map((p): [number, number] => [p.lat, p.lng]),
  ];

  const showFallbackLegs = needsOSRM && !routeLoading && routeLegs.length === 0;

  return (
    <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://locationiq.com">LocationIQ</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=pk.b32f17b2ac79ace43426c2a0d2fefedd"
      />

      {/* Actual traveled GPS trail — the truest record of the ride */}
      {traveled.length > 1 && (
        <Polyline
          positions={traveled.map((p): [number, number] => [p.lat, p.lng])}
          pathOptions={{
            color: "#0d9488", weight: 6, opacity: 0.85,
            lineJoin: "round", lineCap: "round",
          }}
        >
          <Tooltip sticky>
            <span className="text-xs font-semibold">Traveled path</span>
          </Tooltip>
        </Polyline>
      )}

      {/* Road route leg-by-leg when no breadcrumbs were recorded */}
      {(routeLegs.length > 0
        ? routeLegs
        : showFallbackLegs
          ? straightLegs(waypoints)
          : []
      ).map((leg, i) => (
        <Polyline
          key={`${ride.id}-leg-${i}`}
          positions={leg}
          pathOptions={{
            color:     i % 2 === 0 ? "#6366f1" : "#8b5cf6",
            weight:    5,
            opacity:   0.85,
            dashArray: routeLegs.length > 0 ? undefined : "8 6",
            lineJoin:  "round",
            lineCap:   "round",
          }}
        >
          <Tooltip sticky>
            <span className="text-xs font-semibold">
              Leg {i + 1} → {legEndLabel(i)}
            </span>
          </Tooltip>
        </Polyline>
      ))}

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

      {/* Numbered pin per machine stop, in visit order */}
      {stops.map((stop, i) => (
        <Marker
          key={`${ride.id}-stop-${i}`}
          position={[stop.lat, stop.lng]}
          icon={createStopIcon(i, stop.arrived ? "arrived" : "pending", stop.name)}
        >
          <Popup>
            <div className="text-sm space-y-1">
              <p className="font-bold text-amber-600">
                {stop.arrived ? "✅" : "📍"} Stop {i + 1} of {stops.length}
              </p>
              <p className="font-medium">{stop.name}</p>
              {stop.machineCode && (
                <p className="text-gray-500 text-xs">Machine: {stop.machineCode}</p>
              )}
              <p className="text-gray-500 text-xs">
                {stop.arrived ? "Visited" : "Not visited"}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}

      {hasEnd && ride.status?.toLowerCase() === "completed" && (
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

      {boundsPositions.length >= 2 && <FitBounds positions={boundsPositions} />}

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

      {!hasStart && !hasEnd && stops.length === 0 && (
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
