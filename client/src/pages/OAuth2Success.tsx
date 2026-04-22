import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

export function OAuth2Success() {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const calledRef = useRef(false);

  useEffect(() => {
    // Prevent double-execution (React strict mode / re-renders)
    if (calledRef.current) return;
    calledRef.current = true;

    const token = searchParams.get('token');

    if (!token) {
      setError('No token received from Google login.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    loginWithToken(token)
      .then(() => navigate('/', { replace: true }))
      .catch((err) => {
        console.error('OAuth2 login failed:', err);
        setError('Failed to complete Google login.');
        setTimeout(() => navigate('/login'), 3000);
      });
  }, [searchParams, loginWithToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-red-600 text-lg font-medium">{error}</p>
            <p className="text-gray-500 mt-2">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full size-12 border-4 border-gray-200 border-t-[#009999] mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Completing Google sign-in...</p>
          </>
        )}
      </div>
    </div>
  );
}
