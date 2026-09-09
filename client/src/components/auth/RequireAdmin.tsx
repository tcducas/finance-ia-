import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/** Só entra quem tem a flag is_admin no profile. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  if (!profile?.is_admin) return <Navigate to="/app" replace />;
  return <>{children}</>;
}
