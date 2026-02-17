import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import EditRestaurant from './pages/EditRestaurant';
import EditMenu from './pages/EditMenu';
import QRCodes from './pages/QRCodes';
import PaymentLink from './pages/PaymentLink';
import CashMovements from './pages/CashMovements';
import Notes from './pages/Notes';
import Staff from './pages/Staff';
import Reservations from './pages/Reservations';
import ReservationForm from './pages/ReservationForm';
import Shifts from './pages/Shifts';
import Suppliers from './pages/Suppliers';
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
        <Route
          path="/resto/cash"
          element={
            <ProtectedRoute>
              <Layout>
                <CashMovements />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/resto/notes"
          element={
            <ProtectedRoute>
              <Layout>
                <Notes />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/resto/staff"
          element={
            <ProtectedRoute>
              <Layout>
                <Staff />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/resto/reservations"
          element={
            <ProtectedRoute>
              <Layout>
                <Reservations />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/resto/reservations/new"
          element={
            <ProtectedRoute>
              <Layout>
                <ReservationForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/resto/reservations/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ReservationForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/resto/shifts"
          element={
            <ProtectedRoute>
              <Layout>
                <Shifts />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/resto/suppliers"
          element={
            <ProtectedRoute>
              <Layout>
                <Suppliers />
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
