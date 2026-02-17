import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getReservation,
  createReservation,
  updateReservation,
  cancelReservation,
  linkPaymentToReservation,
  getPaymentLinks,
} from '../services/api';
import type { CreateReservationRequest, UpdateReservationRequest, ReservationSource } from '../types/reservation';
import type { PaymentLink } from '../types/paymentLink';
import { formatWhatsAppMessage, getWhatsAppUrl } from '../utils/whatsapp';
import './ReservationForm.css';

function ReservationForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');

  const [formData, setFormData] = useState<CreateReservationRequest>({
    date: new Date().toISOString().split('T')[0],
    time: '20:00',
    adults: 2,
    kids: 0,
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    notes: '',
    source: 'whatsapp',
    status: 'pending',
  });

  const [paymentForm, setPaymentForm] = useState({
    payment_link_id: '',
    url: '',
    amount: '',
    concept: '',
  });

  useEffect(() => {
    if (isEditing) {
      loadReservation();
    }
    loadPaymentLinks();
  }, [id]);

  const loadReservation = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const result = await getReservation(id);
      if (result.ok && result.data) {
        const reservation = result.data;
        setFormData({
          date: reservation.date,
          time: reservation.time,
          adults: reservation.adults,
          kids: reservation.kids,
          customer_name: reservation.customer_name,
          customer_phone: reservation.customer_phone,
          customer_email: reservation.customer_email || '',
          notes: reservation.notes || '',
          source: reservation.source,
          status: reservation.status,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la reserva');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentLinks = async () => {
    try {
      const restaurantData = JSON.parse(localStorage.getItem('restaurantData') || '{}');
      if (restaurantData?.slug) {
        const result = await getPaymentLinks(restaurantData.slug);
        if (result.ok && result.data) {
          setPaymentLinks(result.data);
        }
      }
    } catch (err) {
      console.error('Error loading payment links:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (isEditing && id) {
        const updateData: UpdateReservationRequest = {
          ...formData,
          customer_email: formData.customer_email || undefined,
          notes: formData.notes || undefined,
        };
        await updateReservation(id, updateData);
      } else {
        await createReservation(formData);
      }
      navigate('/resto/reservations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la reserva');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!isEditing || !id) return;

    try {
      await updateReservation(id, { status: 'confirmed' });
      navigate('/resto/reservations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar la reserva');
    }
  };

  const handleCancelReservation = async () => {
    if (!isEditing || !id) return;
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;

    try {
      await cancelReservation(id);
      navigate('/resto/reservations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar la reserva');
    }
  };

  const handleRequestDeposit = () => {
    setPaymentForm({
      payment_link_id: '',
      url: '',
      amount: '',
      concept: '',
    });
    setWhatsappMessage('');
    setShowPaymentModal(true);
  };

  const handleLinkPayment = async () => {
    if (!isEditing || !id) return;

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

      const result = await linkPaymentToReservation(id, data);
      if (result.ok && result.data) {
        const message = formatWhatsAppMessage(
          formData.customer_name,
          formData.date,
          formData.time,
          formData.adults,
          formData.kids,
          result.data.payment_link_url || paymentForm.url,
          result.data.deposit_amount || (paymentForm.amount ? parseFloat(paymentForm.amount) : undefined)
        );
        setWhatsappMessage(message);
        loadReservation();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al vincular el pago');
    }
  };

  if (loading) {
    return <div className="loading">Cargando reserva...</div>;
  }

  return (
    <div className="reservation-form-page">
      <div className="page-header">
        <h1>{isEditing ? 'Editar Reserva' : 'Nueva Reserva'}</h1>
        <button onClick={() => navigate('/resto/reservations')}>← Volver</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="reservation-form">
        <div className="form-row">
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
            <label>Hora *</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Adultos *</label>
            <input
              type="number"
              min="1"
              value={formData.adults}
              onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) || 1 })}
              required
            />
          </div>
          <div className="form-group">
            <label>Niños</label>
            <input
              type="number"
              min="0"
              value={formData.kids}
              onChange={(e) => setFormData({ ...formData, kids: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Nombre del cliente *</label>
          <input
            type="text"
            value={formData.customer_name}
            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Teléfono (WhatsApp) *</label>
            <input
              type="tel"
              value={formData.customer_phone}
              onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.customer_email}
              onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Origen</label>
          <select
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value as ReservationSource })}
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Teléfono</option>
            <option value="instagram">Instagram</option>
            <option value="walk_in">Walk-in</option>
            <option value="web">Web</option>
          </select>
        </div>

        <div className="form-group">
          <label>Notas</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
          />
        </div>

        {isEditing && (
          <div className="form-group">
            <label>Estado</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            >
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="cancelled">Cancelada</option>
              <option value="no_show">No se presentó</option>
              <option value="completed">Completada</option>
            </select>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          {isEditing && formData.status === 'pending' && (
            <button type="button" onClick={handleConfirm} className="btn-success">
              Confirmar
            </button>
          )}
          {isEditing && formData.status !== 'cancelled' && (
            <>
              <button type="button" onClick={handleRequestDeposit} className="btn-secondary">
                Solicitar seña
              </button>
              <button type="button" onClick={handleCancelReservation} className="btn-danger">
                Cancelar reserva
              </button>
            </>
          )}
        </div>
      </form>

      {/* Payment Link Modal */}
      {showPaymentModal && (
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
                    href={getWhatsAppUrl(formData.customer_phone, whatsappMessage)}
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

export default ReservationForm;
