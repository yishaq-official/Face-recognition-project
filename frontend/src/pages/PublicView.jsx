// /frontend/src/pages/PublicView.jsx
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Shield, Fingerprint, Activity, ScanFace, Unlock, Lock, User, Clock, ChevronRight, Wifi, WifiOff } from 'lucide-react';

export default function PublicView() {
  const [currentScan, setCurrentScan] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [scanLine, setScanLine] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const scanRef = useRef(null);
  const clearTimer = useRef(null);

  // Animate the scan line continuously
  useEffect(() => {
    const id = setInterval(() => {
      setScanLine(prev => (prev >= 100 ? 0 : prev + 0.5));
    }, 16);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('new_attendance', (data) => {
      // FIX: engine.py emits { name, id, clearance, status }
      // Map those keys correctly here
      const entry = {
        name:      data.name,        // was data.user_name — key mismatch fixed
        id:        data.id,          // was data.employee_id — key mismatch fixed
        clearance: data.clearance,
        status:    data.status,
        time:      new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      // Trigger glitch flash effect on new scan
      setGlitch(true);
      setTimeout(() => setGlitch(false), 400);

      setCurrentScan(entry);
      setRecentLogs(prev => [entry, ...prev].slice(0, 8));

      if (clearTimer.current) clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(() => setCurrentScan(null), 6000);
    });

    return () => {
      socket.disconnect();
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, []);

  const getClearanceColor = (level) => {
    if (!level) return '#3aff6a';
    if (level.includes('SCI'))    return '#ff3a3a';
    if (level.includes('TOP'))    return '#ffe066';
    if (level === 'SECRET')       return '#60ffaa';
    return '#3aff6a88';
  };

  return (
    <div style={{
      background: '#010603',
      minHeight: '100vh',
      width: '100vw',
      fontFamily: "'Courier New', monospace",
      color: '#1aff5a',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* === GLOBAL CRT SCANLINES OVERLAY === */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 3px)',
      }} />

      {/* === HEADER BAR === */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 28px',
        borderBottom: '1px solid #1aff5a22',
        background: 'rgba(0,8,2,0.95)',
        position: 'relative', zIndex: 10,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Shield size={28} style={{ color: '#1aff5a', filter: 'drop-shadow(0 0 6px #1aff5a)' }} />
          <div>
            <div style={{ fontSize: '18px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#a0ffb0' }}>
              AEGIS COMMAND CENTER
            </div>
            <div style={{ fontSize: '9px', letterSpacing: '0.25em', color: '#3aff6a55', marginTop: '2px' }}>
              NODE-01 // DEBRE BERHAN SECURE FACILITY
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <HudClock />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', letterSpacing: '0.2em' }}>
            {isConnected
              ? <><Wifi size={14} color="#1aff5a" /><span style={{ color: '#1aff5a' }}>SYSTEM ONLINE</span></>
              : <><WifiOff size={14} color="#ff3a3a" /><span style={{ color: '#ff3a3a' }}>CONNECTION LOST</span></>}
            <div style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: isConnected ? '#1aff5a' : '#ff3a3a',
              boxShadow: isConnected ? '0 0 6px #1aff5a' : '0 0 6px #ff3a3a',
              animation: 'blink 1.4s infinite',
            }} />
          </div>
        </div>
      </header>

      {/* === MAIN BODY === */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* -------------------------------------------------------
            LEFT COLUMN — Camera + Log
        ------------------------------------------------------- */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', gap: '16px', minWidth: 0 }}>

          {/* CAMERA FEED */}
          <div style={{
            flex: '0 0 auto',
            position: 'relative',
            border: '1px solid #1aff5a33',
            borderRadius: '6px',
            overflow: 'hidden',
            background: '#000',
            aspectRatio: '16/9',
            maxHeight: '55vh',
          }}>
            <img
              src="http://localhost:5000/video_feed"
              alt="Live scanner feed"
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                display: 'block',
                filter: `grayscale(0.7) contrast(1.15) ${glitch ? 'hue-rotate(180deg) brightness(1.4)' : ''}`,
                transition: 'filter 0.1s',
              }}
            />

            {/* Moving horizontal scan beam */}
            <div style={{
              position: 'absolute', left: 0, right: 0,
              top: `${scanLine}%`,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #1aff5a88, #1aff5a, #1aff5a88, transparent)',
              pointerEvents: 'none',
            }} />

            {/* Corner brackets */}
            {[
              { top: 8, left: 8, borderTop: '2px solid #1aff5a', borderLeft: '2px solid #1aff5a' },
              { top: 8, right: 8, borderTop: '2px solid #1aff5a', borderRight: '2px solid #1aff5a' },
              { bottom: 8, left: 8, borderBottom: '2px solid #1aff5a', borderLeft: '2px solid #1aff5a' },
              { bottom: 8, right: 8, borderBottom: '2px solid #1aff5a', borderRight: '2px solid #1aff5a' },
            ].map((s, i) => (
              <div key={i} style={{ position: 'absolute', width: '22px', height: '22px', ...s }} />
            ))}

            {/* Live badge */}
            <div style={{
              position: 'absolute', top: '14px', left: '14px',
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(0,0,0,0.7)', border: '1px solid #1aff5a44',
              padding: '4px 10px', borderRadius: '3px',
              fontSize: '10px', letterSpacing: '0.2em', color: '#1aff5a',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff3a3a', animation: 'blink 1s infinite' }} />
              LIVE FEED
            </div>

            {/* Bottom-right meta */}
            <div style={{
              position: 'absolute', bottom: '10px', right: '14px', textAlign: 'right',
              fontSize: '9px', letterSpacing: '0.15em', color: '#1aff5a66',
            }}>
              <div>CAM-01 // 1920×1080</div>
              <div style={{ marginTop: '3px' }}>FACIAL RECOGNITION ACTIVE</div>
            </div>

            {/* Glitch flash overlay */}
            {glitch && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,255,90,0.07)', pointerEvents: 'none' }} />
            )}
          </div>

          {/* RECENT ACTIVITY LOG */}
          <div style={{
            flex: 1,
            background: '#020a04',
            border: '1px solid #1aff5a22',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0,
          }}>
            <div style={{
              padding: '10px 16px',
              borderBottom: '1px solid #1aff5a1a',
              background: 'rgba(26,255,90,0.03)',
              fontSize: '10px', letterSpacing: '0.25em', color: '#3aff6a99',
              textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: '8px',
              flexShrink: 0,
            }}>
              <Activity size={13} /> Recent Scan History
              <span style={{ marginLeft: 'auto', color: '#3aff6a44' }}>{recentLogs.length} EVENTS</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {recentLogs.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3aff6a33', fontSize: '11px', letterSpacing: '0.1em' }}>
                  No events logged yet.
                </div>
              ) : recentLogs.map((log, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '9px 12px',
                  background: i === 0 ? 'rgba(26,255,90,0.07)' : 'rgba(0,0,0,0.25)',
                  border: `1px solid ${i === 0 ? '#1aff5a44' : '#1aff5a11'}`,
                  borderRadius: '4px',
                  animation: i === 0 ? 'slideIn 0.3s ease-out' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: 'rgba(26,255,90,0.08)', padding: '5px', borderRadius: '3px', display: 'flex' }}>
                      <User size={14} color="#1aff5a" />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{log.name}</div>
                      <div style={{ fontSize: '9px', color: '#3aff6a66', letterSpacing: '0.1em', marginTop: '2px' }}>
                        {log.id} &nbsp;·&nbsp;
                        <span style={{ color: getClearanceColor(log.clearance) }}>{log.clearance}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '9px', color: '#1aff5a', border: '1px solid #1aff5a44', padding: '2px 7px', borderRadius: '3px', letterSpacing: '0.1em', marginBottom: '4px' }}>GRANTED</div>
                    <div style={{ fontSize: '9px', color: '#3aff6a55', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                      <Clock size={9} /> {log.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------
            RIGHT SIDEBAR — Active Profile Dossier
        ------------------------------------------------------- */}
        <aside style={{
          width: '340px',
          flexShrink: 0,
          background: '#010502',
          borderLeft: '1px solid #1aff5a33',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}>
          {/* Sidebar header */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid #1aff5a1a',
            background: 'rgba(26,255,90,0.02)',
            fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: '8px', color: '#3aff6a',
            flexShrink: 0,
          }}>
            <ScanFace size={14} /> Subject Dossier
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: currentScan ? 'flex-start' : 'center', padding: '24px 20px', gap: '20px', overflow: 'hidden' }}>

            {!currentScan ? (
              /* IDLE STATE */
              <div style={{ textAlign: 'center', opacity: 0.45, animation: 'breathe 3s ease-in-out infinite' }}>
                <div style={{
                  width: '100px', height: '100px',
                  border: '1px dashed #1aff5a44',
                  borderRadius: '50%',
                  margin: '0 auto 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  {/* Rotating ring */}
                  <div style={{
                    position: 'absolute', inset: '-8px',
                    border: '1px solid transparent',
                    borderTopColor: '#1aff5a33',
                    borderRadius: '50%',
                    animation: 'spin 3s linear infinite',
                  }} />
                  <Fingerprint size={40} color="#1aff5a" />
                </div>
                <div style={{ fontSize: '13px', letterSpacing: '0.25em', color: '#3aff6a88' }}>AWAITING</div>
                <div style={{ fontSize: '9px', letterSpacing: '0.3em', color: '#3aff6a44', marginTop: '6px' }}>BIOMETRIC INPUT</div>
              </div>

            ) : (
              /* ACTIVE PROFILE STATE */
              <div style={{ animation: 'popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)', display: 'flex', flexDirection: 'column', gap: '18px' }}>

                {/* Access granted banner */}
                <div style={{
                  background: 'rgba(26,255,90,0.12)',
                  border: '1px solid #1aff5a88',
                  borderRadius: '4px',
                  padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  fontSize: '13px', letterSpacing: '0.2em', fontWeight: 'bold', color: '#1aff5a',
                  boxShadow: '0 0 20px rgba(26,255,90,0.08) inset',
                }}>
                  <Unlock size={18} style={{ flexShrink: 0 }} />
                  ACCESS GRANTED
                  <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: '#1aff5a', animation: 'blink 1s infinite' }} />
                </div>

                {/* Photo placeholder with scan beam */}
                <div style={{
                  width: '100%',
                  aspectRatio: '4/5',
                  maxHeight: '200px',
                  background: '#020a04',
                  border: '1px solid #1aff5a55',
                  borderRadius: '4px',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <User size={64} color="#1aff5a" style={{ opacity: 0.25 }} />
                  {/* Fast scan beam */}
                  <div style={{
                    position: 'absolute', left: 0, right: 0, height: '2px',
                    background: 'linear-gradient(90deg, transparent, #1aff5a, transparent)',
                    animation: 'scanBeam 1.8s linear infinite',
                    boxShadow: '0 0 8px #1aff5a',
                  }} />
                  {/* Corner brackets */}
                  <div style={{ position: 'absolute', top: 6, left: 6, width: '16px', height: '16px', borderTop: '1px solid #1aff5a', borderLeft: '1px solid #1aff5a' }} />
                  <div style={{ position: 'absolute', top: 6, right: 6, width: '16px', height: '16px', borderTop: '1px solid #1aff5a', borderRight: '1px solid #1aff5a' }} />
                  <div style={{ position: 'absolute', bottom: 6, left: 6, width: '16px', height: '16px', borderBottom: '1px solid #1aff5a', borderLeft: '1px solid #1aff5a' }} />
                  <div style={{ position: 'absolute', bottom: 6, right: 6, width: '16px', height: '16px', borderBottom: '1px solid #1aff5a', borderRight: '1px solid #1aff5a' }} />
                  {/* Note: to show actual photo, add image_url to the socket emit in engine.py */}
                </div>

                {/* Name & ID */}
                <div>
                  <div style={{ fontSize: '9px', color: '#3aff6a55', letterSpacing: '0.2em', marginBottom: '4px' }}>IDENTIFIED AGENT</div>
                  <div style={{ fontSize: '22px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.2 }}>
                    {currentScan.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#1aff5a', letterSpacing: '0.2em', marginTop: '4px' }}>
                    {currentScan.id}
                  </div>
                </div>

                {/* Clearance & Time */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: 'rgba(26,255,90,0.04)', border: '1px solid #1aff5a1a', borderRadius: '4px', padding: '12px' }}>
                    <div style={{ fontSize: '9px', color: '#3aff6a55', letterSpacing: '0.1em', marginBottom: '6px' }}>CLEARANCE</div>
                    <div style={{
                      fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.08em',
                      color: getClearanceColor(currentScan.clearance),
                      padding: '4px 8px', border: `1px solid ${getClearanceColor(currentScan.clearance)}44`,
                      borderRadius: '3px', background: `${getClearanceColor(currentScan.clearance)}11`,
                      display: 'inline-block',
                    }}>
                      {currentScan.clearance}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(26,255,90,0.04)', border: '1px solid #1aff5a1a', borderRadius: '4px', padding: '12px' }}>
                    <div style={{ fontSize: '9px', color: '#3aff6a55', letterSpacing: '0.1em', marginBottom: '6px' }}>TIME OF ENTRY</div>
                    <div style={{ fontSize: '12px', color: '#a0ffb0' }}>{currentScan.time}</div>
                  </div>
                </div>

                {/* Verification checklist */}
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px dashed #1aff5a22', borderRadius: '4px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {['Biometric signature verified', '128-point vector match', 'Database record active'].map((line, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#1aff5a', letterSpacing: '0.05em' }}>
                      <ChevronRight size={12} style={{ flexShrink: 0 }} />
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar footer */}
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid #1aff5a1a',
            fontSize: '9px', letterSpacing: '0.2em', color: '#3aff6a33',
            textAlign: 'center', flexShrink: 0,
          }}>
            SECURE CONNECTION // AES-256 // END-TO-END ENCRYPTED
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes breathe  { 0%,100%{opacity:0.45} 50%{opacity:0.7} }
        @keyframes popIn    { 0%{transform:scale(0.96);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes slideIn  { 0%{transform:translateX(-8px);opacity:0} 100%{transform:translateX(0);opacity:1} }
        @keyframes scanBeam { 0%{top:0} 50%{top:100%} 100%{top:0} }
      `}</style>
    </div>
  );
}

function HudClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const p = v => String(v).padStart(2, '0');
      setTime(`${p(n.getUTCHours())}:${p(n.getUTCMinutes())}:${p(n.getUTCSeconds())} UTC`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ fontSize: '16px', letterSpacing: '0.12em', fontWeight: 'bold', color: '#a0ffb0', textShadow: '0 0 8px rgba(26,255,90,0.3)' }}>
      {time}
    </div>
  );
}