/**
 * Normaliza un número de teléfono para usar en WhatsApp (wa.me)
 * Remueve caracteres especiales y espacios, pero mantiene el código de país
 */
export function normalizePhoneToWaMe(phone: string): string {
  if (!phone) return '';
  
  // Remover todos los caracteres no numéricos excepto el + inicial
  let cleaned = phone.trim();
  
  // Si empieza con +, mantenerlo
  const hasPlus = cleaned.startsWith('+');
  if (hasPlus) {
    cleaned = '+' + cleaned.slice(1).replace(/\D/g, '');
  } else {
    cleaned = cleaned.replace(/\D/g, '');
  }
  
  return cleaned;
}

/**
 * Codifica un texto para usar en URL de WhatsApp
 */
export function encodeWhatsAppText(text: string): string {
  return encodeURIComponent(text);
}

/**
 * Construye una URL de WhatsApp con mensaje prellenado
 * @param phone - Número de teléfono (puede tener formato variado)
 * @param message - Mensaje a prellenar
 * @returns URL completa de wa.me o null si el teléfono no es válido
 */
export function buildWhatsAppUrl(phone: string, message: string): string | null {
  if (!phone || !message) return null;
  
  const normalized = normalizePhoneToWaMe(phone);
  if (!normalized || normalized.length < 10) return null;
  
  const encodedMessage = encodeWhatsAppText(message);
  return `https://wa.me/${normalized}?text=${encodedMessage}`;
}

/**
 * Valida si una URL es válida (básico: empieza con http)
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

/**
 * Normaliza una URL agregando https:// si no tiene protocolo
 */
export function normalizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Genera un mensaje de WhatsApp para una reserva con payment link
 */
export function formatWhatsAppMessage(
  name: string,
  date: string,
  time: string,
  adults: number,
  kids: number,
  paymentUrl: string,
  depositAmount?: number
): string {
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  let message = `Hola ${name}! Te confirmamos la pre-reserva para el ${formattedDate} a las ${time} para ${adults} adulto${adults > 1 ? 's' : ''}`;
  
  if (kids > 0) {
    message += ` y ${kids} niño${kids > 1 ? 's' : ''}`;
  }
  
  message += `. Para asegurar la mesa, podés abonar la seña aquí: ${paymentUrl}`;
  
  if (depositAmount) {
    message += `\n\nSeña: $${depositAmount.toFixed(2)}.`;
  }
  
  message += `\n\nCualquier cosa respondé por este medio. ¡Gracias!`;
  
  return message;
}

/**
 * Obtiene la URL de WhatsApp para un teléfono (con o sin mensaje)
 */
export function getWhatsAppUrl(phone: string, message?: string): string {
  const normalized = normalizePhoneToWaMe(phone);
  if (!normalized || normalized.length < 10) {
    return '#';
  }
  
  if (message) {
    const encodedMessage = encodeWhatsAppText(message);
    return `https://wa.me/${normalized}?text=${encodedMessage}`;
  }
  
  return `https://wa.me/${normalized}`;
}
