import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import EditRestaurant from './pages/EditRestaurant';
import EditMenu from './pages/EditMenu';
import QRCodes from './pages/QRCodes';
import PaymentLink from './pages/PaymentLink';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/resto/login" element={<Login />} />
        <Route
          path="/resto/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/resto/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <EditRestaurant />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/resto/menu"
          element={
            <ProtectedRoute>
              <Layout>
                <EditMenu />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/resto/qr"
          element={
            <ProtectedRoute>
              <Layout>
                <QRCodes />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/resto/payment-link"
          element={
            <ProtectedRoute>
              <Layout>
                <PaymentLink />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/resto/login" replace />} />
        <Route path="*" element={<Navigate to="/resto/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
