import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface FitBoundsProps {
  positions: [number, number][];
}

/**
 * Fits the map viewport to a set of lat/lng positions.
 * Requires at least 2 positions to have any effect.
 */
export const FitBounds: React.FC<FitBoundsProps> = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [40, 40] });
    }
  }, [map, positions]);
  return null;
};

interface RecenterMapProps {
  center: [number, number];
}

/**
 * Smoothly re-centers the map whenever `center` changes.
 */
export const RecenterMap: React.FC<RecenterMapProps> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};