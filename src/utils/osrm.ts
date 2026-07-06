/**
 * Shared OSRM road-routing helpers for the rider maps.
 * All coordinates are [lat, lng] pairs (Leaflet order).
 */

export interface OSRMRoute {
  /** Full road geometry for the whole route. */
  coords: [number, number][];
  /** Road geometry split per leg (waypoint → waypoint), in visit order. */
  legCoords: [number, number][][];
  durationSec: number;
  distanceMeters: number;
  legDurationsSec: number[];
}

/**
 * Fetch a driving route through 2..n waypoints and split the geometry into
 * one segment per leg so each leg can be styled/labelled independently.
 */
export const fetchOSRMRouteMulti = async (
  points: [number, number][],
): Promise<OSRMRoute | null> => {
  if (points.length < 2) return null;
  try {
    const coordStr = points.map(([lat, lng]) => `${lng},${lat}`).join(";");
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`,
    );
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;

    const route = data.routes[0];
    const coords: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng] as [number, number],
    );

    // OSRM snaps every input point to the road network; use the snapped
    // intermediate waypoints to cut the full geometry into per-leg segments.
    const snapped: [number, number][] = (data.waypoints || []).map(
      (w: { location: [number, number] }) =>
        [w.location[1], w.location[0]] as [number, number],
    );
    const legCoords = splitAtWaypoints(coords, snapped.slice(1, -1));

    return {
      coords,
      legCoords,
      durationSec: Number(route.duration) || 0,
      distanceMeters: Number(route.distance) || 0,
      legDurationsSec: (route.legs || []).map(
        (l: { duration: number }) => Number(l.duration) || 0,
      ),
    };
  } catch {
    return null;
  }
};

/** Two-point convenience wrapper. */
export const fetchOSRMRoute = (
  startLat: number, startLng: number,
  endLat: number,   endLng: number,
): Promise<OSRMRoute | null> =>
  fetchOSRMRouteMulti([[startLat, startLng], [endLat, endLng]]);

/**
 * Cut a route geometry at the points nearest to each intermediate waypoint.
 * Segments share their boundary point so the drawn legs connect seamlessly.
 */
const splitAtWaypoints = (
  coords: [number, number][],
  waypoints: [number, number][],
): [number, number][][] => {
  if (waypoints.length === 0) return [coords];

  const cuts: number[] = [];
  let searchFrom = 0;
  for (const [wLat, wLng] of waypoints) {
    let best = searchFrom;
    let bestDist = Infinity;
    for (let i = searchFrom; i < coords.length; i++) {
      const d = (coords[i][0] - wLat) ** 2 + (coords[i][1] - wLng) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    cuts.push(best);
    searchFrom = best;
  }

  const segments: [number, number][][] = [];
  let start = 0;
  for (const cut of cuts) {
    segments.push(coords.slice(start, cut + 1));
    start = cut;
  }
  segments.push(coords.slice(start));
  return segments.filter((s) => s.length > 1);
};

/** Straight-line fallback legs when OSRM is unreachable. */
export const straightLegs = (
  points: [number, number][],
): [number, number][][] => {
  const legs: [number, number][][] = [];
  for (let i = 0; i < points.length - 1; i++) {
    legs.push([points[i], points[i + 1]]);
  }
  return legs;
};
