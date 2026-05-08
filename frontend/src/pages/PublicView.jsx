// /frontend/src/pages/PublicView.jsx
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  Shield, Fingerprint, Activity, ScanFace, Unlock, User,
  Clock, ChevronRight, Wifi, WifiOff, MapPin, Briefcase,
  Lock, LayoutGrid,
} from 'lucide-react';
import { API_BASE } from '../utils/authUtils';

export default function PublicView() {
  const [currentScan, setCurrentScan] = useState(null);
  const [recentLogs,  setRecentLogs]  = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [scanLine,    setScanLine]    = useState(0);
  const [glitch,      setGlitch]      = useState(false);
  const clearTimer = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setScanLine(p => (p >= 100 ? 0 : p + 0.4)), 16);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const socket = io(API_BASE);
    socket.on('connect',    () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('new_attendance', (data) => {
      const entry = {
        name:            data.name,
        id:              data.id,
        clearance:       data.clearance,
        rank:            data.rank,
        jobTitle:        data.job_title,
        department:      data.department,
        unit:            data.unit,
        postingLocation: data.posting_location,
        accessZones:     data.access_zones || [],
        imageUrl:        data.image_url,
        time: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        }),
      };

      setGlitch(true);
      setTimeout(() => setGlitch(false), 350);
      setCurrentScan(entry);
      setRecentLogs(prev => [entry, ...prev].slice(0, 8));

      if (clearTimer.current) clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(() => setCurrentScan(null), 8000);
    });

    return () => {
      socket.disconnect();
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, []);

  return (
    <div style={{
      background: '#010603', minHeight: '100vh', width: '100vw',
      fontFamily: "'Courier New', monospace", color: '#1aff5a',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
    }}>
      {/* Global CRT scanline overlay */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.14) 3px)' }} />

      {/* HEADER */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 28px', borderBottom: '1px solid #1aff5a1a',
        background: 'rgba(0,8,2,0.96)', position: 'relative', zIndex: 10, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '38px', height: '38px', border: '1px solid #1aff5a55',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={20} style={{ color: '#1aff5a' }} />
          </div>
          <div>
            <div style={{ fontSize: '8px', letterSpacing: '0.3em', color: '#3aff6a44', textTransform: 'uppercase' }}>
              የኢትዮጵያ መረጃ እና ደህንነት አጠባበቅ ኤጀንሲ
            </div>
            <div style={{ fontSize: '15px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#a0ffb0' }}>
              INSA — Biometric Access Control
            </div>
            <div style={{ fontSize: '8px', letterSpacing: '0.2em', color: '#3aff6a33' }}>
              NODE-01 // DEBRE BERHAN SECURE FACILITY
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <HudClock />
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '10px', letterSpacing: '0.15em' }}>
            {isConnected
              ? <><Wifi size={13} color="#1aff5a" /><span style={{ color: '#1aff5a' }}>SYSTEM ONLINE</span></>
              : <><WifiOff size={13} color="#ff3a3a" /><span style={{ color: '#ff3a3a' }}>CONNECTION LOST</span></>}
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isConnected ? '#1aff5a' : '#ff3a3a', animation: 'blink 1.4s infinite' }} />
          </div>
        </div>
      </header>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '18px', gap: '14px', minWidth: 0 }}>

          {/* Camera feed */}
          <div style={{
            position: 'relative', border: '1px solid #1aff5a22', borderRadius: '6px',
            overflow: 'hidden', background: '#000', flexShrink: 0, aspectRatio: '16/9', maxHeight: '52vh',
          }}>
            <img src={`${API_BASE}/video_feed`} alt="Live scanner feed" style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              filter: `grayscale(0.65) contrast(1.1) ${glitch ? 'hue-rotate(170deg) brightness(1.3)' : ''}`,
              transition: 'filter 0.1s',
            }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: `${scanLine}%`, height: '2px',
              background: 'linear-gradient(90deg,transparent,#1aff5a66,#1aff5a,#1aff5a66,transparent)', pointerEvents: 'none' }} />
            {glitch && <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,255,90,0.06)', pointerEvents: 'none' }} />}
            {[{ top: 8, left: 8, borderTop: '2px solid #1aff5a', borderLeft: '2px solid #1aff5a' },
              { top: 8, right: 8, borderTop: '2px solid #1aff5a', borderRight: '2px solid #1aff5a' },
              { bottom: 8, left: 8, borderBottom: '2px solid #1aff5a', borderLeft: '2px solid #1aff5a' },
              { bottom: 8, right: 8, borderBottom: '2px solid #1aff5a', borderRight: '2px solid #1aff5a' },
            ].map((s, i) => <div key={i} style={{ position: 'absolute', width: '20px', height: '20px', ...s }} />)}
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(0,0,0,0.72)', border: '1px solid #1aff5a33', padding: '3px 9px', borderRadius: '3px',
              fontSize: '9px', letterSpacing: '0.2em', color: '#1aff5a' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ff3a3a', animation: 'blink 1s infinite' }} />
              LIVE FEED
            </div>
            <div style={{ position: 'absolute', bottom: 10, right: 14, textAlign: 'right', fontSize: '9px', letterSpacing: '0.12em', color: '#1aff5a44' }}>
              <div>CAM-01 // 1920×1080</div>
              <div style={{ marginTop: 2 }}>FACIAL RECOGNITION ACTIVE</div>
            </div>
          </div>

          {/* Scan log */}
          <div style={{ flex: 1, background: '#020a04', border: '1px solid #1aff5a1a', borderRadius: '6px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ padding: '9px 14px', borderBottom: '1px solid #1aff5a11', background: 'rgba(26,255,90,0.02)',
              fontSize: '9px', letterSpacing: '0.25em', color: '#3aff6a77', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0 }}>
              <Activity size={12} /> Scan History
              <span style={{ marginLeft: 'auto', color: '#3aff6a33' }}>{recentLogs.length} EVENTS</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {recentLogs.length === 0
                ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3aff6a22', fontSize: '11px' }}>No events logged yet.</div>
                : recentLogs.map((log, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 10px',
                    background: i === 0 ? 'rgba(26,255,90,0.07)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${i === 0 ? '#1aff5a33' : '#1aff5a0d'}`,
                    borderRadius: '4px', animation: i === 0 ? 'slideIn 0.3s ease-out' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <div style={{ background: 'rgba(26,255,90,0.07)', padding: '5px', borderRadius: '3px', display: 'flex', flexShrink: 0 }}>
                        <User size={13} color="#1aff5a" />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{log.name}</div>
                        <div style={{ fontSize: '9px', color: '#3aff6a55', letterSpacing: '0.08em', marginTop: '2px' }}>
                          {log.id} · {log.rank || '—'} · <span style={{ color: clearanceColor(log.clearance) }}>{log.clearance}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '9px', color: '#1aff5a', border: '1px solid #1aff5a33', padding: '2px 6px', borderRadius: '2px', letterSpacing: '0.08em', marginBottom: '3px' }}>GRANTED</div>
                      <div style={{ fontSize: '9px', color: '#3aff6a44', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                        <Clock size={8} /> {log.time}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside style={{ width: '360px', flexShrink: 0, background: '#010502', borderLeft: '1px solid #1aff5a22', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #1aff5a11', background: 'rgba(26,255,90,0.02)',
            fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: '7px', color: '#3aff6a77', flexShrink: 0 }}>
            <ScanFace size={13} /> Subject Dossier
            {currentScan && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', color: '#1aff5a', fontSize: '8px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1aff5a', animation: 'blink 1s infinite' }} />
                ACTIVE
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {!currentScan ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', opacity: 0.4, animation: 'breathe 3s ease-in-out infinite', marginTop: '40px' }}>
                <div style={{ width: '90px', height: '90px', border: '1px dashed #1aff5a33', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: '-10px', border: '1px solid transparent', borderTopColor: '#1aff5a22', borderRadius: '50%', animation: 'spin 3s linear infinite' }} />
                  <Fingerprint size={36} color="#1aff5a" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', letterSpacing: '0.25em', color: '#3aff6a88' }}>AWAITING</div>
                  <div style={{ fontSize: '9px', letterSpacing: '0.3em', color: '#3aff6a44', marginTop: '4px' }}>BIOMETRIC INPUT</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'popIn 0.35s cubic-bezier(0.175,0.885,0.32,1.275)' }}>

                {/* Access banner */}
                <div style={{ background: 'rgba(26,255,90,0.1)', border: '1px solid #1aff5a77', borderRadius: '4px',
                  padding: '9px 13px', display: 'flex', alignItems: 'center', gap: '9px',
                  fontSize: '12px', letterSpacing: '0.2em', color: '#1aff5a' }}>
                  <Unlock size={16} style={{ flexShrink: 0 }} />
                  ACCESS GRANTED
                  <span style={{ marginLeft: 'auto', fontSize: '9px', color: '#3aff6a77' }}>{currentScan.time}</span>
                </div>

                {/* Photo + identity */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: '80px', height: '96px', flexShrink: 0, border: '1px solid #1aff5a44', borderRadius: '4px', overflow: 'hidden', background: '#020a04', position: 'relative' }}>
                    {currentScan.imageUrl
                      ? <img src={currentScan.imageUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.5) contrast(1.15)' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={32} color="#1aff5a" style={{ opacity: 0.25 }} /></div>}
                    <div style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: '#1aff5a', animation: 'scanBeam 2s linear infinite' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '9px', color: '#3aff6a44', letterSpacing: '0.2em', marginBottom: '4px' }}>IDENTIFIED AGENT</div>
                    <div style={{ fontSize: '19px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.2, wordBreak: 'break-word' }}>
                      {currentScan.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#1aff5a', letterSpacing: '0.18em', marginTop: '4px' }}>{currentScan.id}</div>
                    <div style={{ marginTop: '8px' }}>
                      <span style={{
                        fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.1em',
                        color: clearanceColor(currentScan.clearance),
                        padding: '3px 8px', border: `1px solid ${clearanceColor(currentScan.clearance)}55`,
                        background: `${clearanceColor(currentScan.clearance)}11`, borderRadius: '3px',
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                      }}>
                        <Lock size={9} />{currentScan.clearance}
                      </span>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Service record */}
                <SectionTitle icon={<Briefcase size={11} />} label="Service Record" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <InfoCard label="Rank"       value={currentScan.rank     || '—'} />
                  <InfoCard label="Job Title"  value={currentScan.jobTitle || '—'} />
                  <InfoCard label="Department" value={currentScan.department || '—'} span={2} />
                  <InfoCard label="Unit"       value={currentScan.unit || '—'} />
                </div>

                <Divider />

                {/* Posting */}
                <SectionTitle icon={<MapPin size={11} />} label="Current Posting" />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(26,255,90,0.03)', border: '1px solid #1aff5a11', borderRadius: '4px', padding: '10px 12px' }}>
                  <MapPin size={14} color="#3aff6a66" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: '#a0ffb0', letterSpacing: '0.06em' }}>{currentScan.postingLocation || '—'}</span>
                </div>

                <Divider />

                {/* Access zones */}
                <SectionTitle icon={<LayoutGrid size={11} />} label="Authorised Access Zones" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {currentScan.accessZones?.length > 0
                    ? currentScan.accessZones.map(z => (
                      <span key={z} style={{ fontSize: '9px', letterSpacing: '0.12em', padding: '4px 9px', border: '1px solid #1aff5a44', borderRadius: '3px', background: 'rgba(26,255,90,0.07)', color: '#1aff5a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <ChevronRight size={9} />{z}
                      </span>
                    ))
                    : <span style={{ fontSize: '10px', color: '#3aff6a33' }}>No zones assigned</span>}
                </div>

              </div>
            )}
          </div>

          <div style={{ padding: '10px 18px', borderTop: '1px solid #1aff5a11', fontSize: '8px', letterSpacing: '0.2em', color: '#3aff6a22', textAlign: 'center', flexShrink: 0 }}>
            INSA BIOMETRIC CONTROL // AES-256 // END-TO-END ENCRYPTED
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes breathe  { 0%,100%{opacity:0.4} 50%{opacity:0.65} }
        @keyframes popIn    { 0%{transform:scale(0.96);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes slideIn  { 0%{transform:translateX(-8px);opacity:0} 100%{transform:translateX(0);opacity:1} }
        @keyframes scanBeam { 0%{top:0} 50%{top:100%} 100%{top:0} }
      `}</style>
    </div>
  );
}

const clearanceColor = (lvl) => {
  if (!lvl) return '#3aff6a';
  if (lvl.includes('SCI')) return '#ff3a3a';
  if (lvl.includes('TOP')) return '#ffe066';
  if (lvl === 'SECRET')    return '#60ffaa';
  return '#3aff6a88';
};

function Divider() {
  return <div style={{ height: '1px', background: '#1aff5a0f', margin: '2px 0' }} />;
}
function SectionTitle({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', letterSpacing: '0.2em', color: '#3aff6a55', textTransform: 'uppercase' }}>
      {icon}{label}
    </div>
  );
}
function InfoCard({ label, value, span }) {
  return (
    <div style={{ background: 'rgba(26,255,90,0.03)', border: '1px solid #1aff5a0f', borderRadius: '4px', padding: '9px 10px', gridColumn: span === 2 ? 'span 2' : undefined }}>
      <div style={{ fontSize: '8px', color: '#3aff6a44', letterSpacing: '0.15em', marginBottom: '4px', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '12px', color: '#a0ffb0', letterSpacing: '0.04em', wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
}
function HudClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const n = new Date(), p = v => String(v).padStart(2, '0');
      setTime(`${p(n.getUTCHours())}:${p(n.getUTCMinutes())}:${p(n.getUTCSeconds())} UTC`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <div style={{ fontSize: '15px', letterSpacing: '0.12em', fontWeight: 'bold', color: '#a0ffb0' }}>{time}</div>;
}