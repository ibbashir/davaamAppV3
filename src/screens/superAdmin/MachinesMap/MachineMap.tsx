import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import { getRequest } from "@/Apis/Api";
import type { ApiMachine, MachinesResponse } from "../machines/Types"
import { SiteHeader } from "@/components/superAdmin/site-header";

type Machine = {
  _id: string;
  name: string;
  lat: number;
  lng: number;
  status: "online" | "offline" | "unknown";
  stockStatus: "In Stock" | "Low Stock" | "Out of Stock";
  stockLevel: number;
  lastUpdated: string;
  machine_code: string;
  machine_type: string;
  location: string;
  category: string;
  stockedBy: string;
  map_link?: string; // Add map_link field
};

// Filter categories
type StatusFilter = "online" | "offline" | "unknown";
type StockFilter = "good-stock" | "low-stock" | "out-of-stock";

// Define machine types
type MachineType = "sanitary" | "dispensing";

// Sanitary categories
const SANITARY_CATEGORIES = ["Butterfly"];

// Dispensing categories
const DISPENSING_CATEGORIES = [
  "Cooking Oil",
  "Laundry",
  "Shampoo",
  "BodyWash",
  "Handwash",
  "Dishwash",
  "Surface Cleaner",
  "Unknown"
];

type CategoryFilter = typeof SANITARY_CATEGORIES[number] | typeof DISPENSING_CATEGORIES[number];

// Pakistan bounds coordinates
const PAKISTAN_BOUNDS: L.LatLngBoundsExpression = [
  [20.774, 60.872],
  [37.084, 77.837]
];

const FitMapToPakistan = () => {
  const map = useMap();
  
  useEffect(() => {
    map.fitBounds(PAKISTAN_BOUNDS);
  }, [map]);
  
  return null;
};

const FitBoundsButton = ({ machines }: { machines: Machine[] }) => {
  const map = useMap();
  
  const handleFitBounds = () => {
    if (machines.length === 0) return;
    
    const validMachines = machines.filter(m => !isNaN(m.lat) && !isNaN(m.lng));
    if (validMachines.length === 0) return;
    
    const bounds = L.latLngBounds(
      validMachines.map(m => [m.lat, m.lng] as [number, number])
    );
    map.fitBounds(bounds, { padding: [50, 50] });
  };
  
  return (
    <button
      onClick={handleFitBounds}
      className="absolute top-24 right-5 z-[1000] bg-teal-600 text-white border-none rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer shadow-md flex items-center gap-2 transition-colors duration-200 hover:bg-teal-700"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 6l9-4 9 4-9 4-9-4z" />
        <path d="M3 18l9-4 9 4-9 4-9-4z" />
        <path d="M3 12l9-4 9 4-9 4-9-4z" />
      </svg>
      View All Machines
    </button>
  );
};

// Function to extract coordinates from map links (including short URLs)
const extractCoordinatesFromMapLink = async (mapLink: string | undefined): Promise<{ lat: number; lng: number } | null> => {
  if (!mapLink) return null;
  
  try {
    // Clean the URL
    const cleanLink = mapLink.trim();
    
    // Try direct coordinate extraction first
    const directCoords = extractDirectCoordinates(cleanLink);
    if (directCoords) return directCoords;
    
    // For short URLs, we might need to fetch the full URL
    // This is a simplified approach - in production, you'd want a server-side solution
    if (cleanLink.includes('goo.gl') || cleanLink.includes('maps.app.goo.gl')) {
      // Extract coordinates from short URLs by pattern matching
      const shortUrlCoords = extractFromShortUrl(cleanLink);
      if (shortUrlCoords) return shortUrlCoords;
      
      // If we can't extract directly, try to get the final URL
      // Note: This won't work in browser due to CORS, but shows the approach
      try {
        // In a real app, you'd need a proxy server for this
        // const response = await fetch(`/api/resolve-url?url=${encodeURIComponent(cleanLink)}`);
        // const data = await response.json();
        // if (data.finalUrl) {
        //   return extractDirectCoordinates(data.finalUrl);
        // }
      } catch (error) {
        console.warn('Could not resolve short URL:', cleanLink);
      }
    }
    
    // Try various map service patterns
    const mapServiceCoords = extractFromMapServices(cleanLink);
    if (mapServiceCoords) return mapServiceCoords;
    
  } catch (error) {
    console.error('Error parsing map link:', mapLink, error);
  }
  
  return null;
};

