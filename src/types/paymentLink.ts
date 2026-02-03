export type PaymentLink = {
  id: string;
  label: string;            // ej: "Seña reserva", "Pedido delivery"
  url: string;              // ej: https://mpago.la/....
  amount?: number | null;   // opcional (solo informativo)
  description?: string | null; // opcional (informativo)
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentLinkCreateRequest = {
  label: string;
  url: string;
  amount?: number | null;
  description?: string | null;
};

export type PaymentLinkUpdateRequest = {
  id: string;
  label?: string;
  url?: string;
  amount?: number | null;
  description?: string | null;
};
