import { getRestaurantToken } from '../utils/auth';
import type { PlaceResponse, PlaceUpdateRequest } from '../types/place';
import type { PaymentLink, PaymentLinkCreateRequest, PaymentLinkUpdateRequest } from '../types/paymentLink';
import type {
  CashMovement,
  CashMovementCreateRequest,
  CashMovementUpdateRequest,
  CashMovementListQuery,
  CashMovementListResponse,
  CashMovementSummary,
  CashMovementSummaryQuery,
} from '../types/cashMovement';
import type {
  RestaurantNote,
  RestaurantNoteCreateRequest,
  RestaurantNoteUpdateRequest,
  RestaurantNoteListQuery,
  RestaurantNoteListResponse,
} from '../types/restaurantNote';
import type {
  RestaurantStaff,
  RestaurantStaffCreateRequest,
  RestaurantStaffUpdateRequest,
  RestaurantStaffListQuery,
  RestaurantStaffListResponse,
} from '../types/restaurantStaff';
import type {
  Reservation,
  CreateReservationRequest,
  UpdateReservationRequest,
  LinkPaymentRequest,
  ReservationQuery,
} from '../types/reservation';
import type {
  Shift,
  CreateShiftRequest,
  UpdateShiftRequest,
  ShiftQuery,
} from '../types/shift';
import type {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SupplierQuery,
} from '../types/supplier';
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

// ========== CASH MOVEMENTS API ==========

/**
 * Obtiene la lista de movimientos de caja con filtros
 */
export const getCashMovements = async (query: CashMovementListQuery = {}): Promise<CashMovementListResponse> => {
  const params = new URLSearchParams();
  if (query.from) params.append('from', query.from);
  if (query.to) params.append('to', query.to);
  if (query.type) params.append('type', query.type);
  if (query.payment_method) params.append('payment_method', query.payment_method);
  if (query.q) params.append('q', query.q);
  if (query.page) params.append('page', query.page.toString());
  if (query.limit) params.append('limit', query.limit.toString());

  const response = await authFetch(`${API_BASE_URL}/restaurant/cash-movements?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al obtener movimientos de caja');
  }

  return response.json();
};

/**
 * Obtiene un movimiento de caja por ID
 */
export const getCashMovement = async (id: string): Promise<CashMovement> => {
  const response = await authFetch(`${API_BASE_URL}/restaurant/cash-movements/${id}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al obtener el movimiento');
  }

  return response.json();
};

/**
 * Crea un nuevo movimiento de caja
 */
export const createCashMovement = async (data: CashMovementCreateRequest): Promise<CashMovement> => {
  const response = await authFetch(`${API_BASE_URL}/restaurant/cash-movements`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al crear el movimiento');
  }

  return response.json();
};

/**
 * Actualiza un movimiento de caja
 */
export const updateCashMovement = async (id: string, data: CashMovementUpdateRequest): Promise<CashMovement> => {
  const response = await authFetch(`${API_BASE_URL}/restaurant/cash-movements/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al actualizar el movimiento');
  }

  return response.json();
};

/**
 * Elimina un movimiento de caja
 */
export const deleteCashMovement = async (id: string): Promise<{ ok: boolean; message?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/restaurant/cash-movements/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al eliminar el movimiento');
  }

  return response.json();
};

/**
 * Obtiene el resumen de movimientos de caja
 */
export const getCashMovementSummary = async (query: CashMovementSummaryQuery = {}): Promise<CashMovementSummary> => {
  const params = new URLSearchParams();
  if (query.period) params.append('period', query.period);
  if (query.from) params.append('from', query.from);
  if (query.to) params.append('to', query.to);
  if (query.tz) params.append('tz', query.tz);

  const response = await authFetch(`${API_BASE_URL}/restaurant/cash-movements/summary?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al obtener el resumen');
  }

  return response.json();
};

// ========== RESTAURANT NOTES API ==========

/**
 * Obtiene la lista de notas con filtros
 */
export const getRestaurantNotes = async (query: RestaurantNoteListQuery = {}): Promise<RestaurantNoteListResponse> => {
  const params = new URLSearchParams();
  if (query.from) params.append('from', query.from);
  if (query.to) params.append('to', query.to);
  if (query.type) params.append('type', query.type);
  if (query.q) params.append('q', query.q);
  if (query.page) params.append('page', query.page.toString());
  if (query.limit) params.append('limit', query.limit.toString());

  const response = await authFetch(`${API_BASE_URL}/restaurant/notes?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al obtener las notas');
  }

  return response.json();
};

/**
 * Obtiene una nota por ID
 */
export const getRestaurantNote = async (id: string): Promise<RestaurantNote> => {
  const response = await authFetch(`${API_BASE_URL}/restaurant/notes/${id}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al obtener la nota');
  }

  return response.json();
};

