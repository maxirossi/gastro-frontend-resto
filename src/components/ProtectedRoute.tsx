import { Navigate } from 'react-router-dom';
import { isRestaurantAuthenticated } from '../utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!isRestaurantAuthenticated()) {
    return <Navigate to="/resto/login" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;


