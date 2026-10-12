import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthState";

const ProtectedRoute = ({ allowedRoles }) => {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  if (user.mustChangePassword && location.pathname !== "/change-password") return <Navigate to="/change-password" replace />;
  return <Outlet />;
};

export default ProtectedRoute;
