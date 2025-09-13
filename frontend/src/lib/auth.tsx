import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getTokenExpiry, getAccessToken } from '@/lib/api';

export function isTokenValid(): boolean {
  const tok = getAccessToken();
  if (!tok) return false;
  const exp = getTokenExpiry();
  if (!exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return exp > now;
}

export const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const location = useLocation();
  if (!isTokenValid()) {
    return <Navigate to="/login/Login" replace state={{ from: location }} />;
  }
  return children;
};

export const AuthWatcher: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const protectedPrefixes = ['/dashboard'];
    const shouldProtect = protectedPrefixes.some(p => location.pathname.startsWith(p));
    const onAuthChange = () => {
      if (shouldProtect && !isTokenValid()) {
        navigate('/login/Login', { replace: true, state: { from: location } });
      }
    };
    window.addEventListener('auth:change', onAuthChange);
    return () => window.removeEventListener('auth:change', onAuthChange);
  }, [location, navigate]);
  return null;
};
