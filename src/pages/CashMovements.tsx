import { useState, useEffect } from 'react';
import {
  getCashMovements,
  getCashMovementSummary,
  createCashMovement,
  updateCashMovement,
  deleteCashMovement,
} from '../services/api';
import type {
  CashMovement,
  CashMovementListQuery,
  CashMovementSummary,
  SummaryPeriod,
  CashMovementType,
  PaymentMethod,
  CashMovementCreateRequest,
} from '../types/cashMovement';
import './CashMovements.css';

function CashMovements() {
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState('');
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<CashMovementSummary | null>(null);
  const [period, setPeriod] = useState<SummaryPeriod>('monthly');
  const [filters, setFilters] = useState<CashMovementListQuery>({
    page: 1,
    limit: 30,
  });
  const [showModal, setShowModal] = useState(false);
  const [editingMovement, setEditingMovement] = useState<CashMovement | null>(null);

  useEffect(() => {
    loadData();
  }, [filters, period]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load movements
      const movementsData = await getCashMovements(filters);
      setMovements(movementsData.items);
      setTotal(movementsData.total);

      // Load summary
      setLoadingSummary(true);
      const summaryData = await getCashMovementSummary({ period });
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
      setLoadingSummary(false);
    }
  };

  const handleCreate = () => {
    setEditingMovement(null);
    setShowModal(true);
  };

  const handleEdit = (movement: CashMovement) => {
    setEditingMovement(movement);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este movimiento?')) {
      return;
    }

    try {
      await deleteCashMovement(id);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el movimiento');
    }
  };

  const handleSave = async (data: CashMovementCreateRequest) => {
    try {
      if (editingMovement) {
        await updateCashMovement(editingMovement.id, data);
      } else {
        await createCashMovement(data);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar el movimiento');
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(amount);
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

  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    const labels: Record<PaymentMethod, string> = {
      CASH: 'Efectivo',
      MERCADO_PAGO: 'Mercado Pago',
      DEBIT: 'Débito',
      CREDIT: 'Crédito',
      TRANSFER: 'Transferencia',
      OTHER: 'Otro',
    };
    return labels[method] || method;
  };

  return (
    <div className="cash-movements-page">
      <div className="cash-movements-header">
        <h1>Caja</h1>
        <button className="btn-primary" onClick={handleCreate}>
          Nuevo movimiento
        </button>
      </div>

      <p className="cash-movements-note">
        Esto no es facturación: es un registro interno para tu control.
      </p>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card summary-card-income">
          <div className="summary-card-label">Ingresos</div>
          <div className="summary-card-value">
            {loadingSummary ? '...' : formatCurrency(summary?.totals.income || 0)}
          </div>
        </div>
        <div className="summary-card summary-card-expense">
          <div className="summary-card-label">Egresos</div>
          <div className="summary-card-value">
            {loadingSummary ? '...' : formatCurrency(summary?.totals.expense || 0)}
          </div>
        </div>
        <div className="summary-card summary-card-balance">
          <div className="summary-card-label">Saldo</div>
          <div className="summary-card-value">
            {loadingSummary ? '...' : formatCurrency(summary?.totals.balance || 0)}
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="period-selector">
        <button
          className={`period-btn ${period === 'daily' ? 'active' : ''}`}
          onClick={() => setPeriod('daily')}
        >
          Diario
        </button>
        <button
          className={`period-btn ${period === 'weekly' ? 'active' : ''}`}
          onClick={() => setPeriod('weekly')}
        >
          Semanal
        </button>
        <button
          className={`period-btn ${period === 'monthly' ? 'active' : ''}`}
          onClick={() => setPeriod('monthly')}
        >
          Mensual
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Desde</label>
          <input
            type="date"
            value={filters.from || ''}
            onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined, page: 1 })}
          />
        </div>
        <div className="filter-group">
          <label>Hasta</label>
          <input
            type="date"
            value={filters.to || ''}
            onChange={(e) => setFilters({ ...filters, to: e.target.value || undefined, page: 1 })}
          />
        </div>
        <div className="filter-group">
          <label>Tipo</label>
          <select
            value={filters.type || ''}
            onChange={(e) => setFilters({ ...filters, type: e.target.value as CashMovementType || undefined, page: 1 })}
          >
            <option value="">Todos</option>
            <option value="INCOME">Ingreso</option>
            <option value="EXPENSE">Egreso</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Medio de pago</label>
          <select
            value={filters.payment_method || ''}
            onChange={(e) => setFilters({ ...filters, payment_method: e.target.value as PaymentMethod || undefined, page: 1 })}
          >
            <option value="">Todos</option>
            <option value="CASH">Efectivo</option>
            <option value="MERCADO_PAGO">Mercado Pago</option>
            <option value="DEBIT">Débito</option>
            <option value="CREDIT">Crédito</option>
            <option value="TRANSFER">Transferencia</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>
        <div className="filter-group filter-group-search">
          <label>Búsqueda</label>
          <input
            type="text"
            placeholder="Concepto o notas..."
            value={filters.q || ''}
            onChange={(e) => setFilters({ ...filters, q: e.target.value || undefined, page: 1 })}
          />
        </div>
      </div>

      {/* Movements Table */}
      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : movements.length === 0 ? (
        <div className="empty-state">
          <p>Todavía no cargaste movimientos</p>
          <button className="btn-primary" onClick={handleCreate}>
            Crear primer movimiento
          </button>
        </div>
      ) : (
        <>
          <div className="movements-table-container">
            <table className="movements-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Concepto</th>
                  <th>Medio de pago</th>
                  <th>Monto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{formatDate(movement.date)}</td>
                    <td>
                      <span className={`type-badge ${movement.type.toLowerCase()}`}>
                        {movement.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
                      </span>
                    </td>
                    <td>{movement.concept}</td>
                    <td>{getPaymentMethodLabel(movement.payment_method)}</td>
                    <td className={movement.type === 'INCOME' ? 'amount-income' : 'amount-expense'}>
                      {movement.type === 'INCOME' ? '+' : '-'} {formatCurrency(movement.amount)}
                    </td>
                    <td>
                      <button className="btn-edit" onClick={() => handleEdit(movement)}>
                        Editar
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(movement.id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        <CashMovementModal
          movement={editingMovement}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// Modal Component
interface CashMovementModalProps {
  movement: CashMovement | null;
  onClose: () => void;
  onSave: (data: CashMovementCreateRequest) => Promise<void>;
}

function CashMovementModal({ movement, onClose, onSave }: CashMovementModalProps) {
  const [formData, setFormData] = useState<CashMovementCreateRequest>({
    date: movement?.date ? new Date(movement.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    type: movement?.type || 'INCOME',
    concept: movement?.concept || '',
    amount: movement?.amount || 0,
    payment_method: movement?.payment_method || 'CASH',
    notes: movement?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.concept.trim()) {
      alert('El concepto es requerido');
      return;
    }
    if (formData.amount <= 0) {
      alert('El monto debe ser mayor a 0');
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
          <h2>{movement ? 'Editar movimiento' : 'Nuevo movimiento'}</h2>
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
            <label>Tipo *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as CashMovementType })}
              required
            >
              <option value="INCOME">Ingreso</option>
              <option value="EXPENSE">Egreso</option>
            </select>
          </div>
          <div className="form-group">
            <label>Concepto *</label>
            <input
              type="text"
              value={formData.concept}
              onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
              placeholder="Ej: venta mostrador, proveedor, delivery..."
              required
            />
          </div>
          <div className="form-group">
            <label>Monto (ARS) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              placeholder="Ej: 8500"
              required
            />
          </div>
          <div className="form-group">
            <label>Medio de pago *</label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
              required
            >
              <option value="CASH">Efectivo</option>
              <option value="MERCADO_PAGO">Mercado Pago</option>
              <option value="DEBIT">Débito</option>
              <option value="CREDIT">Crédito</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>
          <div className="form-group">
            <label>Notas</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Notas adicionales (opcional)"
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

export default CashMovements;
