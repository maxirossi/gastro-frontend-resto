export type CashMovementType = 'INCOME' | 'EXPENSE';

export type PaymentMethod = 'CASH' | 'MERCADO_PAGO' | 'DEBIT' | 'CREDIT' | 'TRANSFER' | 'OTHER';

export type SummaryPeriod = 'daily' | 'weekly' | 'monthly';

export interface CashMovement {
  id: string;
  restaurant_id: string;
  date: string;
  type: CashMovementType;
  concept: string;
  amount: number;
  payment_method: PaymentMethod;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CashMovementCreateRequest {
  date: string;
  type: CashMovementType;
  concept: string;
  amount: number;
  payment_method: PaymentMethod;
  notes?: string;
}

export interface CashMovementUpdateRequest {
  date?: string;
  type?: CashMovementType;
  concept?: string;
  amount?: number;
  payment_method?: PaymentMethod;
  notes?: string;
}

export interface CashMovementListQuery {
  from?: string;
  to?: string;
  type?: CashMovementType;
  payment_method?: PaymentMethod;
  q?: string;
  page?: number;
  limit?: number;
}

export interface CashMovementListResponse {
  items: CashMovement[];
  total: number;
}

export interface SummaryBreakdownItem {
  label: string;
  income: number;
  expense: number;
  balance: number;
}

export interface CashMovementSummary {
  period: SummaryPeriod;
  from: string;
  to: string;
  totals: {
    income: number;
    expense: number;
    balance: number;
  };
  breakdown: SummaryBreakdownItem[];
}

export interface CashMovementSummaryQuery {
  period?: SummaryPeriod;
  from?: string;
  to?: string;
  tz?: string;
}
