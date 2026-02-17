import { useState, useEffect } from 'react';
import {
  getRestaurantNotes,
  createRestaurantNote,
  updateRestaurantNote,
  deleteRestaurantNote,
} from '../services/api';
import type {
  RestaurantNote,
  RestaurantNoteListQuery,
  RestaurantNoteType,
  RestaurantNoteCreateRequest,
} from '../types/restaurantNote';
import './Notes.css';

function Notes() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState<RestaurantNote[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<RestaurantNoteListQuery>({
    page: 1,
    limit: 30,
  });
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<RestaurantNote | null>(null);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const notesData = await getRestaurantNotes(filters);
      setNotes(notesData.items);
      setTotal(notesData.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las notas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingNote(null);
    setShowModal(true);
  };

  const handleEdit = (note: RestaurantNote) => {
    setEditingNote(note);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta nota?')) {
      return;
    }

    try {
      await deleteRestaurantNote(id);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar la nota');
    }
  };

  const handleSave = async (data: RestaurantNoteCreateRequest) => {
    try {
      if (editingNote) {
        await updateRestaurantNote(editingNote.id, data);
      } else {
        await createRestaurantNote(data);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar la nota');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDateShort = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  const getTypeLabel = (type?: RestaurantNoteType | null): string => {
    const labels: Record<RestaurantNoteType, string> = {
      OPERATIVE: 'Operativo',
      ISSUE: 'Reclamo',
      IDEA: 'Idea',
    };
    return type ? labels[type] : 'Sin tipo';
  };

  const getTypeBadgeClass = (type?: RestaurantNoteType | null): string => {
    if (!type) return 'type-badge-none';
    const classes: Record<RestaurantNoteType, string> = {
      OPERATIVE: 'type-badge-operative',
      ISSUE: 'type-badge-issue',
      IDEA: 'type-badge-idea',
    };
    return classes[type];
  };

  return (
    <div className="notes-page">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Bitácora del local</h1>
          <p className="page-subtitle">Notas internas del restaurante</p>
        </div>
        <button className="btn-primary" onClick={handleCreate}>
          + Nueva nota
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
              onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined, page: 1 })}
            />
          </div>
          <div className="filter-field">
            <label>Hasta</label>
            <input
              type="date"
              value={filters.to || ''}
              onChange={(e) => setFilters({ ...filters, to: e.target.value || undefined, page: 1 })}
            />
          </div>
          <div className="filter-field">
            <label>Tipo</label>
            <select
              value={filters.type || ''}
              onChange={(e) => setFilters({ ...filters, type: e.target.value as RestaurantNoteType || undefined, page: 1 })}
            >
              <option value="">Todos</option>
              <option value="OPERATIVE">Operativo</option>
              <option value="ISSUE">Reclamo</option>
              <option value="IDEA">Idea</option>
            </select>
          </div>
          <div className="filter-field filter-field-full">
            <label>Búsqueda</label>
            <input
              type="text"
              placeholder="Buscar en contenido..."
              value={filters.q || ''}
              onChange={(e) => setFilters({ ...filters, q: e.target.value || undefined, page: 1 })}
            />
          </div>
        </div>
      </div>

      {/* Notes List */}
      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : notes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <p className="empty-state-text">Todavía no tenés notas internas para este período</p>
          <button className="btn-secondary" onClick={handleCreate}>
            Crear primera nota
          </button>
        </div>
      ) : (
        <>
          <div className="notes-list">
            {notes.map((note) => (
              <div key={note.id} className="note-card">
                <div className="note-card-header">
                  <div className="note-card-date">{formatDateShort(note.date)}</div>
                  <span className={`type-badge ${getTypeBadgeClass(note.type)}`}>
                    {getTypeLabel(note.type)}
                  </span>
                </div>
                <div className="note-card-content">
                  {note.content}
                </div>
                <div className="note-card-actions">
                  <button className="btn-edit" onClick={() => handleEdit(note)}>
                    Editar
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(note.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > (filters.limit || 30) && (
            <div className="pagination">
              <button
                disabled={!filters.page || filters.page <= 1}
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
              >
                Anterior
              </button>
              <span>
                Página {filters.page || 1} de {Math.ceil(total / (filters.limit || 30))}
              </span>
              <button
                disabled={(filters.page || 1) >= Math.ceil(total / (filters.limit || 30))}
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
        <RestaurantNoteModal
          note={editingNote}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// Modal Component
interface RestaurantNoteModalProps {
  note: RestaurantNote | null;
  onClose: () => void;
  onSave: (data: RestaurantNoteCreateRequest) => Promise<void>;
}

function RestaurantNoteModal({ note, onClose, onSave }: RestaurantNoteModalProps) {
  const [formData, setFormData] = useState<RestaurantNoteCreateRequest>({
    date: note?.date ? new Date(note.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    type: note?.type || undefined,
    content: note?.content || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim() || formData.content.trim().length < 3) {
      alert('El contenido es requerido y debe tener al menos 3 caracteres');
      return;
    }

    setSaving(true);
    try {
      // Convert date to ISO string
      const dateObj = new Date(formData.date);
      await onSave({
        ...formData,
        date: dateObj.toISOString(),
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
          <h2>{note ? 'Editar nota' : 'Nueva nota'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Fecha y hora *</label>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Tipo</label>
            <select
              value={formData.type || ''}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as RestaurantNoteType || undefined })}
            >
              <option value="">Sin tipo</option>
              <option value="OPERATIVE">Operativo</option>
              <option value="ISSUE">Reclamo</option>
              <option value="IDEA">Idea</option>
            </select>
          </div>
          <div className="form-group">
            <label>Contenido *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={5}
              placeholder="Ej: Cambiar proveedor de pan, Reclamo cliente mesa 4, Se rompió heladera..."
              required
              minLength={3}
            />
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

export default Notes;
