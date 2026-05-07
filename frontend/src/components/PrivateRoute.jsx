// /frontend/src/components/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/authUtils';

/**
 * Wraps any route that requires admin authentication.
 * If the JWT is missing or expired → silently redirect to /login.
 */
export default function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}