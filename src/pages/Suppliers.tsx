import { useState, useEffect } from 'react';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  activateSupplier,
  deactivateSupplier,
} from '../services/api';
import type { Supplier, SupplierQuery, SupplierStatus } from '../types/supplier';
import { getWhatsAppUrl } from '../utils/whatsapp';
import './Suppliers.css';

function Suppliers() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filters, setFilters] = useState<SupplierQuery>({});
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await getSuppliers(filters);
      if (result.ok && result.data) {
        setSuppliers(result.data);
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(result.data.map((s) => s.category).filter((c): c is string => !!c))
        ).sort();
        setCategories(uniqueCategories);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los proveedores');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSupplier(null);
    setShowModal(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  const handleToggleStatus = async (supplier: Supplier) => {
    try {
      if (supplier.status === 'active') {
        await deactivateSupplier(supplier.id);
      } else {
        await activateSupplier(supplier.id);
      }
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cambiar el estado');
    }
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    alert('Teléfono copiado al portapapeles');
  };

  const handleOpenWhatsApp = (phone: string) => {
    const url = getWhatsAppUrl(phone);
    window.open(url, '_blank');
  };

  return (
    <div className="suppliers-page">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Proveedores</h1>
          <p className="page-subtitle">Contactos para compras y entregas.</p>
        </div>
        <button className="btn-primary" onClick={handleCreate}>
          + Agregar proveedor
        </button>
      </div>

      {/* Filters Card */}
      <div className="filters-card">
        <div className="filters-grid">
          <div className="filter-field filter-field-full">
            <label>Buscar</label>
            <input
              type="text"
              placeholder="Nombre o teléfono"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
            />
          </div>
          <div className="filter-field">
            <label>Categoría</label>
            <select
              value={filters.category || ''}
              onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
            >
              <option value="">Todos</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-field">
            <label>Estado</label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as SupplierStatus || undefined })}
            >
              <option value="">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Cargando proveedores...</div>
      ) : suppliers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🚚</div>
          <p className="empty-state-text">Todavía no cargaste proveedores</p>
          <button className="btn-secondary" onClick={handleCreate}>
            Agregar primer proveedor
          </button>
        </div>
      ) : (
        <div className="suppliers-list">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="supplier-card">
              <div className="supplier-card-header">
                <div>
                  <strong className="supplier-name">{supplier.name}</strong>
                  {supplier.category && (
                    <span className="category-badge">{supplier.category}</span>
                  )}
                </div>
                <span className={`status-badge status-${supplier.status}`}>
                  {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="supplier-card-body">
                <div className="supplier-phone">
                  <span>📱 {supplier.phone}</span>
                  <div className="phone-actions">
                    {supplier.whatsapp_enabled && (
                      <button
                        className="btn-whatsapp"
                        onClick={() => handleOpenWhatsApp(supplier.phone)}
                        title="Abrir WhatsApp"
                      >
                        WhatsApp
                      </button>
                    )}
                    <button
                      className="btn-copy"
                      onClick={() => handleCopyPhone(supplier.phone)}
                      title="Copiar teléfono"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
                {supplier.delivery_days && (
                  <div className="delivery-days">
                    <strong>Días de entrega:</strong> {supplier.delivery_days}
                  </div>
                )}
                {supplier.notes && (
                  <div className="supplier-notes">
                    {supplier.notes.length > 100
                      ? `${supplier.notes.substring(0, 100)}...`
                      : supplier.notes}
                  </div>
                )}
              </div>
              <div className="supplier-actions">
                <button onClick={() => handleEdit(supplier)}>Editar</button>
                <button onClick={() => handleToggleStatus(supplier)}>
                  {supplier.status === 'active' ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <SupplierModal
          supplier={editingSupplier}
          categories={categories}
          onClose={() => setShowModal(false)}
          onSave={async (data) => {
            try {
              if (editingSupplier) {
                await updateSupplier(editingSupplier.id, data);
              } else {
                await createSupplier(data);
              }
              setShowModal(false);
              loadData();
            } catch (err) {
              alert(err instanceof Error ? err.message : 'Error al guardar el proveedor');
            }
          }}
        />
      )}
    </div>
  );
}

// Modal Component
interface SupplierModalProps {
  supplier: Supplier | null;
  categories: string[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

function SupplierModal({ supplier, categories, onClose, onSave }: SupplierModalProps) {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    category: supplier?.category || '',
    phone: supplier?.phone || '',
    whatsapp_enabled: supplier?.whatsapp_enabled !== undefined ? supplier.whatsapp_enabled : true,
    delivery_days: supplier?.delivery_days || '',
    notes: supplier?.notes || '',
    status: supplier?.status || 'active' as SupplierStatus,
  });
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Nombre y teléfono son requeridos');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: formData.name.trim(),
        category: formData.category || newCategory || undefined,
        phone: formData.phone.trim(),
        whatsapp_enabled: formData.whatsapp_enabled,
        delivery_days: formData.delivery_days || undefined,
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
          <h2>{supplier ? 'Editar proveedor' : 'Agregar proveedor'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              maxLength={120}
            />
          </div>
          <div className="form-group">
            <label>Categoría</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">Sin categoría</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="O crear nueva categoría"
              value={newCategory}
              onChange={(e) => {
                setNewCategory(e.target.value);
                if (e.target.value) {
                  setFormData({ ...formData, category: '' });
                }
              }}
              style={{ marginTop: '0.5rem' }}
              maxLength={80}
            />
          </div>
          <div className="form-group">
            <label>Teléfono *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              maxLength={40}
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.whatsapp_enabled}
                onChange={(e) => setFormData({ ...formData, whatsapp_enabled: e.target.checked })}
              />
              {' '}Habilitar WhatsApp
            </label>
          </div>
          <div className="form-group">
            <label>Días de entrega</label>
            <input
              type="text"
              value={formData.delivery_days}
              onChange={(e) => setFormData({ ...formData, delivery_days: e.target.value })}
              placeholder="Ej: Lun/Mie/Vie"
              maxLength={80}
            />
          </div>
          <div className="form-group">
            <label>Notas</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="Notas adicionales..."
              maxLength={800}
            />
          </div>
          <div className="form-group">
            <label>Estado</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as SupplierStatus })}
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
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

export default Suppliers;
