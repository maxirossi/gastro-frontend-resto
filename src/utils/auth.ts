const RESTAURANT_TOKEN_KEY = 'rosariogastro_restaurant_token';
const RESTAURANT_DATA_KEY = 'rosariogastro_restaurant_data';

export interface RestaurantData {
  place_id: string;
  name?: string;
  slug?: string;
}

/**
 * Obtiene el token JWT del restaurante desde localStorage
 */
export const getRestaurantToken = (): string | null => {
  return localStorage.getItem(RESTAURANT_TOKEN_KEY);
};

/**
 * Guarda el token y datos del restaurante en localStorage
 */
export const saveRestaurantSession = (token: string, data?: RestaurantData): void => {
  localStorage.setItem(RESTAURANT_TOKEN_KEY, token);
  if (data) {
    localStorage.setItem(RESTAURANT_DATA_KEY, JSON.stringify(data));
  }
};

/**
 * Decodifica el JWT para obtener el username (que es el slug)
 */
const decodeJWT = (token: string): { username?: string; place_id?: string } | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

/**
 * Obtiene los datos del restaurante desde localStorage
 * Si no hay slug, intenta obtenerlo del JWT
 */
export const getRestaurantData = (): RestaurantData | null => {
  const data = localStorage.getItem(RESTAURANT_DATA_KEY);
  let restaurantData: RestaurantData | null = null;
  
  if (data) {
    try {
      restaurantData = JSON.parse(data);
    } catch {
      restaurantData = null;
    }
  }

  const token = getRestaurantToken();
  if (token && (!restaurantData || !restaurantData.slug)) {
    const jwtData = decodeJWT(token);
    if (jwtData?.username) {
      if (!restaurantData) {
        restaurantData = {
          place_id: jwtData.place_id || '',
          slug: jwtData.username,
        };
      } else {
        restaurantData.slug = restaurantData.slug || jwtData.username;
      }
      if (restaurantData) {
        localStorage.setItem(RESTAURANT_DATA_KEY, JSON.stringify(restaurantData));
      }
    }
  }

  return restaurantData;
};

/**
 * Verifica si el restaurante está autenticado
 */
export const isRestaurantAuthenticated = (): boolean => {
  return !!getRestaurantToken();
};

/**
 * Cierra la sesión del restaurante
 */
export const logout = (): void => {
  localStorage.removeItem(RESTAURANT_TOKEN_KEY);
  localStorage.removeItem(RESTAURANT_DATA_KEY);
};


