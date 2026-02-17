import { useState, useEffect } from 'react';
import {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
  getRestaurantStaff,
} from '../services/api';
import type { Shift, ShiftQuery, ShiftType, ShiftStatus } from '../types/shift';
import type { RestaurantStaff } from '../types/restaurantStaff';
import './Shifts.css';

function Shifts() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staffMembers, setStaffMembers] = useState<RestaurantStaff[]>([]);
  const [filters, setFilters] = useState<ShiftQuery>({});
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  useEffect(() => {
    loadData();
    loadStaffMembers();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await getShifts(filters);
      if (result.ok && result.data) {
        setShifts(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los turnos');
    } finally {
      setLoading(false);
    }
  };

  const loadStaffMembers = async () => {
    try {
      const result = await getRestaurantStaff({ isActive: true });
      setStaffMembers(result.items || []);
    } catch (err) {
      console.error('Error loading staff members:', err);
    }
  };

  const handleCreate = () => {
    setEditingShift(null);
    setShowModal(true);
  };

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este turno?')) return;

    try {
      await deleteShift(id);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el turno');
    }
  };

  const handleMarkDone = async (shift: Shift) => {
    try {
      await updateShift(shift.id, { status: 'done' });
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al marcar como realizado');
    }
  };

  const handleCancel = async (shift: Shift) => {
    try {
      await updateShift(shift.id, { status: 'cancelled' });
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cancelar el turno');
    }
  };

  const formatDate = (date: string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const getShiftLabel = (shift: ShiftType): string => {
    const labels: Record<ShiftType, string> = {
      morning: 'Mañana',
      afternoon: 'Tarde',
      night: 'Noche',
    };
    return labels[shift];
  };

  const getStatusLabel = (status: ShiftStatus): string => {
    const labels: Record<ShiftStatus, string> = {
      planned: 'Planificado',
      done: 'Realizado',
      cancelled: 'Cancelado',
    };
    return labels[status];
  };

  // Group shifts by date
  const groupedShifts = shifts.reduce((acc, shift) => {
    const date = shift.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);

  const sortedDates = Object.keys(groupedShifts).sort();

  return (
    <div className="shifts-page">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Turnos</h1>
          <p className="page-subtitle">Organizá el personal por día (no controla horarios).</p>
        </div>
        <button className="btn-primary" onClick={handleCreate}>
          + Asignar turno
        </button>
      </div>

      {/* Filters Card */}
      <div className="filters-card">
        <div className="filters-grid">
          <div className="filter-field">
            <label>Desde</label>
            <input
              type="date"
              value={filters.from || ''}
              onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined })}
            />
          </div>
          <div className="filter-field">
            <label>Hasta</label>
            <input
              type="date"
              value={filters.to || ''}
              onChange={(e) => setFilters({ ...filters, to: e.target.value || undefined })}
            />
          </div>
          <div className="filter-field">
            <label>Turno</label>
            <select
              value={filters.shift || ''}
              onChange={(e) => setFilters({ ...filters, shift: e.target.value as ShiftType || undefined })}
            >
              <option value="">Todos</option>
              <option value="morning">Mañana</option>
              <option value="afternoon">Tarde</option>
              <option value="night">Noche</option>
            </select>
          </div>
          <div className="filter-field">
            <label>Estado</label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as ShiftStatus || undefined })}
            >
              <option value="">Todos</option>
              <option value="planned">Planificado</option>
              <option value="done">Realizado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          <div className="filter-field filter-field-full">
            <label>Personal</label>
            <select
              value={filters.staff_member_id || ''}
              onChange={(e) => setFilters({ ...filters, staff_member_id: e.target.value || undefined })}
            >
              <option value="">Todos</option>
              {staffMembers.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} {staff.role ? `- ${staff.role}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Cargando turnos...</div>
      ) : shifts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗓️</div>
          <p className="empty-state-text">Todavía no asignaste turnos</p>
          <button className="btn-secondary" onClick={handleCreate}>
            Asignar primer turno
          </button>
        </div>
      ) : (
        <div className="shifts-list">
          {sortedDates.map((date) => (
            <div key={date} className="shifts-date-group">
              <h3 className="date-header">{formatDate(date)}</h3>
              <div className="shifts-cards">
                {groupedShifts[date].map((shift) => (
                  <div key={shift.id} className="shift-card">
                    <div className="shift-card-header">
                      <div>
                        <strong className="staff-name">{shift.staff_name || 'Sin nombre'}</strong>
                        {shift.staff_role && <span className="staff-role">{shift.staff_role}</span>}
                      </div>
                      <div className="shift-badges">
                        <span className={`shift-badge shift-${shift.shift}`}>
                          {getShiftLabel(shift.shift)}
                        </span>
                        <span className={`status-badge status-${shift.status}`}>
                          {getStatusLabel(shift.status)}
                        </span>
                      </div>
                    </div>
                    {shift.notes && (
                      <div className="shift-notes">
                        {shift.notes}
                      </div>
                    )}
                    <div className="shift-actions">
                      <button onClick={() => handleEdit(shift)}>Editar</button>
                      {shift.status === 'planned' && (
                        <>
                          <button onClick={() => handleMarkDone(shift)}>Marcar realizado</button>
                          <button onClick={() => handleCancel(shift)}>Cancelar</button>
                        </>
                      )}
                      <button onClick={() => handleDelete(shift.id)} className="btn-danger">
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <ShiftModal
          shift={editingShift}
          staffMembers={staffMembers}
          onClose={() => setShowModal(false)}
          onSave={async (data) => {
            try {
              if (editingShift) {
                await updateShift(editingShift.id, data);
              } else {
                await createShift(data);
              }
              setShowModal(false);
              loadData();
            } catch (err) {
              alert(err instanceof Error ? err.message : 'Error al guardar el turno');
            }
          }}
        />
      )}
    </div>
  );
}

// Modal Component
interface ShiftModalProps {
  shift: Shift | null;
  staffMembers: RestaurantStaff[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

function ShiftModal({ shift, staffMembers, onClose, onSave }: ShiftModalProps) {
  const [formData, setFormData] = useState({
    staff_member_id: shift?.staff_member_id || '',
    date: shift?.date || new Date().toISOString().split('T')[0],
    shift: shift?.shift || 'morning' as ShiftType,
    notes: shift?.notes || '',
    status: shift?.status || 'planned' as ShiftStatus,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.staff_member_id) {
      alert('Debe seleccionar un miembro del personal');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        staff_member_id: formData.staff_member_id,
        date: formData.date,
        shift: formData.shift,
        notes: formData.notes || undefined,
        status: formData.status,
      });
    } catch (err) {
      // Error already handled in parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{shift ? 'Editar turno' : 'Asignar turno'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Personal *</label>
            <select
              value={formData.staff_member_id}
              onChange={(e) => setFormData({ ...formData, staff_member_id: e.target.value })}
              required
            >
              <option value="">Seleccionar...</option>
              {staffMembers.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} {staff.role ? `- ${staff.role}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Fecha *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Turno *</label>
            <select
              value={formData.shift}
              onChange={(e) => setFormData({ ...formData, shift: e.target.value as ShiftType })}
              required
            >
              <option value="morning">Mañana</option>
              <option value="afternoon">Tarde</option>
              <option value="night">Noche</option>
            </select>
          </div>
          <div className="form-group">
            <label>Notas</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Notas adicionales..."
            />
          </div>
          <div className="form-group">
            <label>Estado</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ShiftStatus })}
            >
              <option value="planned">Planificado</option>
              <option value="done">Realizado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Shifts;
