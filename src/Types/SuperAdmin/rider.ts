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