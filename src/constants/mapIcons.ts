import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon resolution with webpack/vite bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

/** Animated, bearing-aware motorcycle icon for live riders. */
export const createRiderIcon = (
  active: boolean,
  bearing: number,
  riderName: string | null
) => {
  const color = active ? "#10b981" : "#6b7280";

  return L.divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="transform:rotate(${bearing}deg);width:36px;height:36px;">
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
          margin-top:2px;background-color:${color};color:white;
          font-size:10px;font-weight:600;padding:1px 6px;
          border-radius:999px;white-space:nowrap;
          box-shadow:0 1px 3px rgba(0,0,0,0.3);
          max-width:80px;overflow:hidden;text-overflow:ellipsis;
        ">${riderName ?? "Unknown"}</div>
      </div>`,
    className: "rider-marker",
    iconSize: [36, 52],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

/** Small blue dot labelled "Start". */
export const createStartIcon = () =>
  L.divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="width:14px;height:14px;background-color:#3b82f6;border:2px solid white;
          border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>
        <div style="margin-top:2px;background-color:#3b82f6;color:white;font-size:9px;
          font-weight:600;padding:1px 5px;border-radius:999px;white-space:nowrap;
          box-shadow:0 1px 3px rgba(0,0,0,0.3);">Start</div>
      </div>`,
    className: "",
    iconSize: [14, 28],
    iconAnchor: [7, 7],
    popupAnchor: [0, -14],
  });

/** Small red dot labelled "End". */
export const createEndIcon = () =>
  L.divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="width:14px;height:14px;background-color:#ef4444;border:2px solid white;
          border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>
        <div style="margin-top:2px;background-color:#ef4444;color:white;font-size:9px;
          font-weight:600;padding:1px 5px;border-radius:999px;white-space:nowrap;
          box-shadow:0 1px 3px rgba(0,0,0,0.3);">End</div>
      </div>`,
    className: "",
    iconSize: [14, 28],
    iconAnchor: [7, 7],
    popupAnchor: [0, -14],
  });