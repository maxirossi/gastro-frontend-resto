import { useNavigate, useLocation } from 'react-router-dom';
import { logout, getRestaurantData } from '../utils/auth';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const restaurantData = getRestaurantData();

  const handleLogout = () => {
    logout();
    navigate('/resto/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>RosarioGastro</h2>
          <p className="sidebar-subtitle">Admin de Restaurante</p>
        </div>
        <nav className="sidebar-nav">
          {restaurantData && (
            <div className="restaurant-info">
              <div className="restaurant-label">Restaurante</div>
              <div className="restaurant-name">
                {restaurantData.name || restaurantData.slug || 'Mi Restaurante'}
              </div>
            </div>
          )}
          <ul className="nav-menu">
            <li>
              <button
                className={`nav-item ${isActive('/resto/dashboard') ? 'active' : ''}`}
                onClick={() => navigate('/resto/dashboard')}
              >
                <span className="nav-icon">🏠</span>
                <span>Mi Restaurante</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${isActive('/resto/edit') ? 'active' : ''}`}
                onClick={() => navigate('/resto/edit')}
              >
                <span className="nav-icon">✏️</span>
                <span>Editar datos</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${isActive('/resto/menu') ? 'active' : ''}`}
                onClick={() => navigate('/resto/menu')}
              >
                <span className="nav-icon">📋</span>
                <span>Editar menú</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${isActive('/resto/qr') ? 'active' : ''}`}
                onClick={() => navigate('/resto/qr')}
              >
                <span className="nav-icon">📱</span>
                <span>Ver QRs</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${isActive('/resto/payment-link') ? 'active' : ''}`}
                onClick={() => navigate('/resto/payment-link')}
              >
                <span className="nav-icon">💳</span>
                <span>Link de pago</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${isActive('/resto/reservations') || isActive('/resto/reservations/new') || location.pathname.startsWith('/resto/reservations/') ? 'active' : ''}`}
                onClick={() => navigate('/resto/reservations')}
              >
                <span className="nav-icon">📅</span>
                <span>Reservas</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${isActive('/resto/cash') ? 'active' : ''}`}
                onClick={() => navigate('/resto/cash')}
              >
                <span className="nav-icon">💰</span>
                <span>Caja</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${isActive('/resto/suppliers') ? 'active' : ''}`}
                onClick={() => navigate('/resto/suppliers')}
              >
                <span className="nav-icon">🚚</span>
                <span>Proveedores</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${isActive('/resto/notes') ? 'active' : ''}`}
                onClick={() => navigate('/resto/notes')}
              >
                <span className="nav-icon">📝</span>
                <span>Notas</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${isActive('/resto/staff') ? 'active' : ''}`}
                onClick={() => navigate('/resto/staff')}
              >
                <span className="nav-icon">👥</span>
                <span>Personal</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${isActive('/resto/shifts') ? 'active' : ''}`}
                onClick={() => navigate('/resto/shifts')}
              >
                <span className="nav-icon">🗓️</span>
                <span>Turnos</span>
              </button>
            </li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;


