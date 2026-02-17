import { useState, useEffect } from 'react';
import {
  getRestaurantStaff,
  createRestaurantStaff,
  updateRestaurantStaff,
  activateRestaurantStaff,
  deactivateRestaurantStaff,
  deleteRestaurantStaff,
} from '../services/api';
import type {
  RestaurantStaff,
  RestaurantStaffListQuery,
  RestaurantStaffCreateRequest,
} from '../types/restaurantStaff';
import './Staff.css';

function Staff() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [staff, setStaff] = useState<RestaurantStaff[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<RestaurantStaffListQuery>({
    page: 1,
    limit: 50,
  });
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<RestaurantStaff | null>(null);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const staffData = await getRestaurantStaff(filters);
      setStaff(staffData.items);
      setTotal(staffData.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el personal');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingMember(null);
    setShowModal(true);
  };

  const handleEdit = (member: RestaurantStaff) => {
    setEditingMember(member);
    setShowModal(true);
  };

  const handleToggleActive = async (member: RestaurantStaff) => {
    try {
      if (member.is_active) {
        await deactivateRestaurantStaff(member.id);
      } else {
        await activateRestaurantStaff(member.id);
      }
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cambiar el estado');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este miembro del personal?')) {
      return;
    }

    try {
      await deleteRestaurantStaff(id);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el miembro del personal');
    }
  };

  const handleSave = async (data: RestaurantStaffCreateRequest) => {
    try {
      if (editingMember) {
        await updateRestaurantStaff(editingMember.id, data);
      } else {
        await createRestaurantStaff(data);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar el miembro del personal');
    }
  };

  return (
    <div className="staff-page">
      <div className="staff-header">
        <h1>Personal</h1>
        <button className="btn-primary" onClick={handleCreate}>
          Agregar persona
        </button>
      </div>

      <p className="staff-helper">
        Esto es un registro interno del restaurante (no controla horarios).
      </p>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group filter-group-search">
          <label>Buscar</label>
          <input
            type="text"
            placeholder="Buscar por nombre, rol o contacto..."
            value={filters.q || ''}
            onChange={(e) => setFilters({ ...filters, q: e.target.value || undefined, page: 1 })}
          />
        </div>
        <div className="filter-group">
          <label>Estado</label>
          <select
            value={filters.isActive === undefined ? '' : filters.isActive.toString()}
            onChange={(e) => {
              const value = e.target.value;
              setFilters({
                ...filters,
                isActive: value === '' ? undefined : value === 'true',
                page: 1,
              });
            }}
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : staff.length === 0 ? (
        <div className="empty-state">
          <p>Todavía no cargaste personal</p>
          <button className="btn-primary" onClick={handleCreate}>
            Agregar persona
          </button>
        </div>
      ) : (
        <>
          <div className="staff-table-container">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Turno</th>
                  <th>Contacto</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id} className={!member.is_active ? 'inactive-row' : ''}>
                    <td>{member.name}</td>
                    <td>{member.role}</td>
                    <td>{member.shift || '-'}</td>
                    <td>{member.contact || '-'}</td>
                    <td>
                      <span className={`status-badge ${member.is_active ? 'active' : 'inactive'}`}>
                        {member.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-edit" onClick={() => handleEdit(member)}>
                          Editar
                        </button>
                        <button
                          className="btn-toggle"
                          onClick={() => handleToggleActive(member)}
                        >
                          {member.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button className="btn-delete" onClick={() => handleDelete(member.id)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > (filters.limit || 50) && (
            <div className="pagination">
              <button
                disabled={!filters.page || filters.page <= 1}
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
              >
                Anterior
              </button>
              <span>
                Página {filters.page || 1} de {Math.ceil(total / (filters.limit || 50))}
              </span>
              <button
                disabled={(filters.page || 1) >= Math.ceil(total / (filters.limit || 50))}
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <RestaurantStaffModal
          member={editingMember}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// Modal Component
interface RestaurantStaffModalProps {
  member: RestaurantStaff | null;
  onClose: () => void;
  onSave: (data: RestaurantStaffCreateRequest) => Promise<void>;
}

function RestaurantStaffModal({ member, onClose, onSave }: RestaurantStaffModalProps) {
  const [formData, setFormData] = useState<RestaurantStaffCreateRequest>({
    name: member?.name || '',
    role: member?.role || '',
    shift: member?.shift || '',
    contact: member?.contact || '',
    isActive: member?.is_active !== undefined ? member.is_active : true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      alert('El nombre es requerido y debe tener al menos 2 caracteres');
      return;
    }
    if (!formData.role.trim() || formData.role.trim().length < 2) {
      alert('El rol es requerido y debe tener al menos 2 caracteres');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: formData.name.trim(),
        role: formData.role.trim(),
        shift: formData.shift?.trim() || undefined,
        contact: formData.contact?.trim() || undefined,
        isActive: formData.isActive,
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
          <h2>{member ? 'Editar persona' : 'Agregar persona'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Juan Pérez"
              required
              minLength={2}
            />
          </div>
          <div className="form-group">
            <label>Rol *</label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="Ej: mozo, cocina, encargado, cajero, delivery"
              required
              minLength={2}
            />
          </div>
          <div className="form-group">
            <label>Turno</label>
            <input
              type="text"
              value={formData.shift || ''}
              onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
              placeholder="Ej: Lun a Vie 18-01, Sab/Dom noche"
            />
          </div>
          <div className="form-group">
            <label>Contacto</label>
            <input
              type="text"
              value={formData.contact || ''}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              placeholder="Ej: teléfono o WhatsApp"
            />
          </div>
          {member && (
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                {' '}Activo
              </label>
            </div>
          )}
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

export default Staff;
