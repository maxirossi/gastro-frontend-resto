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
                Mi Restaurante
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${isActive('/resto/edit') ? 'active' : ''}`}
                onClick={() => navigate('/resto/edit')}
              >
                Editar datos
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${isActive('/resto/menu') ? 'active' : ''}`}
                onClick={() => navigate('/resto/menu')}
              >
                Editar menú
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


