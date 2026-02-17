import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getReservations,
  cancelReservation,
  markReservationPaid,
  linkPaymentToReservation,
  getPaymentLinks,
} from '../services/api';
import type { Reservation, ReservationQuery, ReservationStatus } from '../types/reservation';
import type { PaymentLink } from '../types/paymentLink';
import { formatWhatsAppMessage, getWhatsAppUrl } from '../utils/whatsapp';
import { updateReservation } from '../services/api';
import './Reservations.css';

function Reservations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [filters, setFilters] = useState<ReservationQuery>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_link_id: '',
    url: '',
    amount: '',
    concept: '',
  });
  const [whatsappMessage, setWhatsappMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load reservations
      const result = await getReservations(filters);
      if (result.ok && result.data) {
        setReservations(result.data);
      }

      // Load payment links for modal
      const restaurantData = JSON.parse(localStorage.getItem('restaurantData') || '{}');
      if (restaurantData?.slug) {
        const linksResult = await getPaymentLinks(restaurantData.slug);
        if (linksResult.ok && linksResult.data) {
          setPaymentLinks(linksResult.data);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  const handleDatePreset = (preset: 'today' | 'tomorrow' | 'week') => {
    const today = new Date();
    let from: string;
    let to: string;

    if (preset === 'today') {
      from = today.toISOString().split('T')[0];
      to = from;
    } else if (preset === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      from = tomorrow.toISOString().split('T')[0];
      to = from;
    } else {
      // week
      from = today.toISOString().split('T')[0];
      const weekLater = new Date(today);
      weekLater.setDate(weekLater.getDate() + 7);
      to = weekLater.toISOString().split('T')[0];
    }

    setFilters({ ...filters, from, to });
  };

  const handleRequestDeposit = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setPaymentForm({
      payment_link_id: reservation.payment_link_id || '',
      url: reservation.payment_link_url || '',
      amount: reservation.deposit_amount?.toString() || '',
      concept: '',
    });
    setWhatsappMessage('');
    setShowPaymentModal(true);
  };

  const handleLinkPayment = async () => {
    if (!selectedReservation) return;

    try {
      const data: any = {};
      if (paymentForm.payment_link_id) {
        data.payment_link_id = paymentForm.payment_link_id;
      } else if (paymentForm.url) {
        data.url = paymentForm.url;
        if (paymentForm.amount) data.amount = parseFloat(paymentForm.amount);
        if (paymentForm.concept) data.concept = paymentForm.concept;
      } else {
        alert('Debe seleccionar un link existente o proporcionar una URL');
        return;
      }

      const result = await linkPaymentToReservation(selectedReservation.id, data);
      if (result.ok && result.data) {
        // Generate WhatsApp message
        const message = formatWhatsAppMessage(
          selectedReservation.customer_name,
          selectedReservation.date,
          selectedReservation.time,
          selectedReservation.adults,
          selectedReservation.kids,
          result.data.payment_link_url || paymentForm.url,
          result.data.deposit_amount || (paymentForm.amount ? parseFloat(paymentForm.amount) : undefined)
        );
        setWhatsappMessage(message);
        loadData();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al vincular el pago');
    }
  };

  const handleMarkPaid = async (id: string) => {
    if (!confirm('¿Marcar esta reserva como pagada?')) return;

    try {
      await markReservationPaid(id);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al marcar como pagada');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;

    try {
      await cancelReservation(id);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cancelar la reserva');
    }
  };

  const handleConfirm = async (reservation: Reservation) => {
    try {
      const { updateReservation: updateReservationApi } = await import('../services/api');
      const updateResult = await updateReservationApi(reservation.id, { status: 'confirmed' });
      if (updateResult.ok) {
        loadData();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al confirmar la reserva');
    }
  };

  const formatDate = (date: string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (time: string): string => {
    return time.substring(0, 5); // HH:mm
  };

  const getStatusBadge = (status: ReservationStatus): string => {
    const badges: Record<ReservationStatus, string> = {
      pending: '⏳ Pendiente',
      confirmed: '✅ Confirmada',
      cancelled: '❌ Cancelada',
      no_show: '🚫 No se presentó',
      completed: '✓ Completada',
    };
    return badges[status] || status;
  };

  const getPaymentBadge = (status: string): string => {
    const badges: Record<string, string> = {
      none: '',
      requested: '💳 Seña solicitada',
      paid: '✅ Pagada',
      expired: '⏰ Expirada',
    };
    return badges[status] || '';
  };

  const getWhatsAppUrlForReservation = (reservation: Reservation): string => {
    return getWhatsAppUrl(reservation.customer_phone);
  };

  return (
    <div className="reservations-page">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Reservas</h1>
          <p className="page-subtitle">Agenda de tu restaurante</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/resto/reservations/new')}>
          + Nueva reserva
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
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
          </div>
          <div className="filter-field">
            <label>Hasta</label>
            <input
              type="date"
              value={filters.to || ''}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </div>
          <div className="filter-field">
            <label>Estado</label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as ReservationStatus || undefined })}
            >
              <option value="">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="cancelled">Cancelada</option>
              <option value="no_show">No se presentó</option>
              <option value="completed">Completada</option>
            </select>
          </div>
          <div className="filter-field">
            <label>Buscar</label>
            <input
              type="text"
              placeholder="Teléfono o nombre"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
            />
          </div>
        </div>
        <div className="quick-filters">
          <button 
            className="quick-filter-btn" 
            onClick={() => handleDatePreset('today')}
          >
            Hoy
          </button>
          <button 
            className="quick-filter-btn" 
            onClick={() => handleDatePreset('tomorrow')}
          >
            Mañana
          </button>
          <button 
            className="quick-filter-btn" 
            onClick={() => handleDatePreset('week')}
          >
            Semana
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Cargando reservas...</div>
      ) : reservations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <p className="empty-state-text">No hay reservas para los filtros seleccionados</p>
          <button 
            className="btn-secondary" 
            onClick={() => navigate('/resto/reservations/new')}
          >
            Crear nueva reserva
          </button>
        </div>
      ) : (
        <div className="reservations-list">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="reservation-card">
              <div className="reservation-header">
                <div className="reservation-date-time">
                  <span className="date">{formatDate(reservation.date)}</span>
                  <span className="time">{formatTime(reservation.time)}</span>
                </div>
                <div className="reservation-badges">
                  <span className={`status-badge status-${reservation.status}`}>
                    {getStatusBadge(reservation.status)}
                  </span>
                  {reservation.payment_status !== 'none' && (
                    <span className={`payment-badge payment-${reservation.payment_status}`}>
                      {getPaymentBadge(reservation.payment_status)}
                    </span>
                  )}
                </div>
              </div>
              <div className="reservation-body">
                <div className="customer-info">
                  <strong>{reservation.customer_name}</strong>
                  <a
                    href={getWhatsAppUrlForReservation(reservation)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-link"
                  >
                    📱 {reservation.customer_phone}
                  </a>
                  {reservation.customer_email && <span>{reservation.customer_email}</span>}
                </div>
                <div className="reservation-details">
                  <span>
                    👥 {reservation.adults} adultos
                    {reservation.kids > 0 && ` + ${reservation.kids} niños`}
                  </span>
                  <span>📅 {reservation.source}</span>
                </div>
                {reservation.notes && (
                  <div className="reservation-notes">
                    <strong>Notas:</strong> {reservation.notes}
                  </div>
                )}
              </div>
              <div className="reservation-actions">
                <button onClick={() => navigate(`/resto/reservations/${reservation.id}`)}>
                  Ver/Editar
                </button>
                {reservation.status === 'pending' && (
                  <button onClick={() => handleConfirm(reservation)}>Confirmar</button>
                )}
                {reservation.payment_status === 'none' && (
                  <button onClick={() => handleRequestDeposit(reservation)}>Solicitar seña</button>
                )}
                {reservation.payment_status === 'requested' && (
                  <button onClick={() => handleMarkPaid(reservation.id)}>Marcar pagada</button>
                )}
                {reservation.status !== 'cancelled' && (
                  <button onClick={() => handleCancel(reservation.id)} className="btn-danger">
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Link Modal */}
      {showPaymentModal && selectedReservation && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Solicitar Seña</h2>
            <div className="modal-body">
              <div className="form-group">
                <label>Usar link existente:</label>
                <select
                  value={paymentForm.payment_link_id}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_link_id: e.target.value, url: '' })}
                >
                  <option value="">Seleccionar...</option>
                  {paymentLinks.map((link) => (
                    <option key={link.id} value={link.id}>
                      {link.label} {link.amount ? `($${link.amount})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-divider">O</div>
              <div className="form-group">
                <label>Pegar URL de MercadoPago:</label>
                <input
                  type="url"
                  value={paymentForm.url}
                  onChange={(e) => setPaymentForm({ ...paymentForm, url: e.target.value, payment_link_id: '' })}
                  placeholder="https://mpago.la/..."
                />
              </div>
              <div className="form-group">
                <label>Monto (opcional):</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Concepto (opcional):</label>
                <input
                  type="text"
                  value={paymentForm.concept}
                  onChange={(e) => setPaymentForm({ ...paymentForm, concept: e.target.value })}
                  placeholder="Seña reserva"
                />
              </div>
              {whatsappMessage && (
                <div className="whatsapp-preview">
                  <label>Mensaje de WhatsApp:</label>
                  <textarea readOnly value={whatsappMessage} rows={6} />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(whatsappMessage);
                      alert('Mensaje copiado al portapapeles');
                    }}
                  >
                    📋 Copiar mensaje
                  </button>
                  <a
                    href={getWhatsAppUrl(selectedReservation.customer_phone, whatsappMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    Abrir WhatsApp
                  </a>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowPaymentModal(false)}>Cerrar</button>
              {!whatsappMessage && (
                <button onClick={handleLinkPayment} className="btn-primary">
                  Vincular y generar mensaje
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reservations;
