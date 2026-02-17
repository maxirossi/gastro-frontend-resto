export type ReservationSource = 'whatsapp' | 'phone' | 'instagram' | 'walk_in' | 'web';
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'completed';
export type PaymentStatus = 'none' | 'requested' | 'paid' | 'expired';

export interface Reservation {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  table_id?: string | null;
  adults: number;
  kids: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  notes?: string | null;
  source: ReservationSource;
  status: ReservationStatus;
  payment_status: PaymentStatus;
  payment_link_id?: string | null;
  deposit_amount?: number | null;
  created_at: string;
  updated_at: string;
  payment_link_url?: string | null;
  payment_link_label?: string | null;
}

export interface CreateReservationRequest {
  date: string;
  time: string;
  table_id?: string;
  adults: number;
  kids: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  notes?: string;
  source?: ReservationSource;
  status?: ReservationStatus;
}

export interface UpdateReservationRequest {
  date?: string;
  time?: string;
  table_id?: string;
  adults?: number;
  kids?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  notes?: string;
  source?: ReservationSource;
  status?: ReservationStatus;
}

export interface LinkPaymentRequest {
  payment_link_id?: string;
  url?: string;
  amount?: number;
  concept?: string;
}

export interface ReservationQuery {
  from?: string;
  to?: string;
  status?: ReservationStatus;
  search?: string;
}
