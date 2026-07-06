export interface RideStop {
  machineCode: string | null;
  name: string;
  lat: number;
  lng: number;
  arrived: boolean;
}

export interface RiderLocation {
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
  dest_lat: number | null;
  dest_lng: number | null;
  dest_name: string | null;
  mode?: "single" | "batch";
  stops?: RideStop[];
  currentStop?: number;
  /** Breadcrumb trail of positions the rider has actually traveled. */
  route?: { lat: number; lng: number }[];
}

export interface RideHistory {
  id: number;
  user_id: number;
  username: string;
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
  /** Machine stops visited on this ride, in visit order. */
  stops?: RideStop[];
  /** GPS breadcrumb trail the rider actually traveled. */
  route_path?: { lat: number; lng: number }[];
}

export interface RideHistoryPagination {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface RideHistoryResponse {
  data: RideHistory[];
  pagination: RideHistoryPagination;
}