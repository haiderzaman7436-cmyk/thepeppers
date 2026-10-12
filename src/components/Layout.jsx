import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Receipt, 
  Settings, 
  LogOut,
  MonitorSmartphone,
  ChevronLeft,
  ChevronRight,
  RotateCw
} from 'lucide-react';
import './Layout.css';
import logo from '../assets/logo.jpg';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(true); // Default collapsed for iPad POS

  const isPosPage = location.pathname === '/pos';

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error("Logout error", e);
    }
    navigate('/login');
  };

  const navItems = [
    { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/pos', name: 'Point of Sale', icon: <MonitorSmartphone size={20} /> },
    { path: '/inventory', name: 'Inventory', icon: <Package size={20} /> },
    { path: '/invoices', name: 'Invoices', icon: <Receipt size={20} /> },
  ];

  return (
    <div className="layout-wrapper">
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2.5rem', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
          <img src={logo} alt="The Peppers Logo" style={{ height: isCollapsed ? '40px' : '52px', width: 'auto', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition: 'all 0.3s' }} />
          {!isCollapsed && (
            <div className="sidebar-logo-text" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, lineHeight: 1.1, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>THE PEPPER'S</h1>
              <p style={{ fontSize: '0.7rem', margin: 0, color: 'var(--accent-primary)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Flavor & Spice</p>
            </div>
          )}
        </div>
        
        <nav className="nav-links">
          {navItems.map((item) => (
            <NavLink 
              key={item.path}
              to={item.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            className="nav-item w-full" 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', justifyContent: isCollapsed ? 'center' : 'flex-start' }}
          >
            <span className="icon text-secondary">
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </span>
            {!isCollapsed && <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>}
          </button>

          <button 
            className="nav-item w-full" 
            onClick={handleLogout} 
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', justifyContent: isCollapsed ? 'center' : 'flex-start' }}
          >
            <LogOut size={20} className="icon text-danger" />
            {!isCollapsed && <span className="text-danger font-bold">Logout</span>}
          </button>
        </div>
      </aside>

      <main className="main-content">
        {!isPosPage && (
          <header className="topbar">
            <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 className="text-xl font-bold">Admin Portal</h2>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#4b5563',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                title="Reload page"
              >
                <RotateCw size={13} />
                <span>Reload</span>
              </button>
            </div>
            <div className="user-profile">
              <div className="text-right">
                <p className="text-sm font-semibold text-primary">Manager</p>
                <p className="text-xs text-secondary">{user?.email || 'admin@thepeppers.com'}</p>
              </div>
              <div className="avatar">
                {user?.email ? user.email.charAt(0).toUpperCase() : 'M'}
              </div>
            </div>
          </header>
        )}

        <div className="content-area animate-fade-in" style={{ padding: isPosPage ? '1rem' : '2rem', display: isPosPage ? 'flex' : 'block' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
