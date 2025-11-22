import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { getValidAuthData } from '../utils/authUtils';
import { isEvmStaff, getCurrentUserRole, isAdmin as isAdminRoleUtil } from '../utils/roleUtils';

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
      // Allow explicit admins or EVM staff (special admin-like accounts)
      const isAdmin = userRole === 'admin' || isAdminRoleUtil();
      if (!isAdmin && !isEvmStaff()) {
        // Non-admin and not EVM staff trying to access admin routes
        return <Navigate to="/" replace />;
      }
    }

    if (requiredRole === 'dealer') {
      // Prevent admin and EVM staff from accessing dealer routes
      if (userRole === 'admin' || isEvmStaff()) {
        return <Navigate to="/admin" replace />;
      }

      // Only 'dealer' and 'staff' front-end roles are allowed for dealer routes
      if (userRole !== 'dealer' && userRole !== 'staff') {
        return <Navigate to="/" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