/**
 * Crea una nueva nota
 */
export const createRestaurantNote = async (data: RestaurantNoteCreateRequest): Promise<RestaurantNote> => {
  const response = await authFetch(`${API_BASE_URL}/restaurant/notes`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al crear la nota');
  }

  return response.json();
};

/**
 * Actualiza una nota
 */
export const updateRestaurantNote = async (id: string, data: RestaurantNoteUpdateRequest): Promise<RestaurantNote> => {
  const response = await authFetch(`${API_BASE_URL}/restaurant/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al actualizar la nota');
  }

  return response.json();
};

/**
 * Elimina una nota
 */
export const deleteRestaurantNote = async (id: string): Promise<{ ok: boolean; message?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/restaurant/notes/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al eliminar la nota');
  }

  return response.json();
};

// ========== RESTAURANT STAFF API ==========

/**
 * Obtiene la lista de personal con filtros
 */
export const getRestaurantStaff = async (query: RestaurantStaffListQuery = {}): Promise<RestaurantStaffListResponse> => {
  const params = new URLSearchParams();
  if (query.q) params.append('q', query.q);
  if (query.isActive !== undefined) params.append('isActive', query.isActive.toString());
  if (query.page) params.append('page', query.page.toString());
  if (query.limit) params.append('limit', query.limit.toString());

  const response = await authFetch(`${API_BASE_URL}/restaurant/staff?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al obtener el personal');
  }

  return response.json();
};

/**
 * Obtiene un miembro del personal por ID
 */
export const getRestaurantStaffMember = async (id: string): Promise<RestaurantStaff> => {
  const response = await authFetch(`${API_BASE_URL}/restaurant/staff/${id}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al obtener el miembro del personal');
  }

  return response.json();
};

/**
 * Crea un nuevo miembro del personal
 */
export const createRestaurantStaff = async (data: RestaurantStaffCreateRequest): Promise<RestaurantStaff> => {
  const response = await authFetch(`${API_BASE_URL}/restaurant/staff`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al crear el miembro del personal');
  }

  return response.json();
};

/**
 * Actualiza un miembro del personal
 */
export const updateRestaurantStaff = async (id: string, data: RestaurantStaffUpdateRequest): Promise<RestaurantStaff> => {
  const response = await authFetch(`${API_BASE_URL}/restaurant/staff/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al actualizar el miembro del personal');
  }

  return response.json();
};

/**
 * Activa un miembro del personal
 */
export const activateRestaurantStaff = async (id: string): Promise<RestaurantStaff> => {
  const response = await authFetch(`${API_BASE_URL}/restaurant/staff/${id}/activate`, {
    method: 'PATCH',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al activar el miembro del personal');
  }

  return response.json();
};

/**
 * Desactiva un miembro del personal
 */
export const deactivateRestaurantStaff = async (id: string): Promise<RestaurantStaff> => {
  const response = await authFetch(`${API_BASE_URL}/restaurant/staff/${id}/deactivate`, {
    method: 'PATCH',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al desactivar el miembro del personal');
  }

  return response.json();
};

/**
 * Elimina un miembro del personal
 */
export const deleteRestaurantStaff = async (id: string): Promise<{ ok: boolean; message?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/restaurant/staff/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al eliminar el miembro del personal');
  }

  return response.json();
};

// ========== RESERVATIONS API ==========

/**
 * Obtiene la lista de reservas con filtros
 */
export const getReservations = async (query: ReservationQuery = {}): Promise<{ ok: boolean; data?: Reservation[]; error?: string }> => {
  const params = new URLSearchParams();
  if (query.from) params.append('from', query.from);
  if (query.to) params.append('to', query.to);
  if (query.status) params.append('status', query.status);
  if (query.search) params.append('search', query.search);

  const response = await authFetch(`${API_BASE_URL}/reservations?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al obtener las reservas');
  }

  return response.json();
};

/**
 * Obtiene una reserva por ID
 */
export const getReservation = async (id: string): Promise<{ ok: boolean; data?: Reservation; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/reservations/${id}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al obtener la reserva');
  }

  return response.json();
};

/**
 * Crea una nueva reserva
 */
export const createReservation = async (data: CreateReservationRequest): Promise<{ ok: boolean; data?: Reservation; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/reservations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al crear la reserva');
  }

  return response.json();
};

/**
 * Actualiza una reserva
 */
export const updateReservation = async (id: string, data: UpdateReservationRequest): Promise<{ ok: boolean; data?: Reservation; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/reservations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al actualizar la reserva');
  }

  return response.json();
};

/**
 * Vincula un payment link a una reserva
 */
export const linkPaymentToReservation = async (id: string, data: LinkPaymentRequest): Promise<{ ok: boolean; data?: Reservation; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/reservations/${id}/link-payment`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al vincular el pago');
  }

  return response.json();
};

/**
 * Marca una reserva como pagada
 */
export const markReservationPaid = async (id: string): Promise<{ ok: boolean; data?: Reservation; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/reservations/${id}/mark-paid`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al marcar como pagada');
  }

  return response.json();
};

/**
 * Cancela una reserva
 */
export const cancelReservation = async (id: string): Promise<{ ok: boolean; data?: Reservation; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/reservations/${id}/cancel`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al cancelar la reserva');
  }

  return response.json();
};

