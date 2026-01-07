export interface PlaceLocation {
  city?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export interface PlaceContact {
  whatsapp_phone?: string;
  email?: string;
}

export interface PlaceCapacity {
  availability?: boolean;
  available_count?: number;
}

export interface PlaceMedia {
  url: string;
  sort_order?: number;
}

export interface Place {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category_key?: string;
  is_published?: boolean;
  place_location?: PlaceLocation | PlaceLocation[];
  place_contact?: PlaceContact | PlaceContact[];
  place_capacity?: PlaceCapacity | PlaceCapacity[];
  place_media?: PlaceMedia[];
}

export interface PlaceResponse {
  ok: boolean;
  data?: Place;
  error?: string;
}

export interface PlaceUpdateRequest {
  slug: string;
  patch: {
    name?: string;
    description?: string;
    is_published?: boolean;
    whatsapp_phone?: string | null;
    email?: string | null;
    city?: string;
    address?: string | null;
    lat?: number | null;
    lng?: number | null;
    availability?: string | null;
    available_count?: number | null;
  };
  media_urls?: string[];
  replace_media?: boolean;
}

