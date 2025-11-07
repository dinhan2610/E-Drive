import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'dealer';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const location = useLocation();
  
  // Check if user is logged in
  const userData = localStorage.getItem('e-drive-user');
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  if (!isLoggedIn || !userData) {
    // Redirect to home page if not logged in
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Parse user data to get role
  try {
    const user = JSON.parse(userData);
    const userRole = user.role || 'dealer'; // Default to dealer if no role

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
  } catch (error) {
    console.error('Error parsing user data:', error);
    return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;
