import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Waits out the one round trip AuthContext needs to know whether a session
 * cookie is real before deciding anything — redirecting on `ready === false`
 * would bounce a genuinely signed-in visitor straight back to /login on
 * every hard refresh. The attempted path rides along on the redirect so
 * Login can send them back where they meant to go.
 */
export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