// ========== SHIFTS API ==========

/**
 * Obtiene la lista de turnos con filtros
 */
export const getShifts = async (query: ShiftQuery = {}): Promise<{ ok: boolean; data?: Shift[]; error?: string }> => {
  const params = new URLSearchParams();
  if (query.from) params.append('from', query.from);
  if (query.to) params.append('to', query.to);
  if (query.staff_member_id) params.append('staff_member_id', query.staff_member_id);
  if (query.shift) params.append('shift', query.shift);
  if (query.status) params.append('status', query.status);

  const response = await authFetch(`${API_BASE_URL}/shifts?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al obtener los turnos');
  }

  return response.json();
};

/**
 * Obtiene un turno por ID
 */
export const getShift = async (id: string): Promise<{ ok: boolean; data?: Shift; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/shifts/${id}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al obtener el turno');
  }

  return response.json();
};

/**
 * Crea un nuevo turno
 */
export const createShift = async (data: CreateShiftRequest): Promise<{ ok: boolean; data?: Shift; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/shifts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al crear el turno');
  }

  return response.json();
};

/**
 * Actualiza un turno
 */
export const updateShift = async (id: string, data: UpdateShiftRequest): Promise<{ ok: boolean; data?: Shift; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/shifts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al actualizar el turno');
  }

  return response.json();
};

/**
 * Elimina un turno
 */
export const deleteShift = async (id: string): Promise<{ ok: boolean; message?: string; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/shifts/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al eliminar el turno');
  }

  return response.json();
};

// ========== SUPPLIERS API ==========

/**
 * Obtiene la lista de proveedores con filtros
 */
export const getSuppliers = async (query: SupplierQuery = {}): Promise<{ ok: boolean; data?: Supplier[]; error?: string }> => {
  const params = new URLSearchParams();
  if (query.search) params.append('search', query.search);
  if (query.category) params.append('category', query.category);
  if (query.status) params.append('status', query.status);

  const response = await authFetch(`${API_BASE_URL}/suppliers?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al obtener los proveedores');
  }

  return response.json();
};

/**
 * Obtiene un proveedor por ID
 */
export const getSupplier = async (id: string): Promise<{ ok: boolean; data?: Supplier; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/suppliers/${id}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al obtener el proveedor');
  }

  return response.json();
};

/**
 * Crea un nuevo proveedor
 */
export const createSupplier = async (data: CreateSupplierRequest): Promise<{ ok: boolean; data?: Supplier; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/suppliers`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al crear el proveedor');
  }

  return response.json();
};

/**
 * Actualiza un proveedor
 */
export const updateSupplier = async (id: string, data: UpdateSupplierRequest): Promise<{ ok: boolean; data?: Supplier; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/suppliers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al actualizar el proveedor');
  }

  return response.json();
};

/**
 * Activa un proveedor
 */
export const activateSupplier = async (id: string): Promise<{ ok: boolean; data?: Supplier; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/suppliers/${id}/activate`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al activar el proveedor');
  }

  return response.json();
};

/**
 * Desactiva un proveedor
 */
export const deactivateSupplier = async (id: string): Promise<{ ok: boolean; data?: Supplier; error?: string }> => {
  const response = await authFetch(`${API_BASE_URL}/suppliers/${id}/deactivate`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error al desactivar el proveedor');
  }

  return response.json();
};
