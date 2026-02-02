import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRestaurantData } from '../utils/auth';
import { getPlaceBySlug } from '../services/api';
import type { Place } from '../types/place';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const restaurantData = getRestaurantData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [place, setPlace] = useState<Place | null>(null);

  useEffect(() => {
    if (!restaurantData?.slug) {
      setError('No se encontró información del restaurante');
      setLoading(false);
      return;
    }

    loadPlace();
  }, []);

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
            <span className={`info-badge ${capacity?.availability ? 'available' : 'unavailable'}`}>
              {capacity?.availability ? 'Disponible' : 'No disponible'}
            </span>
          </div>
          {capacity?.available_count !== undefined && (
            <div className="info-item">
              <span className="info-label">Cupos disponibles:</span>
              <span className="info-value">{capacity.available_count}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;


