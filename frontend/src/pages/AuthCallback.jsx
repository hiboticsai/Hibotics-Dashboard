import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleOAuthCallback, user } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use ref to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processCallback = async () => {
      // Extract session_id from URL fragment
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace('#', ''));
      const sessionId = params.get('session_id');

      if (!sessionId) {
        toast.error('Authentication failed - no session ID');
        navigate('/login');
        return;
      }

      try {
        const userData = await handleOAuthCallback(sessionId);
        toast.success(`Welcome, ${userData.name}!`);
        
        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname);
        
        // Redirect based on role
        if (userData.role === 'admin') {
          navigate('/admin', { replace: true, state: { user: userData } });
        } else if (userData.company_id) {
          // For clients, we'd need to fetch company slug
          // For now, redirect to admin for demo purposes
          navigate('/admin', { replace: true, state: { user: userData } });
        } else {
          // New user without company assignment
          toast.info('Welcome! Contact your administrator to get access to a company portal.');
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast.error('Authentication failed');
        navigate('/login', { replace: true });
      }
    };

    processCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
