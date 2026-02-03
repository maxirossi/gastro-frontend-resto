import { getRestaurantToken } from '../utils/auth';
import type { PlaceResponse, PlaceUpdateRequest } from '../types/place';
import type { PaymentLink, PaymentLinkCreateRequest, PaymentLinkUpdateRequest } from '../types/paymentLink';
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

// ========== LOGO API ==========

/**
 * Helper para hacer fetch con autenticación y FormData (para uploads)
 */
const authFormDataFetch = async (url: string, formData: FormData): Promise<Response> => {
  const token = getRestaurantToken();
  const headers = new Headers();
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  // No establecer Content-Type para FormData, el navegador lo hará automáticamente con el boundary

  return fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });
};

/**
 * Sube un logo para un restaurante
 */
export const uploadLogo = async (placeId: string, file: File): Promise<{ ok: boolean; logo_url?: string; error?: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await authFormDataFetch(`${API_BASE_URL}/places/logo-upload/${placeId}`, formData);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al subir el logo');
  }

  return response.json();
};

/**
 * Elimina el logo de un restaurante
 */
export const deleteLogo = async (placeId: string): Promise<{ ok: boolean; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/places/logo/${placeId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al eliminar el logo');
  }

  return response.json();
};

// ========== MEDIA API ==========

/**
 * Convierte un File a base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remover el prefijo data:image/...;base64,
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Sube una foto para un restaurante
 */
export const uploadPhoto = async (
  placeSlug: string,
  file: File,
  upsert?: boolean
): Promise<{ ok: boolean; url?: string; publicUrl?: string; path?: string; error?: string }> => {
  try {
    const base64 = await fileToBase64(file);
    
    const response = await authFetch(`${API_BASE_URL}/places/media-upload`, {
      method: 'POST',
      body: JSON.stringify({
        place_slug: placeSlug,
        content_type: file.type,
        base64,
        upsert: upsert ?? false,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
      throw new Error(error.error || 'Error al subir la foto');
    }

    return response.json();
  } catch (err) {
    throw err instanceof Error ? err : new Error('Error al subir la foto');
  }
};

/**
 * Elimina una foto de un restaurante
 */
export const deletePhoto = async (
  placeSlug: string,
  photoUrl: string
): Promise<{ ok: boolean; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/places/media/${placeSlug}`, {
    method: 'DELETE',
    body: JSON.stringify({ photo_url: photoUrl }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al eliminar la foto');
  }

  return response.json();
};

/**
 * Obtiene el menú de un restaurante
 */
export const getMenu = async (slug: string): Promise<{ ok: boolean; data?: any; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/places/menu/${slug}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al obtener el menú');
  }

  return response.json();
};

// ========== MENU CATEGORIES API ==========

export const createMenuCategory = async (
  slug: string,
  name: string,
  sortOrder?: number
): Promise<{ ok: boolean; data?: any; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/places/menu/category/create`, {
    method: 'POST',
    body: JSON.stringify({ slug, name, sort_order: sortOrder }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al crear la categoría');
  }

  return response.json();
};

export const updateMenuCategory = async (
  id: string,
  patch: { name?: string; sort_order?: number; is_active?: boolean }
): Promise<{ ok: boolean; data?: any; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/places/menu/category/update`, {
    method: 'POST',
    body: JSON.stringify({ id, ...patch }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al actualizar la categoría');
  }

  return response.json();
};

export const deleteMenuCategory = async (id: string): Promise<{ ok: boolean; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/places/menu/category/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al eliminar la categoría');
  }

  return response.json();
};

// ========== MENU ITEMS API ==========

export const createMenuItem = async (data: {
  slug: string;
  category_id: string;
  title: string;
  description?: string;
  price_amount: number;
  currency?: string;
  sort_order?: number;
}): Promise<{ ok: boolean; data?: any; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/places/menu/item/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al crear el plato');
  }

  return response.json();
};

export const updateMenuItem = async (
  id: string,
  patch: {
    title?: string;
    description?: string;
    price_amount?: number;
    currency?: string;
    category_id?: string;
    is_available?: boolean;
    is_featured?: boolean;
    sort_order?: number;
  }
): Promise<{ ok: boolean; data?: any; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/places/menu/item/update`, {
    method: 'POST',
    body: JSON.stringify({ id, ...patch }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al actualizar el plato');
  }

  return response.json();
};

export const deleteMenuItem = async (id: string): Promise<{ ok: boolean; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/places/menu/item/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al eliminar el plato');
  }

  return response.json();
};

// ========== PAYMENT LINKS API ==========

/**
 * Obtiene todos los links de pago de un restaurante
 */
export const getPaymentLinks = async (slug: string): Promise<{ ok: boolean; data?: PaymentLink[]; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/places/payment-links?slug=${encodeURIComponent(slug)}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al obtener los links de pago');
  }

  return response.json();
};

/**
 * Crea un nuevo link de pago
 */
export const createPaymentLink = async (
  slug: string,
  data: PaymentLinkCreateRequest
): Promise<{ ok: boolean; data?: PaymentLink; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/places/payment-links`, {
    method: 'POST',
    body: JSON.stringify({ slug, ...data }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al crear el link de pago');
  }

  return response.json();
};

/**
 * Actualiza un link de pago
 */
export const updatePaymentLink = async (
  data: PaymentLinkUpdateRequest
): Promise<{ ok: boolean; data?: PaymentLink; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/places/payment-links`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al actualizar el link de pago');
  }

  return response.json();
};

/**
 * Elimina un link de pago
 */
export const deletePaymentLink = async (id: string): Promise<{ ok: boolean; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/places/payment-links/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al eliminar el link de pago');
  }

  return response.json();
};
