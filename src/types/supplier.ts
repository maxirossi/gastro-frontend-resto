export type SupplierStatus = 'active' | 'inactive';

export interface Supplier {
  id: string;
  name: string;
  category?: string | null;
  phone: string;
  whatsapp_enabled: boolean;
  delivery_days?: string | null;
  notes?: string | null;
  status: SupplierStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierRequest {
  name: string;
  category?: string;
  phone: string;
  whatsapp_enabled?: boolean;
  delivery_days?: string;
  notes?: string;
  status?: SupplierStatus;
}

export interface UpdateSupplierRequest {
  name?: string;
  category?: string;
  phone?: string;
  whatsapp_enabled?: boolean;
  delivery_days?: string;
  notes?: string;
  status?: SupplierStatus;
}

export interface SupplierQuery {
  search?: string;
  category?: string;
  status?: SupplierStatus;
}
