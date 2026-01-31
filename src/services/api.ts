import { getRestaurantToken } from '../utils/auth';
import type { PlaceResponse, PlaceUpdateRequest } from '../types/place';
import { API_BASE_URL } from '../lib/api';

export interface RestaurantLoginResponse {
  ok: boolean;
  token: string;
  place_id: string;
  expires_in?: number;
  restaurant?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface RestaurantLoginRequest {
  username: string;
  password: string;
}

/**
 * Helper para hacer fetch con autenticación
 */
const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getRestaurantToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

/**
 * Realiza el login del restaurante
 */
export const restaurantLogin = async (
  credentials: RestaurantLoginRequest
): Promise<RestaurantLoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/places/restaurant-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al iniciar sesión');
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error || 'Credenciales inválidas');
  }

  return data;
};

/**
 * Obtiene un restaurante por slug
 */
export const getPlaceBySlug = async (slug: string): Promise<PlaceResponse> => {
  const response = await authFetch(`${API_BASE_URL}/places/by-slug?slug=${encodeURIComponent(slug)}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al obtener el restaurante');
  }

  return response.json();
};

/**
 * Actualiza un restaurante
 */
export const updatePlace = async (updateData: PlaceUpdateRequest): Promise<{ ok: boolean; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/places/update`, {
    method: 'POST',
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al actualizar el restaurante');
  }

  return response.json();
};

// ========== TAGS API ==========

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
}

export const getAllTags = async (): Promise<Tag[]> => {
  const response = await authFetch(`${API_BASE_URL}/tags/list`);

  if (!response.ok) {
    throw new Error('Error al obtener la lista de tags');
  }

  const result = await response.json();
  if (result.ok && Array.isArray(result.data)) {
    return result.data;
  }
  return [];
};

export const getTagsByPlace = async (slug: string): Promise<Tag[]> => {
  const response = await authFetch(`${API_BASE_URL}/tags/by-place?slug=${encodeURIComponent(slug)}`);

  if (!response.ok) {
    throw new Error('Error al obtener los tags del restaurante');
  }

  const result = await response.json();
  if (result.ok && Array.isArray(result.data)) {
    return result.data;
  }
  return [];
};

export const createTag = async (tagData: { name: string; slug: string; description?: string }): Promise<Tag> => {
  const response = await authFetch(`${API_BASE_URL}/tags/create`, {
    method: 'POST',
    body: JSON.stringify(tagData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al crear el tag');
  }

  const result = await response.json();
  if (result.ok && result.data) {
    return result.data;
  }
  throw new Error('Error al crear el tag');
};

export const replacePlaceTags = async (slug: string, tagIds: string[]): Promise<{ ok: boolean; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/tags/replace`, {
    method: 'POST',
    body: JSON.stringify({ slug, tag_ids: tagIds }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al reemplazar tags');
  }

  return response.json();
};
