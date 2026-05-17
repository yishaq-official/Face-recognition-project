// /frontend/src/pages/Login.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, User, AlertTriangle, LogIn } from 'lucide-react';
import { setToken, isAuthenticated, API_BASE } from '../utils/authUtils';

// ── Typing animation lines shown in the terminal background ──────────────────
const BOOT_LINES = [
  'FACEGUARD SENTINEL SECURE TERMINAL v4.2.1',
  'Initializing cryptographic modules.......... OK',
  'Loading biometric matrices.................. OK',
  'Establishing secure channel AES-256......... OK',
  'Verifying hardware integrity................ OK',
  'Mounting classified database................ OK',
  'Personnel records loaded: [REDACTED]',
  'System status: OPERATIONAL',
  '─────────────────────────────────────────',
  'ADMINISTRATOR AUTHENTICATION REQUIRED',
  'All access attempts are logged and monitored.',
];

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const userRef   = useRef(null);
  const mounted   = useRef(true);
  const sessionExpired = location.state?.expired === true;   // guard against setState after unmount
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const [username,     setUsername]     = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status,       setStatus]       = useState('idle');   // idle | loading | error | lockout
  const [errorMsg,     setErrorMsg]     = useState('');
  const [attempts,     setAttempts]     = useState(0);
  const [lockoutSecs,  setLockoutSecs]  = useState(0);

  // Terminal boot lines animation
  const [visibleLines, setVisibleLines] = useState([]);
  const [bootDone,     setBootDone]     = useState(false);
  const [scanLine,     setScanLine]     = useState(0);
  const [glitch,       setGlitch]       = useState(false);

  // If already authenticated go straight to admin
  useEffect(() => {
    if (isAuthenticated()) navigate('/admin', { replace: true });
  }, [navigate]);

  // Boot sequence
  useEffect(() => {
    let i = 0;
    const next = () => {
      if (!mounted.current) return;
      if (i >= BOOT_LINES.length) {
        setBootDone(true);
        userRef.current?.focus();
        return;
      }
      const line = BOOT_LINES[i++];
      if (line !== undefined) setVisibleLines(prev => [...prev, line]);
      setTimeout(next, i === 1 ? 300 : 140 + Math.random() * 80);
    };
    setTimeout(next, 400);
  }, []);

  // Scan line
  useEffect(() => {
    const id = setInterval(() => setScanLine(p => (p >= 100 ? 0 : p + 0.3)), 16);
    return () => clearInterval(id);
  }, []);

  // Lockout countdown
  useEffect(() => {
    if (lockoutSecs <= 0) return;
    const id = setInterval(() => {
      setLockoutSecs(s => {
        if (s <= 1) { setStatus('idle'); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [lockoutSecs]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (status === 'lockout' || status === 'loading') return;
    if (!username || !password) {
      setStatus('error'); setErrorMsg('Both fields are required.'); return;
    }

    setStatus('loading');
    setErrorMsg('');

    // Brief glitch effect on submit
    setGlitch(true);
    setTimeout(() => setGlitch(false), 300);

    try {
      const res  = await fetch(`${API_BASE}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setToken(data.token);
        setStatus('idle');
        navigate('/admin', { replace: true });
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 5) {
          // Lockout for 60 seconds after 5 failed attempts
          setStatus('lockout');
          setLockoutSecs(60);
          setErrorMsg('Too many failed attempts. Terminal locked for 60 seconds.');
        } else {
          setStatus('error');
          setErrorMsg(`${data.message || 'Authentication failed.'} (${5 - newAttempts} attempts remaining)`);
        }
      }
    } catch {
      setStatus('error');
      setErrorMsg('Cannot reach SENTINEL Security Server. Check network connection.');
    }
  };

  const isLocked  = status === 'lockout';
  const isLoading = status === 'loading';

  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      background: '#010603',
      fontFamily: "'Courier New', monospace",
      color: '#1aff5a',
      display: 'flex',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Global CRT scanlines */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.13) 3px)',
      }} />

      {/* Moving scan beam across full page */}
      <div style={{
        position: 'fixed', left: 0, right: 0, top: `${scanLine}%`, height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(26,255,90,0.15), transparent)',
        pointerEvents: 'none', zIndex: 99,
      }} />

      {/* Glitch overlay */}
      {glitch && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 98, pointerEvents: 'none',
          background: 'rgba(26,255,90,0.04)',
          animation: 'glitchFlash 0.3s ease-out',
        }} />
      )}

      {/* ── LEFT PANEL — Terminal boot log ────────────────────────────── */}
      <div style={{
        flex: 1, padding: '48px 40px', display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', borderRight: '1px solid #1aff5a11',
        background: 'linear-gradient(135deg, #010603 0%, #010f04 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Radial glow */}
        <div style={{
          position: 'absolute', top: '30%', left: '20%',
          width: '500px', height: '500px',
          background: 'radial-gradient(ellipse, rgba(26,255,90,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* SENTINEL emblem top-left */}
        <div style={{ position: 'absolute', top: '40px', left: '40px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', border: '1px solid #1aff5a44', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={22} style={{ color: '#1aff5a' }} />
          </div>
          <div>
            <div style={{ fontSize: '7px', letterSpacing: '0.3em', color: '#3aff6a33', textTransform: 'uppercase' }}>
              GOVERNMENT AND DEFENSE BIOMETRIC SECURITY AGENCY
            </div>
            <div style={{ fontSize: '13px', letterSpacing: '0.3em', color: '#a0ffb0', textTransform: 'uppercase' }}>
              FACEGUARD // SENTINEL
            </div>
          </div>
        </div>

        {/* Terminal log */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#3aff6a33', marginBottom: '16px' }}>
            // SYSTEM BOOT LOG
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {visibleLines.filter(Boolean).map((line, i) => (
              <div key={i} style={{
                fontSize: '12px',
                letterSpacing: '0.08em',
                color: line.includes('OPERATIONAL') ? '#1aff5a'
                     : line.includes('REQUIRED')    ? '#ffe066'
                     : line.includes('REDACTED')    ? '#ff3a3a'
                     : line.startsWith('─')         ? '#1aff5a22'
                     : '#3aff6a77',
                animation: 'fadeSlideIn 0.2s ease-out',
              }}>
                {line.includes('REQUIRED') || line.includes('monitored')
                  ? <span style={{ color: '#ffe066' }}>{line}</span>
                  : line}
              </div>
            ))}
            {/* Blinking cursor at end */}
            {!bootDone && (
              <span style={{ fontSize: '13px', color: '#1aff5a', animation: 'blink 0.8s infinite' }}>█</span>
            )}
          </div>

          {bootDone && (
            <div style={{ marginTop: '32px', fontSize: '10px', letterSpacing: '0.15em', color: '#3aff6a33' }}>
              // Awaiting administrator credentials on SENTINEL terminal →
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL — Login form ───────────────────────────────────── */}
      <div style={{
        width: '480px', flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px',
        background: '#010502',
        position: 'relative',
      }}>
        {/* Subtle grid background */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.025, pointerEvents: 'none' }}>
          <defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1aff5a" strokeWidth="1"/>
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)" />
        </svg>

        <div style={{ width: '100%', maxWidth: '360px', position: 'relative', zIndex: 2 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              width: '64px', height: '64px', border: '1px solid #1aff5a55',
              borderRadius: '50%', margin: '0 auto 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
              boxShadow: '0 0 20px rgba(26,255,90,0.08)',
            }}>
              {/* Rotating outer ring */}
              <div style={{
                position: 'absolute', inset: '-8px',
                border: '1px solid transparent',
                borderTopColor: isLoading ? '#1aff5a' : '#1aff5a33',
                borderRadius: '50%',
                animation: isLoading ? 'spin 0.8s linear infinite' : 'spin 4s linear infinite',
              }} />
              <Lock size={26} style={{ color: '#1aff5a', filter: 'drop-shadow(0 0 6px rgba(26,255,90,0.4))' }} />
            </div>

            <h1 style={{ fontSize: '20px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#a0ffb0', margin: '0 0 6px' }}>
              Secure Access
            </h1>
            <p style={{ fontSize: '9px', letterSpacing: '0.25em', color: '#3aff6a44', textTransform: 'uppercase', margin: 0 }}>
              Administrator Terminal Authentication
            </p>
          </div>

          {/* Session expired notice */}
          {sessionExpired && (
            <div style={{
              marginBottom: '20px', padding: '12px 14px',
              background: 'rgba(255,224,102,0.06)', border: '1px solid #ffe06655',
              borderRadius: '4px', display: 'flex', alignItems: 'flex-start', gap: '10px',
              animation: 'fadeSlideIn 0.3s ease-out',
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffe066', flexShrink: 0, marginTop: '3px', animation: 'blink 1.5s infinite' }} />
              <div>
                <div style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#ffe066', textTransform: 'uppercase', marginBottom: '3px' }}>
                  Session Expired
                </div>
                <div style={{ fontSize: '11px', color: '#ffe06688', lineHeight: 1.5 }}>
                  Your session timed out after 8 hours of inactivity. Please authenticate again.
                </div>
              </div>
            </div>
          )}

          {/* Error / Lockout banner */}
          {(status === 'error' || status === 'lockout') && (
            <div style={{
              marginBottom: '20px', padding: '12px 14px',
              background: 'rgba(255,58,58,0.08)', border: '1px solid #ff3a3a55',
              borderRadius: '4px', display: 'flex', alignItems: 'flex-start', gap: '10px',
              animation: 'fadeSlideIn 0.2s ease-out',
            }}>
              <AlertTriangle size={14} color="#ff3a3a" style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <div style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#ff3a3a', textTransform: 'uppercase', marginBottom: '3px' }}>
                  {isLocked ? 'TERMINAL LOCKED' : 'AUTHENTICATION FAILED'}
                </div>
                <div style={{ fontSize: '11px', color: '#ff9999', lineHeight: 1.5 }}>{errorMsg}</div>
                {isLocked && (
                  <div style={{ fontSize: '11px', color: '#ff3a3a', marginTop: '6px', letterSpacing: '0.1em' }}>
                    Retry in: <strong>{lockoutSecs}s</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Username */}
            <div>
              <label style={labelStyle}>Username</label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#3aff6a55', pointerEvents: 'none' }} />
                <input
                  ref={userRef}
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={isLocked || isLoading}
                  autoComplete="username"
                  placeholder="admin username"
                  style={{ ...inputStyle, paddingLeft: '38px', opacity: isLocked ? 0.4 : 1 }}
                  onFocus={e  => { e.target.style.borderColor = '#1aff5a'; e.target.style.boxShadow = '0 0 8px rgba(26,255,90,0.15)'; }}
                  onBlur={e   => { e.target.style.borderColor = '#1aff5a33'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#3aff6a55', pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLocked || isLoading}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  style={{ ...inputStyle, paddingLeft: '38px', paddingRight: '42px', opacity: isLocked ? 0.4 : 1 }}
                  onFocus={e  => { e.target.style.borderColor = '#1aff5a'; e.target.style.boxShadow = '0 0 8px rgba(26,255,90,0.15)'; }}
                  onBlur={e   => { e.target.style.borderColor = '#1aff5a33'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#3aff6a55', padding: '4px', display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLocked || isLoading}
              style={{
                marginTop: '8px',
                width: '100%', padding: '14px',
                background: isLocked ? 'rgba(255,58,58,0.08)' : isLoading ? 'rgba(26,255,90,0.08)' : '#1aff5a',
                border: `1px solid ${isLocked ? '#ff3a3a55' : '#1aff5a'}`,
                borderRadius: '4px', color: isLocked ? '#ff3a3a' : isLoading ? '#1aff5a' : '#010502',
                fontFamily: "'Courier New', monospace", fontSize: '12px',
                letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 'bold',
                cursor: (isLocked || isLoading) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                transition: 'all 0.2s',
              }}
            >
              {isLocked  ? <><AlertTriangle size={15} /> TERMINAL LOCKED</> :
               isLoading ? <><div style={{ width: '14px', height: '14px', border: '2px solid #1aff5a33', borderTopColor: '#1aff5a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> AUTHENTICATING...</> :
               <><LogIn size={15} /> Authenticate</>}
            </button>
          </form>

          {/* Footer note */}
          <div style={{ marginTop: '32px', padding: '12px', background: 'rgba(26,255,90,0.02)', border: '1px solid #1aff5a11', borderRadius: '4px', fontSize: '9px', letterSpacing: '0.12em', color: '#3aff6a33', lineHeight: 1.8, textAlign: 'center' }}>
            UNAUTHORISED ACCESS IS A CRIMINAL OFFENCE UNDER ETHIOPIAN PROCLAMATION 1038/2017.
            ALL SESSIONS ARE RECORDED AND AUDITED.
          </div>

          {/* Attempt counter */}
          {attempts > 0 && !isLocked && (
            <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '9px', letterSpacing: '0.1em', color: '#ff3a3a66' }}>
              FAILED ATTEMPTS THIS SESSION: {attempts} / 5
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes blink       { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin        { to{transform:rotate(360deg)} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glitchFlash { 0%{opacity:1} 50%{opacity:0.5} 100%{opacity:0} }
      `}</style>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '9px', letterSpacing: '0.25em',
  color: '#3aff6a55', textTransform: 'uppercase', marginBottom: '7px',
};

const inputStyle = {
  width: '100%', background: 'rgba(2,10,4,0.7)',
  border: '1px solid #1aff5a33', borderRadius: '4px',
  padding: '12px 14px', color: '#a0ffb0',
  fontFamily: "'Courier New', monospace", fontSize: '13px',
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
  letterSpacing: '0.06em',
};