// Extract coordinates directly from various formats
const extractDirectCoordinates = (url: string): { lat: number; lng: number } | null => {
  // Direct coordinates: "31.5497,74.3436"
  const coordMatch = url.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }
  
  // Google Maps patterns
  // Format: https://www.google.com/maps?q=lat,lng
  const googleQMatch = url.match(/google\.com\/maps\?q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (googleQMatch) {
    const lat = parseFloat(googleQMatch[1]);
    const lng = parseFloat(googleQMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }
  
  // Format: https://www.google.com/maps/@lat,lng,z
  const googleAtMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (googleAtMatch) {
    const lat = parseFloat(googleAtMatch[1]);
    const lng = parseFloat(googleAtMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }
  
  // Apple Maps
  const appleMatch = url.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (appleMatch) {
    const lat = parseFloat(appleMatch[1]);
    const lng = parseFloat(appleMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }
  
  // Try to extract any coordinates from the string
  const anyMatch = url.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
  if (anyMatch) {
    const lat = parseFloat(anyMatch[1]);
    const lng = parseFloat(anyMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }
  
  return null;
};

// Try to extract coordinates from short URLs
const extractFromShortUrl = (url: string): { lat: number; lng: number } | null => {
  // Some short URLs embed coordinates in the path
  // Example patterns that might work:
  
  // Try to find coordinates in the URL path
  const pathMatch = url.match(/(-?\d+\.?\d*)[,_](-?\d+\.?\d*)/);
  if (pathMatch) {
    const lat = parseFloat(pathMatch[1]);
    const lng = parseFloat(pathMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }
  
  return null;
};

// Extract from various map services
const extractFromMapServices = (url: string): { lat: number; lng: number } | null => {
  // OpenStreetMap
  const osmMatch = url.match(/openstreetmap\.org\/#map=\d+\/(-?\d+\.?\d*)\/(-?\d+\.?\d*)/);
  if (osmMatch) {
    const lat = parseFloat(osmMatch[1]);
    const lng = parseFloat(osmMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }
  
  // Bing Maps
  const bingMatch = url.match(/cp=(-?\d+\.?\d*)~(-?\d+\.?\d*)/);
  if (bingMatch) {
    const lat = parseFloat(bingMatch[1]);
    const lng = parseFloat(bingMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }
  
  return null;
};

// Fallback coordinates for Pakistan if no coordinates can be extracted
const getFallbackCoordinates = (machineName: string): { lat: number; lng: number } => {
  const hash = machineName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const pakistaniCities = [
    { name: "Karachi", lat: 24.8607, lng: 67.0011 },
    { name: "Lahore", lat: 31.5497, lng: 74.3436 },
    { name: "Islamabad", lat: 33.6844, lng: 73.0479 },
    { name: "Rawalpindi", lat: 33.5651, lng: 73.0169 },
    { name: "Faisalabad", lat: 31.4504, lng: 73.1350 },
    { name: "Multan", lat: 30.1575, lng: 71.5249 },
    { name: "Peshawar", lat: 34.0150, lng: 71.5805 },
    { name: "Quetta", lat: 30.1798, lng: 66.9750 },
    { name: "Sialkot", lat: 32.4945, lng: 74.5229 },
    { name: "Gujranwala", lat: 32.1617, lng: 74.1883 },
  ];
  
  const cityIndex = hash % pakistaniCities.length;
  const baseCity = pakistaniCities[cityIndex];
  
  const latOffset = ((hash % 100) / 1000) - 0.05;
  const lngOffset = (((hash * 7) % 100) / 1000) - 0.05;
  
  return {
    lat: baseCity.lat + latOffset,
    lng: baseCity.lng + lngOffset
  };
};

// Generate a Google Maps link from coordinates
const generateMapLink = (lat: number, lng: number): string => {
  return `https://www.google.com/maps?q=${lat},${lng}`;
};

const MachineMap: React.FC = () => {
  const [allMachines, setAllMachines] = useState<Machine[]>([]);
  const [filteredMachines, setFilteredMachines] = useState<Machine[]>([]);
  const [activeFilters, setActiveFilters] = useState<{
    status: StatusFilter[];
    stock: StockFilter[];
    categories: CategoryFilter[];
  }>({
    status: [],
    stock: [],
    categories: []
  });
  const [loading, setLoading] = useState(true);
  const [machineStockMap, setMachineStockMap] = useState<{ [code: string]: { status: string, stockedBy?: string } }>({});

  // Calculate statistics including category counts and machine type counts
  const stats = useMemo(() => {
    const onlineMachines = allMachines.filter(m => m.status === "online").length;
    const offlineMachines = allMachines.filter(m => m.status === "offline").length;
    const unknownMachines = allMachines.filter(m => m.status === "unknown").length;
    const goodStockMachines = allMachines.filter(m => m.stockStatus === "In Stock").length;
    const lowStockMachines = allMachines.filter(m => m.stockStatus === "Low Stock").length;
    const outOfStockMachines = allMachines.filter(m => m.stockStatus === "Out of Stock").length;
    
    // Machine type counts
    const sanitaryMachines = allMachines.filter(m => m.machine_type === "sanitary").length;
    const dispensingMachines = allMachines.filter(m => m.machine_type === "dispensing").length;
    
    // Category counts
    const categoryCounts: { [key: string]: number } = {};
    
    const allCategories = [...SANITARY_CATEGORIES, ...DISPENSING_CATEGORIES];
    allCategories.forEach(category => {
      categoryCounts[category] = allMachines.filter(m => m.category === category).length;
    });
    
    return {
      online: onlineMachines,
      offline: offlineMachines,
      unknown: unknownMachines,
      goodStock: goodStockMachines,
      lowStock: lowStockMachines,
      outOfStock: outOfStockMachines,
      total: allMachines.length,
      sanitary: sanitaryMachines,
      dispensing: dispensingMachines,
      categories: categoryCounts
    };
  }, [allMachines]);

  // Apply filters when activeFilters changes
  useEffect(() => {
    let filtered = allMachines;
    
    // Apply status filters
    if (activeFilters.status.length > 0) {
      filtered = filtered.filter(m => activeFilters.status.includes(m.status));
    }
    
    // Apply stock filters
    if (activeFilters.stock.length > 0) {
      filtered = filtered.filter(m => {
        if (m.stockStatus === "In Stock" && activeFilters.stock.includes("good-stock")) return true;
        if (m.stockStatus === "Low Stock" && activeFilters.stock.includes("low-stock")) return true;
        if (m.stockStatus === "Out of Stock" && activeFilters.stock.includes("out-of-stock")) return true;
        return false;
      });
    }
    
    // Apply category filters
    if (activeFilters.categories.length > 0) {
      filtered = filtered.filter(m => activeFilters.categories.includes(m.category as CategoryFilter));
    }
    
    setFilteredMachines(filtered);
  }, [allMachines, activeFilters]);

  // Toggle status filter
  const toggleStatusFilter = (filter: StatusFilter) => {
    setActiveFilters(prev => {
      const newStatus = prev.status.includes(filter)
        ? prev.status.filter(f => f !== filter)
        : [...prev.status, filter];
      
      return {
        ...prev,
        status: newStatus
      };
    });
  };

  // Toggle stock filter
  const toggleStockFilter = (filter: StockFilter) => {
    setActiveFilters(prev => {
      const newStock = prev.stock.includes(filter)
        ? prev.stock.filter(f => f !== filter)
        : [...prev.stock, filter];
      
      return {
        ...prev,
        stock: newStock
      };
    });
  };

  // Toggle category filter
  const toggleCategoryFilter = (filter: CategoryFilter) => {
    setActiveFilters(prev => {
      const newCategories = prev.categories.includes(filter)
        ? prev.categories.filter(f => f !== filter)
        : [...prev.categories, filter];
      
      return {
        ...prev,
        categories: newCategories
      };
    });
  };

  // Reset all filters
  const resetFilters = () => {
    setActiveFilters({
      status: [],
      stock: [],
      categories: []
    });
  };

  // Check if any filter is active
  const isAnyFilterActive = () => {
    return activeFilters.status.length > 0 || activeFilters.stock.length > 0 || activeFilters.categories.length > 0;
  };

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const res = await getRequest<MachinesResponse>(`/superadmin/getAllMachineStockAndStatus`);
      const { machines: machinesData, brands } = res.data;

      const stockMap: { [code: string]: { status: string, stockedBy?: string } } = {};
      const allBrands = [...brands.vending, ...brands.dispensing];
      const grouped: { [machine_code: string]: { quantities: number[], stockedBy?: string } } = {};

      // Process brands to get stock information and stockedBy
      allBrands.forEach((brand) => {
        const code = brand.machine_code;
        const stockedBy = brand?.latestFilling?.stockedby;
        
        if (!grouped[code]) {
          grouped[code] = { quantities: [], stockedBy };
        }
        
        // Add quantity
        grouped[code].quantities.push(brand.availableQuantity);
        
        // Keep the most recent stockedBy (if not already set)
        if (!grouped[code].stockedBy && stockedBy) {
          grouped[code].stockedBy = stockedBy;
        }
      });

      // Determine stock status and store stockedBy
      for (const [code, data] of Object.entries(grouped)) {
        const total = data.quantities.reduce((sum, q) => sum + q, 0);
        let status = "Out of Stock";
        
        if (total === 0) {
          status = "Out of Stock";
        } else if (total < 2) {
          status = "Low Stock";
        } else {
          status = "In Stock";
        }
        
        stockMap[code] = {
          status,
          stockedBy: data.stockedBy
        };
      }

      const processedMachines: Machine[] = [];

      // Process each category separately
      for (const [category, machines] of Object.entries(machinesData)) {
        for (const machine of machines) {
          let status: "online" | "offline" | "unknown" = "offline";

          // Map API status to our status types
          if (machine.status?.toLowerCase() === "online") {
            status = "online";
          } else if (machine.status?.toLowerCase() === "unknown") {
            status = "unknown";
          } else {
            status = "offline";
          }

          const stockInfo = stockMap[machine.machine_code] || { status: "Out of Stock" };
          const stockStatus = stockInfo.status as "In Stock" | "Low Stock" | "Out of Stock";
          let stockLevel = 0;

          if (stockStatus === "In Stock") stockLevel = 80;
          else if (stockStatus === "Low Stock") stockLevel = 30;
          else stockLevel = 0;

          const lastUpdated = machine.lastUpdated
            ? new Date(machine.lastUpdated * 1000).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

          // Determine machine type based on category
          let machineType: MachineType = "dispensing"; // default
          if (category === "Butterfly") {
            machineType = "sanitary";
          }

          // Extract coordinates - prioritize map_link if available
          let lat = machine.lat;
          let lng = machine.lng;
          let map_link = machine.map_link; // Assuming API provides this field

          // If we have a map link, try to extract coordinates from it
          if (map_link && (!lat || !lng || isNaN(lat) || isNaN(lng))) {
            const coords = await extractCoordinatesFromMapLink(map_link);
            if (coords) {
              lat = coords.lat;
              lng = coords.lng;
            }
          }

          // If still no valid coordinates, use fallback
          if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            const fallbackCoords = getFallbackCoordinates(machine.machine_name);
            lat = fallbackCoords.lat;
            lng = fallbackCoords.lng;
          }

          // Generate a map link if none exists
          if (!map_link) {
            map_link = generateMapLink(lat, lng);
          }

          processedMachines.push({
            _id: machine.id.toString(),
            name: machine.machine_name,
            lat,
            lng,
            status,
            stockStatus,
            stockLevel,
            lastUpdated,
            machine_code: machine.machine_code,
            machine_type: machineType,
            location: machine.machine_location,
            category: category,
            stockedBy: stockInfo.stockedBy || "Unknown",
            map_link
          });
        }
      }

      setAllMachines(processedMachines);
      setFilteredMachines(processedMachines);
      setMachineStockMap(stockMap);
    } catch (error) {
      console.error("Error fetching machines:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const getMarkerIcon = (status: string, stockStatus: string, machineType: MachineType) => {
    let iconSvg = '';
    let fillColor = '#0d9488'; // teal-600

    if (machineType === "sanitary") {
      fillColor = '#8b5cf6'; // purple-500 for sanitary machines
    }

    if (status === "offline") {
      fillColor = machineType === "sanitary" ? '#a78bfa' : '#0d9488';
      iconSvg = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="white" stroke="${fillColor}" stroke-width="2"/>
          <circle cx="12" cy="12" r="5" fill="white" stroke="${fillColor}" stroke-width="2"/>
        </svg>
      `;
    } else if (status === "unknown") {
      fillColor = machineType === "sanitary" ? '#a78bfa' : '#0d9488';
      iconSvg = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="white" stroke="${fillColor}" stroke-width="2"/>
          <path d="M12 16V12" stroke="${fillColor}" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="8" r="1" fill="${fillColor}"/>
        </svg>
      `;
    } else if (stockStatus === "Low Stock" || stockStatus === "Out of Stock") {
      fillColor = stockStatus === "Out of Stock" 
        ? (machineType === "sanitary" ? '#c4b5fd' : '#0d9488') 
        : (machineType === "sanitary" ? '#a78bfa' : '#0d9488');
      iconSvg = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="white" stroke="${fillColor}" stroke-width="2"/>
          <path d="M12 8V12" stroke="${fillColor}" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="16" r="1" fill="${fillColor}"/>
        </svg>
      `;
    } else {
      iconSvg = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="white" stroke="${fillColor}" stroke-width="2"/>
          <path d="M8 12L11 15L16 9" stroke="${fillColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    }

    return L.divIcon({
      html: `
        <div style="position: relative;">
          ${iconSvg}
          ${stockStatus === "Low Stock" || stockStatus === "Out of Stock" ? `
            <div style="
              position: absolute;
              top: -4px;
              right: -4px;
              background: ${fillColor};
              color: white;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              font-weight: bold;
              border: 2px solid white;
            ">
              ${stockStatus === "Out of Stock" ? "0%" : "!"}
            </div>
          ` : ''}
        </div>
      `,
      className: "",
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });
  };

  const MapLegend = () => (
    <div className="absolute bottom-5 right-5 bg-white p-4 rounded-lg shadow-md z-[1000] font-sans text-sm border border-gray-200">
      <h3 className="mt-0 mb-2.5 text-teal-600 font-semibold">Machine Status</h3>
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-500 mb-2">Dispensing Machines</h4>
        <div className="flex items-center mb-2">
          <div className="w-5 h-5 mr-2.5">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="white" stroke="#0d9488" strokeWidth="2" />
              <path d="M8 12L11 15L16 9" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span>Online & Good Stock</span>
        </div>
        
        <div className="flex items-center mb-2">
          <div className="w-5 h-5 mr-2.5">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="white" stroke="#0d9488" strokeWidth="2" />
              <circle cx="12" cy="12" r="5" fill="white" stroke="#0d9488" stroke-width="2"/>
            </svg>
          </div>
          <span>Offline Machine</span>
        </div>
        <div className="flex items-center mb-2">
          <div className="w-5 h-5 mr-2.5">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="white" stroke="#0d9488" strokeWidth="2" />
              <path d="M12 16V12" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="8" r="1" fill="#0d9488" />
            </svg>
          </div>
          <span>Pending (Connecting)</span>
        </div>
        <div className="flex items-center mb-2">
          <div className="w-5 h-5 mr-2.5">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="white" stroke="#0d9488" strokeWidth="2" />
              <path d="M12 8V12" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="#0d9488" />
            </svg>
          </div>
          <span>Low Stock</span>
        </div>
        <div className="flex items-center mb-2">
          <div className="w-5 h-5 mr-2.5">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="white" stroke="#0d9488" strokeWidth="2" />
              <path d="M12 8V12" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="#0d9488" />
            </svg>
          </div>
          <span>Out of Stock</span>
        </div>
      </div>
      
      <div>
        <h4 className="text-xs font-semibold text-gray-500 mb-2">Sanitary Machines (Butterfly)</h4>
        <div className="flex items-center mb-2">
          <div className="w-5 h-5 mr-2.5">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="white" stroke="#8b5cf6" strokeWidth="2" />
              <path d="M8 12L11 15L16 9" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span>Online & Good Stock</span>
        </div>
        <div className="flex items-center mb-2">
          <div className="w-5 h-5 mr-2.5">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="white" stroke="#a78bfa" strokeWidth="2" />
              <circle cx="12" cy="12" r="5" fill="white" stroke="#a78bfa" stroke-width="2"/>
            </svg>
          </div>
          <span>Offline Machine</span>
        </div>
        <div className="flex items-center mb-2">
          <div className="w-5 h-5 mr-2.5">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="white" stroke="#a78bfa" strokeWidth="2" />
              <path d="M12 16V12" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="8" r="1" fill="#a78bfa" />
            </svg>
          </div>
          <span>Pending (Connecting)</span>
        </div>
        <div className="flex items-center mb-2">
          <div className="w-5 h-5 mr-2.5">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="white" stroke="#a78bfa" strokeWidth="2" />
              <path d="M12 8V12" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="#a78bfa" />
            </svg>
          </div>
          <span>Low Stock</span>
        </div>
        <div className="flex items-center mb-2">
          <div className="w-5 h-5 mr-2.5">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="white" stroke="#a78bfa" strokeWidth="2" />
              <path d="M12 8V12" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="#a78bfa" />
            </svg>
          </div>
          <span>Out of Stock</span>
        </div>
      </div>
    </div>
  );

  const StatusBadge = ({ status, stockStatus, machineType }: { status: string, stockStatus: string, machineType: string }) => {
    let bgColor = 'bg-green-100 text-green-800';
    let icon = '✓';

    if (machineType === "sanitary") {
      bgColor = 'bg-purple-100 text-purple-800';
    }

    if (status === "offline") {
      bgColor = machineType === "sanitary" ? 'bg-purple-50 text-purple-600' : 'bg-red-100 text-red-800';
      icon = '✗';
    } else if (status === "unknown") {
      bgColor = machineType === "sanitary" ? 'bg-purple-50 text-purple-600' : 'bg-amber-100 text-amber-800';
      icon = '⏳';
    } else if (stockStatus === "Out of Stock") {
      bgColor = machineType === "sanitary" ? 'bg-purple-50 text-purple-600' : 'bg-red-100 text-red-800';
      icon = '⚠';
    } else if (stockStatus === "Low Stock") {
      bgColor = machineType === "sanitary" ? 'bg-purple-50 text-purple-600' : 'bg-yellow-100 text-yellow-800';
      icon = '⚠';
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${bgColor}`}>
        {icon} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const StockIndicator = ({ stockLevel, stockStatus }: { stockLevel: number, stockStatus: string }) => {
    let color = '#10b981';
    if (stockStatus === "Low Stock") color = '#d97706';
    if (stockStatus === "Out of Stock") color = '#dc2626';

    return (
      <div className="flex items-center gap-2 mt-1">
        <div className="w-14 h-1.5 bg-gray-200 rounded overflow-hidden">
          <div 
            className="h-full rounded" 
            style={{ width: `${stockLevel}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-xs text-gray-500 font-medium">
          {stockStatus}
        </span>
      </div>
    );
  };

  // Get category icon
  const getCategoryIcon = (category: string, machineType: string) => {
    const icons: { [key: string]: string } = {
      "Butterfly": "🦋",
      "Cooking Oil": "🫙",
      "Laundry": "👕",
      "Shampoo": "🧴",
      "BodyWash": "🚿",
      "Handwash": "🧼",
      "Dishwash": "🍽️",
      "Surface Cleaner": "🧹",
      "Unknown": "❓"
    };
    
    return icons[category] || (machineType === "sanitary" ? "🧻" : "📦");
  };

  // Get category color
  const getCategoryColor = (category: string, machineType: string) => {
    if (machineType === "sanitary") {
      return "bg-purple-100 text-purple-800";
    }

    const colors: { [key: string]: string } = {
      "Cooking Oil": "bg-yellow-100 text-yellow-800",
      "Laundry": "bg-blue-100 text-blue-800",
      "Shampoo": "bg-pink-100 text-pink-800",
      "BodyWash": "bg-cyan-100 text-cyan-800",
      "Handwash": "bg-green-100 text-green-800",
      "Dishwash": "bg-orange-100 text-orange-800",
      "Surface Cleaner": "bg-gray-100 text-gray-800",
      "Unknown": "bg-gray-100 text-gray-800"
    };
    
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-5" />
          <p className="text-gray-500 text-base">Loading machine data...</p>
        </div>
      </div>
    )
  }

  // All categories to display
  const allCategories = [...SANITARY_CATEGORIES, ...DISPENSING_CATEGORIES];

  return (
    <div className="relative h-screen w-full">
      <SiteHeader title="Map Locations" />
      <MapContainer
        center={[30.3753, 69.3451]}
        zoom={6}
        minZoom={5}
        maxZoom={18}
        className="h-full w-full"
        maxBounds={PAKISTAN_BOUNDS}
        maxBoundsViscosity={1.0}
      >
        <FitMapToPakistan />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {filteredMachines.map((m) => (
          <Marker
            key={m._id}
            position={[m.lat, m.lng]}
            icon={getMarkerIcon(m.status, m.stockStatus, m.machine_type as MachineType)}
          >
            <Popup>
              <div className="min-w-[200px] font-sans">
                <div className="flex justify-between items-center mb-2 pb-2 border-b-2 border-teal-600">
                  <h3 className="m-0 text-teal-600 text-base font-semibold">
                    {m.name}
                  </h3>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={m.status} stockStatus={m.stockStatus} machineType={m.machine_type} />
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      m.machine_type === "sanitary" 
                        ? "bg-purple-600 text-white" 
                        : "bg-teal-600 text-white"
                    }`}>
                      {m.machine_type.charAt(0).toUpperCase() + m.machine_type.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="mb-1.5 text-sm text-gray-500">
                  <strong>Code:</strong> {m.machine_code}
                </div>

                <div className="mb-1.5 text-sm text-gray-500">
                  <strong>Location:</strong> {m.location}
                </div>

                <div className="mb-1.5 text-sm text-gray-500">
                  <strong>Category:</strong> 
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getCategoryColor(m.category, m.machine_type)}`}>
                    {getCategoryIcon(m.category, m.machine_type)} {m.category}
                  </span>
                </div>

                {/* Add stockedBy information */}
                <div className="mb-1.5 text-sm text-gray-500">
                  <strong>Last Refilled By:</strong> 
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    m.stockedBy === "Unknown" 
                      ? "bg-gray-100 text-gray-800" 
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {m.stockedBy}
                  </span>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-500">Stock Status:</span>
                    <span className={`font-semibold ${
                      m.stockStatus === "Out of Stock" ? 'text-red-600' :
                      m.stockStatus === "Low Stock" ? 'text-amber-600' : 'text-green-500'
                    }`}>
                      {m.stockStatus}
                    </span>
                  </div>
                  <StockIndicator stockLevel={m.stockLevel} stockStatus={m.stockStatus} />
                </div>

                {/* Map Link */}
                <div className="mb-1.5 text-sm text-gray-500">
                  <strong>Map Location:</strong> 
                  <a 
                    href={m.map_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors inline-flex items-center gap-1"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    View on Map
                  </a>
                </div>

                <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                  Last Updated: {m.lastUpdated}
                </div>

                {m.status === "offline" && (
                  <div className="mt-2 p-1.5 bg-red-50 rounded text-xs text-red-600 flex items-center gap-1">
                    ⚠ Machine is currently offline
                  </div>
                )}

                {m.status === "unknown" && (
                  <div className="mt-2 p-1.5 bg-amber-50 rounded text-xs text-amber-600 flex items-center gap-1">
                    ⏳ Machine is connecting (pending)
                  </div>
                )}

                {m.stockStatus === "Low Stock" && m.status === "online" && (
                  <div className="mt-2 p-1.5 bg-amber-50 rounded text-xs text-amber-600 flex items-center gap-1">
                    ⚠ Stock is running low
                  </div>
                )}

                {m.stockStatus === "Out of Stock" && m.status === "online" && (
                  <div className="mt-2 p-1.5 bg-red-50 rounded text-xs text-red-600 flex items-center gap-1">
                    ⚠ Machine is out of stock
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        <FitBoundsButton machines={filteredMachines} />
      </MapContainer>

      <MapLegend />

      {/* Filter Panel - Updated for multiple filters */}
      <div className="absolute top-12 left-0 bg-white p-5 rounded-xl shadow-lg z-[1000] w-80 border border-gray-200 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="m-0 text-teal-600 text-xl font-bold">
            🇵🇰 Machine Filters
          </h2>
          
          {isAnyFilterActive() && (
            <button
              onClick={resetFilters}
              className="bg-gray-500 text-white border-none rounded px-3 py-1.5 text-xs font-semibold cursor-pointer flex items-center gap-1 hover:bg-gray-600 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M7 12h10M5 18h14" />
              </svg>
              Reset All
            </button>
          )}
        </div>

        {/* Machine Type Summary */}
        <div className="mb-5 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700 font-semibold">Machine Types:</span>
            <span className="bg-teal-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
              {stats.total} total
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-purple-50 p-2 rounded text-center">
              <div className="text-purple-600 font-bold text-sm">Sanitary</div>
              <div className="text-xs text-gray-600">{stats.sanitary} machines</div>
            </div>
            <div className="bg-teal-50 p-2 rounded text-center">
              <div className="text-teal-600 font-bold text-sm">Dispensing</div>
              <div className="text-xs text-gray-600">{stats.dispensing} machines</div>
            </div>
          </div>
        </div>

        {/* Active Filters Indicator */}
        {isAnyFilterActive() && (
          <div className="mb-5 p-2.5 bg-teal-50 rounded-lg border border-cyan-100">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-teal-600 font-semibold text-sm">
                  Active Filters:
                </span>
                <span className="bg-teal-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                  {filteredMachines.length} machines
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {activeFilters.status.map(status => (
                  <span key={status} className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                    {status.toUpperCase()}
                  </span>
                ))}
                {activeFilters.stock.map(stock => (
                  <span key={stock} className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs">
                    {stock.replace('-', ' ').toUpperCase()}
                  </span>
                ))}
                {activeFilters.categories.map(category => (
                  <span key={category} className={`px-2 py-0.5 rounded-full text-xs ${
                    SANITARY_CATEGORIES.includes(category) 
                      ? "bg-purple-100 text-purple-800" 
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Status Filters */}
        <div className="mb-6">
          <h3 className="mt-0 mb-3 text-gray-700 text-sm font-semibold">
            Status (Select Multiple)
          </h3>
          
          <div className="grid grid-cols-2 gap-2.5">
            {/* Online Machines */}
            <div
              onClick={() => toggleStatusFilter("online")}
              className={`rounded-lg p-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                activeFilters.status.includes("online") 
                  ? 'bg-green-50 border-2 border-green-600' 
                  : 'bg-gray-50 border-2 border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-700 text-sm font-semibold">Online</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeFilters.status.includes("online") 
                    ? 'bg-green-600 text-white' 
                    : 'bg-green-500 text-white'
                }`}>
                  {stats.online}
                </span>
              </div>
              <div className="w-full h-1 bg-gray-200 rounded overflow-hidden">
                <div 
                  className="h-full bg-green-500" 
                  style={{ width: `${(stats.online / stats.total) * 100}%` }}
                />
              </div>
            </div>

            {/* Offline Machines */}
            <div
              onClick={() => toggleStatusFilter("offline")}
              className={`rounded-lg p-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                activeFilters.status.includes("offline") 
                  ? 'bg-red-50 border-2 border-red-600' 
                  : 'bg-gray-50 border-2 border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-700 text-sm font-semibold">Offline</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeFilters.status.includes("offline") 
                    ? 'bg-red-600 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {stats.offline}
                </span>
              </div>
              <div className="w-full h-1 bg-gray-200 rounded overflow-hidden">
                <div 
                  className="h-full bg-red-500" 
                  style={{ width: `${(stats.offline / stats.total) * 100}%` }}
                />
              </div>
            </div>

            {/* Unknown (Pending) Machines */}
            <div
              onClick={() => toggleStatusFilter("unknown")}
              className={`rounded-lg p-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                activeFilters.status.includes("unknown") 
                  ? 'bg-amber-50 border-2 border-amber-600' 
                  : 'bg-gray-50 border-2 border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-700 text-sm font-semibold">Pending</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeFilters.status.includes("unknown") 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-amber-500 text-white'
                }`}>
                  {stats.unknown}
                </span>
              </div>
              <div className="w-full h-1 bg-gray-200 rounded overflow-hidden">
                <div 
                  className="h-full bg-amber-500" 
                  style={{ width: `${(stats.unknown / stats.total) * 100}%` }}
                />
              </div>
            </div>

            {/* All Status */}
            <div
              onClick={() => {
                if (activeFilters.status.length === 3) {
                  setActiveFilters(prev => ({ ...prev, status: [] }));
                } else {
                  setActiveFilters(prev => ({ 
                    ...prev, 
                    status: ["online", "offline", "unknown"] 
                  }));
                }
              }}
              className={`rounded-lg p-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                activeFilters.status.length === 3
                  ? 'bg-gray-100 border-2 border-teal-600' 
                  : 'bg-gray-50 border-2 border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-700 text-sm font-semibold">All Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeFilters.status.length === 3
                    ? 'bg-teal-600 text-white' 
                    : 'bg-gray-500 text-white'
                }`}>
                  {stats.total}
                </span>
              </div>
              <div className="w-full h-1 bg-gray-200 rounded overflow-hidden">
                <div className="h-full bg-gray-500" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Stock Filters */}
        <div className="mb-6">
          <h3 className="mt-0 mb-3 text-gray-700 text-sm font-semibold">
            Stock Status (Select Multiple)
          </h3>
          
          <div className="grid grid-cols-3 gap-2.5">
            {/* Good Stock */}
            <div
              onClick={() => toggleStockFilter("good-stock")}
              className={`rounded-lg p-2.5 cursor-pointer text-center transition-all duration-200 hover:scale-[1.02] ${
                activeFilters.stock.includes("good-stock") 
                  ? 'bg-green-50 border-2 border-green-600' 
                  : 'bg-gray-50 border-2 border-gray-200'
              }`}
            >
              <div className="text-xl mb-1 text-green-500">✓</div>
              <div className="text-xs font-semibold text-gray-700 mb-1">
                Good Stock
              </div>
              <div className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold inline-block ${
                activeFilters.stock.includes("good-stock") 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-500 text-white'
              }`}>
                {stats.goodStock}
              </div>
            </div>

            {/* Low Stock */}
            <div
              onClick={() => toggleStockFilter("low-stock")}
              className={`rounded-lg p-2.5 cursor-pointer text-center transition-all duration-200 hover:scale-[1.02] ${
                activeFilters.stock.includes("low-stock") 
                  ? 'bg-amber-50 border-2 border-amber-600' 
                  : 'bg-gray-50 border-2 border-gray-200'
              }`}
            >
              <div className="text-xl mb-1 text-amber-600">⚠</div>
              <div className="text-xs font-semibold text-gray-700 mb-1">
                Low Stock
              </div>
              <div className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold inline-block ${
                activeFilters.stock.includes("low-stock") 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-amber-500 text-white'
              }`}>
                {stats.lowStock}
              </div>
            </div>

            {/* Out of Stock */}
            <div
              onClick={() => toggleStockFilter("out-of-stock")}
              className={`rounded-lg p-2.5 cursor-pointer text-center transition-all duration-200 hover:scale-[1.02] ${
                activeFilters.stock.includes("out-of-stock") 
                  ? 'bg-red-50 border-2 border-red-600' 
                  : 'bg-gray-50 border-2 border-gray-200'
              }`}
            >
              <div className="text-xl mb-1 text-red-600">✗</div>
              <div className="text-xs font-semibold text-gray-700 mb-1">
                Out of Stock
              </div>
              <div className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold inline-block ${
                activeFilters.stock.includes("out-of-stock") 
                  ? 'bg-red-600 text-white' 
                  : 'bg-red-500 text-white'
              }`}>
                {stats.outOfStock}
              </div>
            </div>
          </div>
        </div>

        {/* Product Category Filters */}
        <div>
          <h3 className="mt-0 mb-3 text-gray-700 text-sm font-semibold">
            Machine Types (Select Multiple)
          </h3>
          
          <div className="space-y-2.5">
            {/* Sanitary Type Filter */}
            <div
              onClick={() => {
                const sanitaryCategories = ["Butterfly"] as CategoryFilter[];
                const allCurrentlySelected = sanitaryCategories.every(cat => 
                  activeFilters.categories.includes(cat)
                );
                
                if (allCurrentlySelected) {
                  const newCategories = activeFilters.categories.filter(
                    cat => !sanitaryCategories.includes(cat)
                  );
                  setActiveFilters(prev => ({
                    ...prev,
                    categories: newCategories
                  }));
                } else {
                  const newCategories = [
                    ...activeFilters.categories.filter(cat => !sanitaryCategories.includes(cat)),
                    ...sanitaryCategories
                  ];
                  setActiveFilters(prev => ({
                    ...prev,
                    categories: newCategories
                  }));
                }
              }}
              className={`flex items-center justify-between rounded-lg p-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                activeFilters.categories.some(cat => SANITARY_CATEGORIES.includes(cat))
                  ? 'bg-purple-100 text-purple-800 border-2 border-purple-600' 
                  : 'bg-gray-50 border-2 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🧻</span>
                <div>
                  <span className="text-sm font-semibold text-gray-700">
                    Sanitary
                  </span>
                  <div className="text-xs text-gray-500">Butterfly machines</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeFilters.categories.some(cat => SANITARY_CATEGORIES.includes(cat))
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-500 text-white'
              }`}>
                {stats.sanitary}
              </span>
            </div>
            
            {/* Dispensing Type Filter */}
            <div
              onClick={() => {
                const dispensingCategories = DISPENSING_CATEGORIES as CategoryFilter[];
                const allCurrentlySelected = dispensingCategories.every(cat => 
                  activeFilters.categories.includes(cat)
                );
                
                if (allCurrentlySelected) {
                  const newCategories = activeFilters.categories.filter(
                    cat => !dispensingCategories.includes(cat)
                  );
                  setActiveFilters(prev => ({
                    ...prev,
                    categories: newCategories
                  }));
                } else {
                  const newCategories = [
                    ...activeFilters.categories.filter(cat => !dispensingCategories.includes(cat)),
                    ...dispensingCategories
                  ];
                  setActiveFilters(prev => ({
                    ...prev,
                    categories: newCategories
                  }));
                }
              }}
              className={`flex items-center justify-between rounded-lg p-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                activeFilters.categories.some(cat => DISPENSING_CATEGORIES.includes(cat))
                  ? 'bg-teal-50 border-2 border-teal-600' 
                  : 'bg-gray-50 border-2 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">📦</span>
                <div>
                  <span className="text-sm font-semibold text-gray-700">
                    Dispensing
                  </span>
                  <div className="text-xs text-gray-500">Cooking Oil, Laundry, Shampoo, etc.</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeFilters.categories.some(cat => DISPENSING_CATEGORIES.includes(cat))
                  ? 'bg-teal-600 text-white' 
                  : 'bg-gray-500 text-white'
              }`}>
                {stats.dispensing}
              </span>
            </div>
            
            {/* Select All Categories */}
            <div
              onClick={() => {
                const allCategories = [...SANITARY_CATEGORIES, ...DISPENSING_CATEGORIES] as CategoryFilter[];
                if (activeFilters.categories.length === allCategories.length) {
                  setActiveFilters(prev => ({ ...prev, categories: [] }));
                } else {
                  setActiveFilters(prev => ({ 
                    ...prev, 
                    categories: allCategories
                  }));
                }
              }}
              className={`flex items-center justify-between bg-gray-50 rounded-lg p-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                activeFilters.categories.length === (SANITARY_CATEGORIES.length + DISPENSING_CATEGORIES.length)
                  ? 'bg-teal-50 border-2 border-teal-600' 
                  : 'border-2 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🏭</span>
                <span className="text-sm font-semibold text-gray-700">
                  All Machine Types
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeFilters.categories.length === (SANITARY_CATEGORIES.length + DISPENSING_CATEGORIES.length)
                  ? 'bg-teal-600 text-white' 
                  : 'bg-gray-500 text-white'
              }`}>
                {stats.total}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachineMap;