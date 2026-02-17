export type ShiftType = 'morning' | 'afternoon' | 'night';
export type ShiftStatus = 'planned' | 'done' | 'cancelled';

export interface Shift {
  id: string;
  staff_member_id: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  notes?: string | null;
  status: ShiftStatus;
  created_at: string;
  updated_at: string;
  staff_name?: string;
  staff_role?: string;
}

export interface CreateShiftRequest {
  staff_member_id: string;
  date: string;
  shift: ShiftType;
  notes?: string;
  status?: ShiftStatus;
}

export interface UpdateShiftRequest {
  staff_member_id?: string;
  date?: string;
  shift?: ShiftType;
  notes?: string;
  status?: ShiftStatus;
}

export interface ShiftQuery {
  from?: string;
  to?: string;
  staff_member_id?: string;
  shift?: ShiftType;
  status?: ShiftStatus;
}
