// /frontend/src/components/AuthProvider.jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  clearToken, isAuthenticated, tokenSecondsRemaining,
  AUTH_EXPIRED_EVENT,
} from '../utils/authUtils';
import { AuthContext } from './authContext';

// ── Public admin routes that don't need the warning banner ─────────────────
const ADMIN_PREFIX = '/admin';

// Show "session expiring" warning when this many seconds remain
const WARN_AT_SECONDS = 120;

export default function AuthProvider({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [secsLeft,    setSecsLeft]    = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const intervalRef = useRef(null);

  // ── Central logout ────────────────────────────────────────────────────────
  const logout = useCallback((reason = 'manual') => {
    clearToken();
    clearInterval(intervalRef.current);
    setShowWarning(false);
    setSecsLeft(0);

    if (reason === 'expired') {
      // Pass a flag so Login can show "session expired" message
      navigate('/login', { replace: true, state: { expired: true } });
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // ── Listen for 401 events fired by authFetch ──────────────────────────────
  useEffect(() => {
    const handle = () => logout('expired');
    window.addEventListener(AUTH_EXPIRED_EVENT, handle);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handle);
  }, [logout]);

  // ── Countdown ticker — only runs on admin pages ───────────────────────────
  useEffect(() => {
    const onAdmin = location.pathname.startsWith(ADMIN_PREFIX);
    clearInterval(intervalRef.current);

    if (!onAdmin || !isAuthenticated()) return;

    const tick = () => {
      const secs = tokenSecondsRemaining();
      setSecsLeft(secs);

      if (secs <= 0) {
        // Token just expired between API calls — auto-logout
        logout('expired');
        return;
      }
      setShowWarning(secs <= WARN_AT_SECONDS);
    };

    tick();  // run immediately
    intervalRef.current = setInterval(tick, 10_000);  // every 10s
    return () => clearInterval(intervalRef.current);
  }, [location.pathname, logout]);

  const dismissWarning = () => setShowWarning(false);

  return (
    <AuthContext.Provider value={{ logout, secsLeft, isAuthenticated }}>
      {children}

      {/* ── Session expiry warning banner ─────────────────────────────── */}
      {showWarning && location.pathname.startsWith(ADMIN_PREFIX) && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          background: '#080a06',
          border: '1px solid #ffe066',
          boxShadow: '0 0 24px rgba(255,224,102,0.15)',
          borderRadius: '6px',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: '16px',
          fontFamily: "'Courier New', monospace",
          fontSize: '12px', letterSpacing: '0.12em',
          animation: 'slideUp 0.3s ease-out',
          minWidth: '420px', maxWidth: '580px',
        }}>
          {/* Pulsing dot */}
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffe066', flexShrink: 0, animation: 'blink 1s infinite' }} />

          <div style={{ flex: 1 }}>
            <div style={{ color: '#ffe066', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '3px' }}>
              Session expiring
            </div>
            <div style={{ color: '#ffe06688' }}>
              Your session expires in{' '}
              <strong style={{ color: '#ffe066' }}>{formatSecs(secsLeft)}</strong>.
              {' '}Save your work or extend the session.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={dismissWarning}
              style={warnBtn(false)}
            >
              Dismiss
            </button>
            <button
              onClick={() => logout('expired')}
              style={warnBtn(true)}
            >
              Logout now
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translate(-50%, 16px) } to { opacity:1; transform:translate(-50%, 0) } }
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0.2} }
      `}</style>
    </AuthContext.Provider>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatSecs = (s) => {
  if (s >= 60) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${s}s`;
};

const warnBtn = (danger) => ({
  padding: '6px 14px',
  fontFamily: "'Courier New', monospace",
  fontSize: '10px', letterSpacing: '0.15em',
  textTransform: 'uppercase', cursor: 'pointer',
  borderRadius: '3px', transition: 'all 0.15s',
  background: danger ? 'rgba(255,58,58,0.12)' : 'transparent',
  border: `1px solid ${danger ? '#ff3a3a66' : '#ffe06644'}`,
  color: danger ? '#ff3a3a' : '#ffe06688',
});
