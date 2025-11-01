import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Login } from './components/Login';
import { ErrorBoundary } from './components/ErrorBoundary';
import { signIn, onAuthChange } from './firebase';
import './index.css';

const AuthWrapper: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setLoginLoading(true);
    setLoginError(null);

    const result = await signIn(email, password);

    if (result.success) {
      setUser(result.user);
    } else {
      setLoginError(result.error || 'Failed to sign in');
    }

    setLoginLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Login
        onLogin={handleLogin}
        loading={loginLoading}
        error={loginError}
      />
    );
  }

  return <App />;
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthWrapper />
    </ErrorBoundary>
  </React.StrictMode>
);
