// /frontend/src/pages/PublicView.jsx
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Shield, Fingerprint, Activity, ScanFace, Lock, Unlock, User, Clock, ChevronRight } from 'lucide-react';

export default function PublicView() {
  const [currentScan, setCurrentScan] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
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
      
      // Update the Sidebar Profile
      setCurrentScan(data);
      
      // Add to the recent logs table (keep only the last 10)
      setRecentLogs(prevLogs => {
        const newLogs = [data, ...prevLogs];
        return newLogs.slice(0, 10);
      });
      
      // Clear the sidebar after 5 seconds to get ready for the next person
      setTimeout(() => {
        setCurrentScan(null);
      }, 5000);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div style={{ background: '#020603', minHeight: '100vh', width: '100vw', fontFamily: 'monospace', color: '#1aff5a', display: 'flex', overflow: 'hidden' }}>
      
      {/* =========================================
          LEFT MAIN AREA (Camera & Logs)
      ========================================= */}
      <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* HEADER */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1aff5a33', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Shield size={36} style={{ color: '#1aff5a', filter: 'drop-shadow(0 0 8px #1aff5a)' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', letterSpacing: '0.3em', textTransform: 'uppercase', textShadow: '0 0 10px rgba(26,255,90,0.3)' }}>Aegis Command Center</h1>
              <p style={{ margin: 0, fontSize: '10px', letterSpacing: '0.2em', color: '#3aff6a88' }}>NODE-01 // DEBRE BERHAN SECURE FACILITY</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <HudClock />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', fontSize: '10px', letterSpacing: '0.2em', color: isConnected ? '#1aff5a' : '#ff3a3a', marginTop: '4px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isConnected ? '#1aff5a' : '#ff3a3a', animation: 'blink 1.5s infinite' }} />
              {isConnected ? 'SYSTEM ONLINE' : 'CONNECTION LOST'}
            </div>
          </div>
        </header>

        <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
          
          {/* THE 1/4 CAMERA FEED */}
          <div style={{ width: '45%', display: 'flex', flexDirection: 'column' }}>
             <div style={{ background: 'rgba(2, 10, 4, 0.8)', border: '1px solid #1aff5a44', borderRadius: '8px', overflow: 'hidden', position: 'relative', boxShadow: '0 0 20px rgba(26,255,90,0.05)', flex: 1, maxHeight: '400px' }}>
               {/* Video Feed */}
               <img 
                  src="http://localhost:5000/video_feed" 
                  alt="Scanner Feed" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.8) contrast(1.2)' }} 
                />
                {/* Visual Overlays */}
                <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(26,255,90,0.08) 4px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '12px', left: '12px', fontSize: '9px', letterSpacing: '0.2em', color: '#1aff5a', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', border: '1px solid #1aff5a44' }}>
                  <div style={{ display: 'inline-block', width: '6px', height: '6px', background: '#ff3a3a', borderRadius: '50%', marginRight: '6px', animation: 'blink 1s infinite' }}/>
                  LIVE FEED
                </div>
                <div style={{ position: 'absolute', bottom: '12px', left: '12px', fontSize: '9px', letterSpacing: '0.2em', color: '#1aff5a88' }}>
                  FACIAL RECOGNITION ACTIVE
                </div>
                {/* Cyber Frame Corners */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '20px', height: '20px', borderTop: '2px solid #1aff5a', borderLeft: '2px solid #1aff5a' }} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '20px', height: '20px', borderTop: '2px solid #1aff5a', borderRight: '2px solid #1aff5a' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '20px', height: '20px', borderBottom: '2px solid #1aff5a', borderLeft: '2px solid #1aff5a' }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '20px', height: '20px', borderBottom: '2px solid #1aff5a', borderRight: '2px solid #1aff5a' }} />
             </div>
          </div>

          {/* RECENT ACTIVITY LOGS */}
          <div style={{ flex: 1, background: '#020a04', border: '1px solid #1aff5a33', borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ background: 'rgba(26,255,90,0.05)', borderBottom: '1px solid #1aff5a22', padding: '12px 16px', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={14} /> Live Scan History
            </div>
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              {recentLogs.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3aff6a44', fontSize: '12px', letterSpacing: '0.1em' }}>
                  No recent activity logged.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recentLogs.map((log, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: index === 0 ? 'rgba(26,255,90,0.1)' : 'rgba(0,0,0,0.3)', border: `1px solid ${index === 0 ? '#1aff5a' : '#1aff5a22'}`, borderRadius: '4px', animation: 'slideIn 0.3s ease-out' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'rgba(26,255,90,0.1)', padding: '6px', borderRadius: '4px' }}><User size={16} color="#1aff5a"/></div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{log.user_name}</div>
                          <div style={{ fontSize: '10px', color: '#3aff6a88', letterSpacing: '0.1em', marginTop: '4px' }}>ID: {log.employee_id}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: '#1aff5a', border: '1px solid #1aff5a', padding: '2px 6px', borderRadius: '3px', marginBottom: '4px', display: 'inline-block' }}>GRANTED</div>
                        <div style={{ fontSize: '10px', color: '#3aff6a66', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={10}/> {new Date().toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* =========================================
          RIGHT SIDEBAR (Active Profile Dossier)
      ========================================= */}
      <aside style={{ width: '400px', background: '#010502', borderLeft: '1px solid #1aff5a44', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', position: 'relative', zIndex: 20 }}>
        
        <div style={{ padding: '24px', borderBottom: '1px solid #1aff5a22', background: 'rgba(26,255,90,0.02)' }}>
          <h2 style={{ margin: 0, fontSize: '12px', letterSpacing: '0.3em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', color: '#3aff6a' }}>
            <ScanFace size={16} /> Subject Dossier
          </h2>
        </div>

        <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: currentScan ? 'flex-start' : 'center', gap: '24px' }}>
          
          {!currentScan ? (
            // IDLE STATE
            <div style={{ textAlign: 'center', opacity: 0.5, animation: 'pulse 2s infinite' }}>
              <div style={{ width: '120px', height: '120px', border: '1px dashed #1aff5a', borderRadius: '50%', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Fingerprint size={48} color="#1aff5a" />
              </div>
              <p style={{ fontSize: '14px', letterSpacing: '0.2em', margin: 0 }}>AWAITING</p>
              <p style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#3aff6a88', marginTop: '8px' }}>BIOMETRIC INPUT</p>
            </div>
          ) : (
            // ACTIVE PROFILE STATE
            <div style={{ animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
              
              {/* Authorized Header */}
              <div style={{ background: '#1aff5a', color: '#000', padding: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', letterSpacing: '0.2em', borderRadius: '4px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 0 20px rgba(26,255,90,0.4)' }}>
                <Unlock size={20} /> ACCESS GRANTED
              </div>

              {/* Profile Photo Area */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <div style={{ width: '180px', height: '220px', background: '#020a04', border: '2px solid #1aff5a', borderRadius: '8px', position: 'relative', overflow: 'hidden', boxShadow: '0 0 30px rgba(26,255,90,0.2)' }}>
                  {/* Since socket doesn't send the image URL currently, we use a highly-styled placeholder that matches the theme */}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(26,255,90,0.05)' }}>
                    <User size={80} color="#1aff5a" style={{ opacity: 0.5 }} />
                  </div>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#1aff5a', boxShadow: '0 0 15px #1aff5a', animation: 'scanFast 1.5s infinite linear' }} />
                </div>
              </div>

              {/* User Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '10px', color: '#3aff6a66', margin: '0 0 4px 0', letterSpacing: '0.2em' }}>AGENT NAME</p>
                  <p style={{ fontSize: '24px', color: '#fff', margin: 0, textTransform: 'uppercase', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>{currentScan.user_name}</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: 'rgba(26,255,90,0.05)', padding: '12px', border: '1px solid #1aff5a22', borderRadius: '4px' }}>
                    <p style={{ fontSize: '9px', color: '#3aff6a66', margin: '0 0 4px 0', letterSpacing: '0.1em' }}>EMPLOYEE ID</p>
                    <p style={{ fontSize: '13px', color: '#1aff5a', margin: 0, fontFamily: 'monospace' }}>{currentScan.employee_id}</p>
                  </div>
                  <div style={{ background: 'rgba(26,255,90,0.05)', padding: '12px', border: '1px solid #1aff5a22', borderRadius: '4px' }}>
                    <p style={{ fontSize: '9px', color: '#3aff6a66', margin: '0 0 4px 0', letterSpacing: '0.1em' }}>TIME OF ENTRY</p>
                    <p style={{ fontSize: '13px', color: '#a0ffb0', margin: 0 }}>{new Date().toLocaleTimeString()}</p>
                  </div>
                </div>

                <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(0,0,0,0.4)', border: '1px dashed #1aff5a44', borderRadius: '4px' }}>
                  <p style={{ fontSize: '10px', color: '#3aff6a88', margin: '0 0 8px 0', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={12}/> CLEARANCE PROTOCOL
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1aff5a', fontSize: '12px' }}>
                    <ChevronRight size={14} /> Biometric Signature Verified
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1aff5a', fontSize: '12px', marginTop: '6px' }}>
                    <ChevronRight size={14} /> Security Match: 99.8%
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
        
        {/* Sidebar Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #1aff5a22', fontSize: '9px', letterSpacing: '0.2em', color: '#3aff6a44', textAlign: 'center' }}>
          SECURE CONNECTION // AES-256
        </div>
      </aside>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes pulse { 0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(26,255,90,0.2)); } 50% { transform: scale(1.05); filter: drop-shadow(0 0 25px rgba(26,255,90,0.5)); } }
        @keyframes popIn { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes slideIn { 0% { transform: translateX(-10px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        @keyframes scanFast { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }
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
  return <div style={{ fontSize: '18px', letterSpacing: '0.1em', fontWeight: 'bold', textShadow: '0 0 10px rgba(26,255,90,0.3)' }}>{time}</div>;
}