import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Shield, Fingerprint, Activity, ScanFace, Lock, Unlock } from 'lucide-react';

export default function PublicView() {
  const [scanResult, setScanResult] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to Flask WebSocket Server
    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[SYSTEM] Connected to Security Mainframe.');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for live face recognition events
    socket.on('new_attendance', (data) => {
      console.log('[SCAN DETECTED]:', data);
      setScanResult(data);
      
      // Clear the "ACCESS GRANTED" overlay after 4 seconds
      setTimeout(() => {
        setScanResult(null);
      }, 4000);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div style={{ background: '#010402', minHeight: '100vh', width: '100vw', overflow: 'hidden', fontFamily: 'monospace', color: '#1aff5a', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      
      {/* BACKGROUND VIDEO FEED */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <img 
          src="http://localhost:5000/video_feed" 
          alt="Scanner Feed" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.9) contrast(1.3) brightness(0.7)' }} 
        />
        {/* Overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(26,255,90,0.05) 4px)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 30%, rgba(1,4,2,0.8) 100%)' }} />
      </div>

      {/* FOREGROUND HUD */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem', pointerEvents: 'none' }}>
        
        {/* TOP HUD BAR */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(26,255,90,0.3)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Shield size={48} style={{ color: '#1aff5a', filter: 'drop-shadow(0 0 10px #1aff5a)' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '2rem', letterSpacing: '0.3em', textTransform: 'uppercase', textShadow: '0 0 10px rgba(26,255,90,0.5)' }}>Aegis Node-01</h1>
              <p style={{ margin: 0, fontSize: '0.8rem', letterSpacing: '0.2em', color: '#3aff6a88' }}>MAIN ENTRANCE // DEBRE BERHAN FACILITY</p>
            </div>
          </div>

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <HudClock />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', fontSize: '0.8rem', letterSpacing: '0.2em', color: isConnected ? '#1aff5a' : '#ff3a3a' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isConnected ? '#1aff5a' : '#ff3a3a', animation: 'blink 1.5s infinite' }} />
              {isConnected ? 'UPLINK ACTIVE' : 'CONNECTION LOST'}
            </div>
          </div>
        </header>

        {/* CENTER SCANNER RETICLE */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {!scanResult ? (
            // IDLE STATE
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', opacity: 0.6 }}>
              <ScanFace size={100} style={{ color: '#1aff5a', animation: 'pulse 2s infinite' }} />
              <div style={{ fontSize: '1.2rem', letterSpacing: '0.4em', animation: 'blink 2s infinite' }}>AWAITING SUBJECT</div>
            </div>
          ) : (
            // SUCCESS STATE (ACCESS GRANTED)
            <div style={{ 
              background: 'rgba(2, 15, 6, 0.85)', border: '2px solid #1aff5a', boxShadow: '0 0 50px rgba(26,255,90,0.3)',
              padding: '3rem', borderRadius: '8px', backdropFilter: 'blur(10px)', textAlign: 'center',
              animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
              <Unlock size={80} style={{ color: '#1aff5a', margin: '0 auto 1rem', filter: 'drop-shadow(0 0 15px #1aff5a)' }} />
              <h2 style={{ margin: '0 0 0.5rem', fontSize: '3rem', letterSpacing: '0.1em', color: '#fff', textShadow: '0 0 15px rgba(255,255,255,0.5)' }}>
                {scanResult.user_name}
              </h2>
              <p style={{ margin: '0 0 2rem', fontSize: '1.2rem', letterSpacing: '0.3em', color: '#3aff6a' }}>
                ID: {scanResult.employee_id}
              </p>
              
              <div style={{ display: 'inline-block', border: '1px solid #1aff5a', padding: '0.5rem 1.5rem', background: 'rgba(26,255,90,0.1)' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '0.2em' }}>ACCESS GRANTED</span>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM DIAGNOSTICS */}
        <footer style={{ borderTop: '1px solid rgba(26,255,90,0.3)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', letterSpacing: '0.2em', color: '#3aff6a66' }}>
          <div>
            <Activity size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
            NEURAL NET ACTIVE // 128-POINT MATRICES LOADED
          </div>
          <div>
            <Fingerprint size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
            BIOMETRIC ENCRYPTION: AES-256
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes pulse { 0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px #1aff5a); } 50% { transform: scale(1.05); filter: drop-shadow(0 0 25px #1aff5a); } }
        @keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
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
  return <div style={{ fontSize: '1.5rem', letterSpacing: '0.1em', fontWeight: 'bold', textShadow: '0 0 10px rgba(26,255,90,0.3)' }}>{time}</div>;
}