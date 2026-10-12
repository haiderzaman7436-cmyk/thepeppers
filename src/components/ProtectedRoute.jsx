import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.jpg';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#fafafa',
          fontFamily: "'Inter', sans-serif"
        }}
      >
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            padding: '32px',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f3f4f6'
          }}
        >
          <img 
            src={logo} 
            alt="The Pepper's" 
            style={{ 
              height: '60px', 
              width: 'auto', 
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
            }} 
          />
          <div 
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid #fee2e2',
              borderTop: '3px solid #dc2626',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }}
          />
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>
            Verifying Authentication...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    // User is not logged in: redirect directly to login page every time
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
