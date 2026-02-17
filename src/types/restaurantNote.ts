export type RestaurantNoteType = 'OPERATIVE' | 'ISSUE' | 'IDEA';

export interface RestaurantNote {
  id: string;
  restaurant_id: string;
  date: string;
  type?: RestaurantNoteType | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantNoteCreateRequest {
  date: string;
  type?: RestaurantNoteType;
  content: string;
}

export interface RestaurantNoteUpdateRequest {
  date?: string;
  type?: RestaurantNoteType;
  content?: string;
}

export interface RestaurantNoteListQuery {
  from?: string;
  to?: string;
  type?: RestaurantNoteType;
  q?: string;
  page?: number;
  limit?: number;
}

export interface RestaurantNoteListResponse {
  items: RestaurantNote[];
  total: number;
}
