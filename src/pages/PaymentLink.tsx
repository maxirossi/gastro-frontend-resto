import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRestaurantData } from '../utils/auth';
import { getPaymentLinks, createPaymentLink, updatePaymentLink, deletePaymentLink, getPlaceBySlug } from '../services/api';
import type { PaymentLink, PaymentLinkCreateRequest, PaymentLinkUpdateRequest } from '../types/paymentLink';
import type { Place } from '../types/place';
import './PaymentLink.css';

function PaymentLink() {
  const navigate = useNavigate();
  const restaurantData = getRestaurantData();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [place, setPlace] = useState<Place | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState<PaymentLink | null>(null);

  const [formData, setFormData] = useState<PaymentLinkCreateRequest>({
    label: '',
    url: '',
    amount: null,
    description: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!restaurantData?.slug) {
      setError('No se encontró información del restaurante');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Cargar datos del restaurante para obtener WhatsApp
      const placeResult = await getPlaceBySlug(restaurantData.slug);
      if (placeResult.ok && placeResult.data) {
        setPlace(placeResult.data);
      }

      // Cargar payment links
      const linksResult = await getPaymentLinks(restaurantData.slug);
      if (linksResult.ok && linksResult.data) {
        setPaymentLinks(linksResult.data);
      } else {
        setError(linksResult.error || 'Error al cargar los links de pago');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? (value ? parseFloat(value) : null) : value,
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurantData?.slug) {
      setError('No se encontró información del restaurante');
      return;
    }

    if (!formData.label.trim() || !formData.url.trim()) {
      setError('La etiqueta y el link son obligatorios');
      return;
    }

    // Validar que sea una URL válida
    try {
      new URL(formData.url);
    } catch {
      setError('El link de pago debe ser una URL válida (ej: https://mpago.la/...)');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingLink) {
        // Actualizar
        const updateData: PaymentLinkUpdateRequest = {
          id: editingLink.id,
          label: formData.label.trim(),
          url: formData.url.trim(),
          amount: formData.amount || null,
          description: formData.description?.trim() || null,
        };
        const result = await updatePaymentLink(updateData);
        if (result.ok) {
          setSuccess('✅ Link de pago actualizado correctamente');
          resetForm();
          await loadData();
        } else {
          setError(result.error || 'Error al actualizar el link de pago');
        }
      } else {
        // Crear
        const result = await createPaymentLink(restaurantData.slug, {
          label: formData.label.trim(),
          url: formData.url.trim(),
          amount: formData.amount || null,
          description: formData.description?.trim() || null,
        });
        if (result.ok) {
          setSuccess('✅ Link de pago creado correctamente');
          resetForm();
          await loadData();
        } else {
          setError(result.error || 'Error al crear el link de pago');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el link de pago');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este link de pago?')) {
      return;
    }

    setDeletingId(id);
    setError('');
    setSuccess('');

    try {
      const result = await deletePaymentLink(id);
      if (result.ok) {
        setSuccess('✅ Link de pago eliminado correctamente');
        await loadData();
      } else {
        setError(result.error || 'Error al eliminar el link de pago');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el link de pago');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (link: PaymentLink) => {
    setEditingLink(link);
    setFormData({
      label: link.label,
      url: link.url,
      amount: link.amount || null,
      description: link.description || null,
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    setFormData({
      label: '',
      url: '',
      amount: null,
      description: null,
    });
    setEditingLink(null);
    setShowForm(false);
    setError('');
    setSuccess('');
  };

  const getWhatsAppPhone = (): string | null => {
    if (!place) return null;
    const contact = Array.isArray(place.place_contact) 
      ? place.place_contact[0] 
      : place.place_contact;
    return contact?.whatsapp_phone || place.whatsapp_phone || null;
  };

  const formatWhatsAppMessage = (link: PaymentLink): string => {
    const restaurantName = place?.name || 'mi restaurante';
    let message = `Hola! Quiero reservar/consultar en *${restaurantName}*.\n\n`;
    
    if (link.label) {
      message += `*${link.label}*\n`;
    }
    
    if (link.amount) {
      message += `💰 Monto: $${link.amount.toLocaleString('es-AR')}\n`;
    }
    
    if (link.description) {
      message += `${link.description}\n\n`;
    }
    
    message += `🔗 Link de pago: ${link.url}\n\n`;
    message += `Vi el local en quericorosario.com`;
    
    return message;
  };

  const getWhatsAppUrl = (link: PaymentLink): string | null => {
    const phone = getWhatsAppPhone();
    if (!phone) return null;
    
    const clean = phone.replace(/\D/g, '');
    const message = formatWhatsAppMessage(link);
    const encodedMessage = encodeURIComponent(message);
    
    return `https://wa.me/54${clean}?text=${encodedMessage}`;
  };

  const handleCopyMessage = async (link: PaymentLink) => {
    const message = formatWhatsAppMessage(link);
    try {
      await navigator.clipboard.writeText(message);
      setSuccess('✅ Mensaje copiado al portapapeles');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('No se pudo copiar el mensaje. Por favor, cópialo manualmente.');
    }
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setSuccess('✅ Link copiado al portapapeles');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('No se pudo copiar el link. Por favor, cópialo manualmente.');
    }
  };

  if (loading) {
    return (
      <div className="payment-link-page">
        <div className="loading-container">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!restaurantData) {
    return (
      <div className="payment-link-page">
        <div className="error-container">
          <p>No se encontró información del restaurante</p>
          <button onClick={() => navigate('/resto/dashboard')}>Volver al Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-link-page">
      <div className="payment-link-header">
        <h1>Links de Pago (Mercado Pago)</h1>
        <p className="subtitle">Gestioná tus links de pago para compartirlos con tus clientes</p>
      </div>

      <div className="payment-link-info">
        <div className="info-card">
          <h3>💳 ¿Qué es esto?</h3>
          <p>
            Creá y gestioná links de pago de Mercado Pago para compartirlos con tus clientes por WhatsApp.
            Los links se generan manualmente en tu cuenta de Mercado Pago y luego los guardás aquí para tenerlos organizados.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <div className="payment-links-list-section">
        <div className="list-header">
          <h2>Mis Links de Pago</h2>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="btn btn-primary"
          >
            + Nuevo Link de Pago
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="payment-link-form">
            <h3>{editingLink ? 'Editar Link de Pago' : 'Nuevo Link de Pago'}</h3>
            
            <div className="form-group">
              <label htmlFor="label">
                Etiqueta <span className="required">*</span>
              </label>
              <input
                type="text"
                id="label"
                name="label"
                value={formData.label}
                onChange={handleChange}
                placeholder="Ej: Seña reserva, Pedido delivery, etc."
                required
                maxLength={50}
              />
              <small>Nombre descriptivo para identificar este link (máx. 50 caracteres)</small>
            </div>

            <div className="form-group">
              <label htmlFor="url">
                Link de pago de Mercado Pago <span className="required">*</span>
              </label>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="https://mpago.la/..."
                required
                className="input-url"
              />
              <small>
                Copia el link de pago desde tu cuenta de Mercado Pago. 
                <a 
                  href="https://quericorosario.com/ayuda/link-de-pago-mercado-pago" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="help-link"
                >
                  ¿Cómo genero mi link de pago?
                </a>
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="amount">Monto (opcional)</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount || ''}
                onChange={handleChange}
                placeholder="Ej: 5000"
                min="0"
                step="0.01"
              />
              <small>Monto del pago (solo informativo, para referencia)</small>
            </div>

            <div className="form-group">
              <label htmlFor="description">Descripción (opcional)</label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                placeholder="Ej: Seña para reserva del sábado 21:30, 2 personas"
                rows={3}
                maxLength={200}
              />
              <small>Descripción adicional del pago (máx. 200 caracteres)</small>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Guardando...' : editingLink ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        )}

        {paymentLinks.length === 0 ? (
          <div className="empty-state">
            <p>No tenés links de pago creados aún.</p>
            <p>Creá tu primer link para empezar a compartirlo con tus clientes.</p>
          </div>
        ) : (
          <div className="payment-links-grid">
            {paymentLinks.map((link) => (
              <div key={link.id} className="payment-link-card">
                <div className="card-header">
                  <h3>{link.label}</h3>
                  <div className="card-actions">
                    <button
                      type="button"
                      onClick={() => handleEdit(link)}
                      className="btn-icon"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(link.id)}
                      className="btn-icon btn-icon-danger"
                      disabled={deletingId === link.id}
                      title="Eliminar"
                    >
                      {deletingId === link.id ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </div>

                {link.description && (
                  <p className="card-description">{link.description}</p>
                )}

                {link.amount && (
                  <p className="card-amount">💰 ${link.amount.toLocaleString('es-AR')}</p>
                )}

                <div className="card-url">
                  <code>{link.url}</code>
                </div>

                <div className="card-actions-footer">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(link.url)}
                    className="btn-action"
                  >
                    📋 Copiar link
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(link)}
                    className="btn-action"
                  >
                    💬 Copiar mensaje WhatsApp
                  </button>
                  {getWhatsAppUrl(link) && (
                    <a
                      href={getWhatsAppUrl(link)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-action btn-action-primary"
                    >
                      📱 Abrir WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentLink;
