import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import './Login.css';
import logo from '../assets/logo.jpg';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, login } = useAuth();

  // If already authenticated, redirect to destination or dashboard
  useEffect(() => {
    if (user && !authLoading) {
      const redirectPath = location.state?.from?.pathname || '/';
      navigate(redirectPath, { replace: true });
    }
  }, [user, authLoading, navigate, location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      const redirectPath = location.state?.from?.pathname || '/';
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container animate-fade-in">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-container" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <img src={logo} alt="The Peppers Logo" style={{ height: '80px', width: 'auto', borderRadius: '8px' }} />
          </div>
          <h1 className="login-title">Admin Portal</h1>
          <p className="login-subtitle">Restaurant Management System</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {error && <div className="badge badge-danger" style={{ textAlign: 'center', padding: '0.75rem' }}>{error}</div>}
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="email"
                id="email"
                className="input-field w-full"
                placeholder="admin@thepeppers.com"
                style={{ paddingLeft: '2.75rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="password"
                id="password"
                className="input-field w-full"
                placeholder="••••••••"
                style={{ paddingLeft: '2.75rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full login-btn" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
