import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRestaurantData } from '../utils/auth';
import { getPlaceBySlug, getMenu } from '../services/api';
import type { Place } from '../types/place';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const restaurantData = getRestaurantData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [place, setPlace] = useState<Place | null>(null);
  const [hasMenu, setHasMenu] = useState(false);
  const [checkingMenu, setCheckingMenu] = useState(false);

  useEffect(() => {
    if (!restaurantData?.slug) {
      setError('No se encontró información del restaurante');
      setLoading(false);
      return;
    }

    loadPlace();
  }, []);

  useEffect(() => {
    if (place?.slug) {
      checkMenu();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place?.slug]);

  const loadPlace = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getPlaceBySlug(restaurantData!.slug!);
      
      if (response.ok && response.data) {
        setPlace(response.data);
      } else {
        setError(response.error || 'Error al cargar los datos del restaurante');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const getLocation = () => {
    if (!place) return null;
    const location = Array.isArray(place.place_location) 
      ? place.place_location[0] 
      : place.place_location;
    return location;
  };

  const getContact = () => {
    if (!place) return null;
    const contact = Array.isArray(place.place_contact)
      ? place.place_contact[0]
      : place.place_contact;
    return contact;
  };

  const getCapacity = () => {
    if (!place) return null;
    const capacity = Array.isArray(place.place_capacity)
      ? place.place_capacity[0]
      : place.place_capacity;
    return capacity;
  };

  const checkMenu = async () => {
    if (!place?.slug) return;
    
    try {
      setCheckingMenu(true);
      const response = await getMenu(place.slug);
      setHasMenu(response.ok && response.data && Array.isArray(response.data.categories) && response.data.categories.length > 0);
    } catch (err) {
      setHasMenu(false);
    } finally {
      setCheckingMenu(false);
    }
  };

  const getProductionUrl = (path: string) => {
    if (!place?.slug) return '';
    return `https://quericorosario.com/restaurantes/${place.slug}${path}`;
  };

  const getQrCodeUrl = (url: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Podrías agregar una notificación aquí si lo deseas
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <p>Cargando información del restaurante...</p>
        </div>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="dashboard">
        <div className="error-container">
          <p>{error || 'No se encontró el restaurante'}</p>
          <button onClick={loadPlace}>Reintentar</button>
        </div>
      </div>
    );
  }

  const location = getLocation();
  const contact = getContact();
  const capacity = getCapacity();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{place.name}</h1>
        <div className="dashboard-actions">
          <button 
            className="btn-edit"
            onClick={() => navigate('/resto/menu')}
          >
            Editar menú
          </button>
          <button 
            className="btn-edit"
            onClick={() => navigate('/resto/edit')}
          >
            Editar datos
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="info-card metrics-card">
          <h2>📈 Visibilidad de tu restaurante</h2>
          <div className="metrics-content">
            <div className="metric-item">
              <span className="metric-icon">👀</span>
              <div className="metric-info">
                <span className="metric-label">Visitas este mes:</span>
                <span className="metric-value">Próximamente</span>
              </div>
            </div>
            <div className="metric-item">
              <span className="metric-icon">💬</span>
              <div className="metric-info">
                <span className="metric-label">Clicks a WhatsApp:</span>
                <span className="metric-value">Próximamente</span>
              </div>
            </div>
            <div className="metrics-note">
              <p>Próximamente vas a poder ver estadísticas reales de visitas y contactos desde QueriCoRosario.</p>
            </div>
          </div>
        </div>

        <div className="info-card">
          <h2>Información Básica</h2>
          <div className="info-item">
            <span className="info-label">Nombre:</span>
            <span className="info-value">{place.name}</span>
          </div>
          {place.description && (
            <div className="info-item">
              <span className="info-label">Descripción:</span>
              <span className="info-value">{place.description}</span>
            </div>
          )}
          <div className="info-item">
            <span className="info-label">Estado:</span>
            <span className={`info-badge ${place.is_published ? 'published' : 'unpublished'}`}>
              {place.is_published ? 'Publicado' : 'No publicado'}
            </span>
          </div>
          {place.category_key && (
            <div className="info-item">
              <span className="info-label">Categoría:</span>
              <span className="info-value">{place.category_key}</span>
            </div>
          )}
        </div>

        <div className="info-card">
          <h2>Contacto</h2>
          {contact?.whatsapp_phone ? (
            <div className="info-item">
              <span className="info-label">WhatsApp:</span>
              <a 
                href={`https://wa.me/54${contact.whatsapp_phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="info-link"
              >
                {contact.whatsapp_phone}
              </a>
            </div>
          ) : (
            <div className="info-item">
              <span className="info-value text-muted">No especificado</span>
            </div>
          )}
          {contact?.email ? (
            <div className="info-item">
              <span className="info-label">Email:</span>
              <a href={`mailto:${contact.email}`} className="info-link">
                {contact.email}
              </a>
            </div>
          ) : (
            <div className="info-item">
              <span className="info-value text-muted">No especificado</span>
            </div>
          )}
        </div>

        <div className="info-card">
          <h2>Ubicación</h2>
          {location?.city && (
            <div className="info-item">
              <span className="info-label">Ciudad:</span>
              <span className="info-value">{location.city}</span>
            </div>
          )}
          {location?.address ? (
            <div className="info-item">
              <span className="info-label">Dirección:</span>
              <span className="info-value">{location.address}</span>
            </div>
          ) : (
            <div className="info-item">
              <span className="info-value text-muted">No especificada</span>
            </div>
          )}
          {location?.lat && location?.lng && (
            <div className="info-item">
              <span className="info-label">Coordenadas:</span>
              <span className="info-value small">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </span>
            </div>
          )}
        </div>

        <div className="info-card">
          <h2>Disponibilidad</h2>
          <div className="info-item">
            <span className="info-label">Estado:</span>
            <div className="availability-status">
              <span className={`availability-badge ${capacity?.availability ? 'open' : 'closed'}`}>
                {capacity?.availability ? '🟢 Abierto ahora' : '🟡 Cerrado ahora'}
              </span>
            </div>
          </div>
          <div className="availability-note">
            <p>⚠️ Configurá tus horarios para aparecer correctamente en el sitio.</p>
            <button 
              className="btn-edit-small"
              onClick={() => navigate('/resto/edit')}
            >
              Cambiar horarios
            </button>
          </div>
        </div>

        <div className="info-card qr-card">
          <h2>Códigos QR y URLs</h2>
          <div className="qr-section">
            <div className="qr-item">
              <h3>Página del Restaurante</h3>
              <div className="qr-content">
                <div className="qr-code-container">
                  <img 
                    src={getQrCodeUrl(getProductionUrl('/'))} 
                    alt="QR Página del Restaurante"
                    className="qr-code"
                  />
                </div>
                <div className="qr-url-container">
                  <div className="qr-url">
                    <span className="qr-url-label">URL:</span>
                    <a 
                      href={getProductionUrl('/')} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="qr-url-link"
                    >
                      {getProductionUrl('/')}
                    </a>
                  </div>
                  <button 
                    className="btn-copy"
                    onClick={() => copyToClipboard(getProductionUrl('/'))}
                  >
                    Copiar URL
                  </button>
                </div>
              </div>
              <div className="qr-explanation">
                <p>🧾 <strong>Usá este QR en mesas, flyers o redes sociales</strong></p>
                <p>📲 Los clientes acceden a tu menú y te escriben directo por WhatsApp.</p>
              </div>
            </div>

            {hasMenu && (
              <div className="qr-item">
                <h3>Menú del Restaurante</h3>
                <div className="qr-content">
                  <div className="qr-code-container">
                    <img 
                      src={getQrCodeUrl(getProductionUrl('/menu/'))} 
                      alt="QR Menú del Restaurante"
                      className="qr-code"
                    />
                  </div>
                  <div className="qr-url-container">
                    <div className="qr-url">
                      <span className="qr-url-label">URL:</span>
                      <a 
                        href={getProductionUrl('/menu/')} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="qr-url-link"
                      >
                        {getProductionUrl('/menu/')}
                      </a>
                    </div>
                    <button 
                      className="btn-copy"
                      onClick={() => copyToClipboard(getProductionUrl('/menu/'))}
                    >
                      Copiar URL
                    </button>
                  </div>
                </div>
                <div className="qr-explanation">
                  <p>🧾 <strong>Usá este QR en mesas, flyers o redes sociales</strong></p>
                  <p>📲 Los clientes acceden a tu menú y te escriben directo por WhatsApp.</p>
                </div>
              </div>
            )}

            {!hasMenu && !checkingMenu && (
              <div className="qr-item">
                <div className="qr-no-menu">
                  <p>No hay menú disponible aún. Crea un menú para generar el código QR.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;


