import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { getValidAuthData } from '../utils/authUtils';
import { getCurrentUserRole } from '../utils/roleUtils';

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

  // Parse user role (use normalized role helper so values like 'dealer_manager' map to 'dealer')
  const userRoleRaw = authData.userRole || '';
  const userRole = getCurrentUserRole();

  // Check role-based access
  if (requiredRole) {
    if (requiredRole === 'admin') {
      // Allow ADMIN or EVM_STAFF to access admin routes
      if (userRole !== 'admin' && userRole !== 'evm_staff') {
        return <Navigate to="/" replace />;
      }
    }

    if (requiredRole === 'dealer') {
      // Prevent ADMIN and EVM_STAFF from accessing dealer routes
      if (userRole === 'admin' || userRole === 'evm_staff') {
        return <Navigate to="/admin" replace />;
      }

      // Only DEALER_MANAGER and DEALER_STAFF can access dealer routes
      if (userRole !== 'dealer' && userRole !== 'staff') {
        return <Navigate to="/" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
