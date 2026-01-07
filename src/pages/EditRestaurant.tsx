import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRestaurantData } from '../utils/auth';
import { getPlaceBySlug, updatePlace } from '../services/api';
import type { Place, PlaceLocation, PlaceContact, PlaceCapacity } from '../types/place';
import './EditRestaurant.css';

function EditRestaurant() {
  const navigate = useNavigate();
  const restaurantData = getRestaurantData();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_published: false,
    whatsapp_phone: '',
    email: '',
    city: '',
    address: '',
    availability: true,
    available_count: 0,
  });

  useEffect(() => {
    if (!restaurantData) {
      setError('No se encontró información del restaurante');
      setLoading(false);
      return;
    }

    // Si no hay slug, intentar usar el place_id o mostrar error
    const slug = restaurantData.slug;
    if (!slug) {
      setError('No se encontró el slug del restaurante. Por favor, cierra sesión y vuelve a iniciar.');
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
        const placeData = response.data;
        setPlace(placeData);

        const location = Array.isArray(placeData.place_location) 
          ? placeData.place_location[0] 
          : placeData.place_location;
        
        const contact = Array.isArray(placeData.place_contact)
          ? placeData.place_contact[0]
          : placeData.place_contact;

        const capacity = Array.isArray(placeData.place_capacity)
          ? placeData.place_capacity[0]
          : placeData.place_capacity;

        setFormData({
          name: placeData.name || '',
          description: placeData.description || '',
          is_published: placeData.is_published ?? false,
          whatsapp_phone: contact?.whatsapp_phone || '',
          email: contact?.email || '',
          city: location?.city || '',
          address: location?.address || '',
          availability: capacity?.availability === true || capacity?.availability === 'true' || capacity?.availability === 'AVAILABLE' || capacity?.availability === 'available',
          available_count: capacity?.available_count || 0,
        });
      } else {
        setError(response.error || 'Error al cargar los datos del restaurante');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
      
      setHasChanges(true);
      setSuccess(false);
      return newData;
    });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? '' : parseFloat(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: numValue,
    }));
    setHasChanges(true);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurantData?.slug) {
      setError('No se encontró información del restaurante');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const patch: any = {
        name: formData.name,
        description: formData.description,
        is_published: formData.is_published,
      };

      patch.whatsapp_phone = formData.whatsapp_phone || null;
      patch.email = formData.email || null;
      patch.address = formData.address || null;
      patch.city = formData.city || undefined;

      patch.availability = formData.availability ? 'AVAILABLE' : 'UNAVAILABLE';
      patch.available_count = formData.available_count || null;

      const result = await updatePlace({
        slug: restaurantData.slug,
        patch,
        replace_media: false,
      });

      if (result.ok) {
        setSuccess(true);
        setHasChanges(false);
        setTimeout(() => {
          loadPlace();
        }, 500);
      } else {
        setError(result.error || 'Error al guardar los cambios');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-restaurant">
        <div className="loading-container">
          <p>Cargando datos del restaurante...</p>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="edit-restaurant">
        <div className="error-container">
          <p>{error || 'No se encontró el restaurante'}</p>
          <button onClick={() => navigate('/resto/dashboard')}>Volver al Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-restaurant">
      <div className="edit-header">
        <h1>Editar Datos del Restaurante</h1>
        <p className="subtitle">{place.name}</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          ¡Cambios guardados exitosamente!
        </div>
      )}

      <form onSubmit={handleSubmit} className="edit-form">
        <section className="form-section">
          <h2>Información Básica</h2>
          
          <div className="form-group">
            <label htmlFor="name">Nombre</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nombre del restaurante"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe tu restaurante..."
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_published"
                checked={formData.is_published}
                onChange={handleChange}
              />
              <span>Restaurante publicado</span>
            </label>
            <small>Si está publicado, aparecerá en el sitio público</small>
          </div>
        </section>

        <section className="form-section">
          <h2>Contacto</h2>

          <div className="form-group">
            <label htmlFor="whatsapp_phone">WhatsApp</label>
            <input
              type="text"
              id="whatsapp_phone"
              name="whatsapp_phone"
              value={formData.whatsapp_phone}
              onChange={handleChange}
              placeholder="341123456789"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="restaurante@ejemplo.com"
            />
          </div>
        </section>

        <section className="form-section">
          <h2>Ubicación</h2>

          <div className="form-group">
            <label htmlFor="city">Ciudad</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Rosario"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Dirección</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Calle y número"
            />
          </div>
        </section>

        <section className="form-section">
          <h2>Disponibilidad</h2>

          <div className="form-group">
            <label className="switch-container">
              <span className="switch-label">Disponible</span>
              <label className="switch">
                <input
                  type="checkbox"
                  name="availability"
                  checked={formData.availability}
                  onChange={handleChange}
                />
                <span className="slider"></span>
              </label>
            </label>
            <small>Si está disponible, los clientes podrán hacer reservas</small>
          </div>

          <div className="form-group">
            <label htmlFor="available_count">Cupos disponibles</label>
            <input
              type="number"
              id="available_count"
              name="available_count"
              value={formData.available_count}
              onChange={handleNumberChange}
              min="0"
              placeholder="0"
            />
            <small>Número de mesas o lugares disponibles</small>
          </div>
        </section>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/resto/dashboard')}
            className="btn btn-secondary"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!hasChanges || saving}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditRestaurant;

