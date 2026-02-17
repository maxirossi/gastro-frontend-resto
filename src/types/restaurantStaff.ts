export interface RestaurantStaff {
  id: string;
  restaurant_id: string;
  name: string;
  role: string;
  shift?: string | null;
  contact?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RestaurantStaffCreateRequest {
  name: string;
  role: string;
  shift?: string;
  contact?: string;
  isActive?: boolean;
}

export interface RestaurantStaffUpdateRequest {
  name?: string;
  role?: string;
  shift?: string;
  contact?: string;
  isActive?: boolean;
}

export interface RestaurantStaffListQuery {
  q?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface RestaurantStaffListResponse {
  items: RestaurantStaff[];
  total: number;
}
