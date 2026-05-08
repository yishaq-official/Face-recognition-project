// /frontend/src/pages/admin/AdminLayout.jsx
import { Outlet, NavLink } from 'react-router-dom';
import { Shield, Users, Activity, Database, LogOut } from 'lucide-react';
import { useAuth } from '../../components/AuthProvider';

export default function AdminLayout() {
  const { logout } = useAuth();

  const navLinkStyle = ({ isActive }) => ({
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px', borderRadius: '4px',
    fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase',
    textDecoration: 'none', transition: 'all 0.15s',
    color:      isActive ? '#1aff5a'    : '#3aff6a55',
    background: isActive ? 'rgba(26,255,90,0.08)' : 'transparent',
    borderRight: isActive ? '2px solid #1aff5a' : '2px solid transparent',
  });

  return (
    <div style={{
      minHeight: '100vh', background: '#050505',
      display: 'flex', fontFamily: "'Courier New', monospace", color: '#a0ffb0',
    }}>

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside style={{
        width: '240px', flexShrink: 0,
        background: '#010502', borderRight: '1px solid #1aff5a1a',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1aff5a11', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '34px', height: '34px', border: '1px solid #1aff5a44', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={16} style={{ color: '#1aff5a' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a0ffb0' }}>Aegis System</div>
            <div style={{ fontSize: '8px', letterSpacing: '0.2em', color: '#3aff6a33', textTransform: 'uppercase', marginTop: '2px' }}>Administrator · Level 5</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '8px', letterSpacing: '0.3em', color: '#3aff6a22', textTransform: 'uppercase', padding: '0 4px', marginBottom: '8px' }}>
            // Navigation
          </div>
          <NavLink to="/admin/members"    style={navLinkStyle}>
            <Users size={15} /> Personnel File
          </NavLink>
          <NavLink to="/admin/enrollment" style={navLinkStyle}>
            <Database size={15} /> New Enrollment
          </NavLink>
          <NavLink to="/admin/history"    style={navLinkStyle}>
            <Activity size={15} /> System Logs
          </NavLink>
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid #1aff5a11' }}>
          <button
            onClick={logout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '4px',
              fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase',
              background: 'transparent', border: '1px solid #ff3a3a22',
              color: '#ff3a3a88', cursor: 'pointer', fontFamily: "'Courier New', monospace",
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background   = 'rgba(255,58,58,0.08)';
              e.currentTarget.style.color        = '#ff3a3a';
              e.currentTarget.style.borderColor  = '#ff3a3a55';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background   = 'transparent';
              e.currentTarget.style.color        = '#ff3a3a88';
              e.currentTarget.style.borderColor  = '#ff3a3a22';
            }}
          >
            <LogOut size={15} /> Terminate Session
          </button>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}