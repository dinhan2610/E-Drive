import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { getValidAuthData } from '../utils/authUtils';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'dealer';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const location = useLocation();
  
  // Check if user is logged in with valid session
  const authData = getValidAuthData();
  
  if (!authData) {
    // Redirect to home page if not logged in or session expired
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Parse user role
  const userRole = authData.userRole || 'dealer';

  // Check role-based access
  if (requiredRole) {
    if (requiredRole === 'admin' && userRole !== 'admin') {
      // Non-admin trying to access admin routes
      return <Navigate to="/" replace />;
    }
    
    if (requiredRole === 'dealer' && userRole === 'admin') {
      // Admin trying to access dealer routes - redirect to admin
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
