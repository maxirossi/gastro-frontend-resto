import { useState, useEffect } from 'react';
import { getRestaurantData } from '../utils/auth';
import { getPlaceBySlug, getMenu } from '../services/api';
import type { Place } from '../types/place';
import './QRCodes.css';

function QRCodes() {
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
      <div className="qr-codes-page">
        <div className="loading-container">
          <p>Cargando información del restaurante...</p>
        </div>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="qr-codes-page">
        <div className="error-container">
          <p>{error || 'No se encontró el restaurante'}</p>
          <button onClick={loadPlace}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-codes-page">
      <div className="qr-codes-header">
        <h1>Códigos QR y URLs</h1>
        <p className="qr-codes-subtitle">
          Comparte estos códigos QR y URLs para que tus clientes encuentren tu restaurante y menú fácilmente.
        </p>
      </div>

      <div className="qr-codes-content">
        <div className="qr-card">
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

export default QRCodes;
